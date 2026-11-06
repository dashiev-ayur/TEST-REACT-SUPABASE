-- ============================================================================
-- Миграция: change_task_status RPC + проверки правомерности смены статусов
-- ============================================================================
--
-- Что делает эта миграция:
--
--   1. Создаёт функцию is_status_transition_allowed(from, to) — граф допустимых
--      переходов между статусами (проверка очередности, без прав).
--
--   2. Создаёт функцию can_set_task_status(task, to) — матрица прав:
--      кто (manager/executor) и при каком отношении к задаче (author/assignee)
--      может ставить конкретный статус. Учитывает правило:
--        "manager не управляет задачами других manager".
--
--   3. Создаёт RPC change_task_status(object_id, task_id, from_status,
--      to_status, comment) — единая точка смены статуса. Внутри:
--        - FOR UPDATE по (id, object_id) — защита от гонок + guard контекста;
--        - сверка from_status с БД (optimistic lock, ошибка 40001);
--        - проверка очередности перехода;
--        - проверка прав на to_status;
--        - обязательный комментарий при переводе на 'needs_rework';
--        - запись в task_status_history.
--
--   4. Закрывает возможность менять status в обход RPC двумя рубежами:
--        a) revoke update (status) на уровне грантов;
--        b) BEFORE UPDATE триггер, который падает, если status меняется
--           вне change_task_status() (RPC выставляет локальный GUC
--           app.allow_status_change = 'on').
--
--   5. Сужает RLS-политику update на tasks: manager может обновлять
--      только свои задачи (author_id = auth.uid()).
--
-- Все функции — security definer + search_path = '', чтобы:
--   - читать auth.uid() и profiles/tasks в обход RLS (внутренние проверки);
--   - не зависеть от search_path вызывающего (защита от подмены схемы).
--
-- Все ошибки бросаются с явными SQLSTATE:
--   42501 — недостаточно прав
--   P0001 — нарушение бизнес-правила (переход, комментарий)
--   P0002 — задача не найдена
--   40001 — serialization_failure (клиент должен перечитать задачу)
--
-- ============================================================================


-- ============================================================================
-- 1. Граф допустимых переходов
-- ============================================================================
-- Чистая функция: зависит только от аргументов, поэтому immutable —
-- Postgres может инлайнить/кешировать.
--
-- Правила (из ТЗ):
--   new          -> in_progress
--   in_progress  -> on_review
--   on_review    -> accepted
--   on_review    -> needs_rework
--   needs_rework -> in_progress
--
-- Всё остальное (в т.ч. from = to, возврат в new, любые переходы из accepted)
-- запрещено. Проверка НЕ смотрит на права — только на очередность.

create or replace function public.is_status_transition_allowed(
  p_from public.task_status,
  p_to   public.task_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (p_from, p_to) in (
    ('new',          'in_progress'),
    ('in_progress',  'on_review'),
    ('on_review',    'accepted'),
    ('on_review',    'needs_rework'),
    ('needs_rework', 'in_progress')
  );
$$;


-- ============================================================================
-- 2. Матрица прав: кто может ставить статус
-- ============================================================================
-- Вход: строка задачи + целевой статус. Выход: boolean.
--
-- Логика:
--   - manager  = постановщик. Может ставить статусы только своим задачам
--                (author_id = auth.uid()) => "не управляет задачами других
--                менеджеров". Разрешённые целевые статусы: accepted,
--                needs_rework (new — недостижим по графу, оставлен для полноты).
--   - executor = исполнитель. Может ставить статусы только задачам, где он
--                назначен (assignee_id = auth.uid()). Разрешённые целевые
--                статусы: in_progress, on_review.
--
-- Функция stable: обращается к profiles (данные могут меняться между
-- вызовами, но в рамках одного statement — нет).
--
-- security definer нужен, чтобы читать profiles в обход RLS (иначе
-- executor не увидит свой профиль, если политики ещё не настроены).

create or replace function public.can_set_task_status(
  p_task public.tasks,
  p_to   public.task_status
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_role public.user_role;
begin
  -- Неаутентифицированный пользователь не может ничего.
  if v_uid is null then
    return false;
  end if;

  -- Роль пользователя. Если профиля нет — отказ.
  select role into v_role from public.profiles where id = v_uid;
  if v_role is null then
    return false;
  end if;

  -- manager: только свои задачи (author_id = v_uid).
  if v_role = 'manager' then
    if p_task.author_id <> v_uid then
      return false;
    end if;
    return p_to in ('new', 'accepted', 'needs_rework');
  end if;

  -- executor: только задачи, где он назначен.
  if v_role = 'executor' then
    if p_task.assignee_id <> v_uid then
      return false;
    end if;
    return p_to in ('in_progress', 'on_review');
  end if;

  return false;
end;
$$;


-- ============================================================================
-- 3. Триггер: запрет прямого UPDATE status
-- ============================================================================
-- Второй рубеж (первый — revoke update (status) ниже).
-- Пропускает изменение status только если в текущей транзакции выставлен
-- локальный GUC app.allow_status_change = 'on'. Его выставляет RPC
-- change_task_status() через set_config(..., is_local => true).
--
-- set_config('app.allow_status_change', 'on', true) действует только
-- до конца транзакции и не утекает в пул соединений Supabase.

create or replace function public.prevent_direct_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and coalesce(current_setting('app.allow_status_change', true), 'off') <> 'on'
  then
    raise exception
      'Direct status change is not allowed. Use change_task_status() RPC.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Срабатывает только при UPDATE колонки status — остальные UPDATE не трогает.
create trigger trg_prevent_direct_status_change
before update of status on public.tasks
for each row
execute function public.prevent_direct_status_change();


-- ============================================================================
-- 4. RPC change_task_status
-- ============================================================================
-- Единственная легальная точка смены статуса.
--
-- Порядок проверок (важен для понятных ошибок клиенту):
--   1) задача найдена по (id, object_id) — иначе P0002 (guard контекста);
--   2) from_status совпадает с БД — иначе 40001 (клиент перечитает задачу);
--   3) переход разрешён графом — иначе P0001;
--   4) у пользователя есть право на to_status — иначе 42501;
--   5) комментарий не пуст при to_status = 'needs_rework' — иначе P0001;
--   6) ставим GUC, UPDATE tasks, INSERT history.
--
-- FOR UPDATE сериализует конкурентные смены статуса одной задачи:
-- два параллельных вызова не смогут оба пройти проверку from_status.
--
-- security definer — чтобы:
--   - UPDATE/INSERT в обход RLS и revoke update(status);
--   - читать auth.uid() в контексте вызывающего.
-- auth.uid() внутри security definer работает, потому что Supabase
-- прокидывает request.jwt.claims через текущую сессию.

create or replace function public.change_task_status(
  p_object_id   uuid,
  p_task_id     uuid,
  p_from_status public.task_status,
  p_to_status   public.task_status,
  p_comment     text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task    public.tasks;
  v_comment text := nullif(btrim(p_comment), '');
begin
  -- 1. Найти задачу по task_id + object_id, с блокировкой строки.
  --    object_id — guard: клиент не перепутал контекст (задача из другого
  --    объекта => "не найдено", а не "нет прав").
  select * into v_task
  from public.tasks
  where id = p_task_id
    and object_id = p_object_id
  for update;

  if not found then
    raise exception 'Task not found for given object'
      using errcode = 'P0002';
  end if;

  -- 2. from_status — optimistic lock. Если клиент прислал устаревший статус,
  --    сообщаем ему актуальный и просим перечитать.
  if v_task.status <> p_from_status then
    raise exception 'Task status changed: expected %, actual %',
      p_from_status, v_task.status
      using errcode = '40001';
  end if;

  -- 3. Очередность перехода (без прав).
  if not public.is_status_transition_allowed(p_from_status, p_to_status) then
    raise exception 'Transition % -> % is not allowed',
      p_from_status, p_to_status
      using errcode = 'P0001';
  end if;

  -- 4. Права: может ли текущий пользователь ставить p_to_status.
  if not public.can_set_task_status(v_task, p_to_status) then
    raise exception 'Permission denied to set status %', p_to_status
      using errcode = '42501';
  end if;

  -- 5. Комментарий обязателен при переводе на доработку.
  if p_to_status = 'needs_rework' and v_comment is null then
    raise exception 'Comment is required when moving to needs_rework'
      using errcode = 'P0001';
  end if;

  -- 6. Разрешаем триггеру пропустить UPDATE status (только в этой транзакции).
  perform set_config('app.allow_status_change', 'on', true);

  -- 7. Обновляем задачу.
  update public.tasks
  set status     = p_to_status,
      updated_at = now()
  where id = p_task_id;

  -- 8. Пишем историю. changed_by — текущий пользователь.
  insert into public.task_status_history
    (task_id, from_status, to_status, changed_by, comment)
  values
    (p_task_id, p_from_status, p_to_status, auth.uid(), v_comment);
end;
$$;

-- Даём право вызова только аутентифицированным.
grant execute on function
  public.change_task_status(
    uuid, uuid, public.task_status, public.task_status, text
  )
  to authenticated;


-- ============================================================================
-- 5. Первый рубеж: revoke update(status) на уровне грантов
-- ============================================================================
-- Политики RLS не умеют запрещать изменение отдельных колонок. Если у
-- authenticated есть UPDATE на tasks (а он есть — через политики), клиент
-- может сделать PATCH /tasks?id=eq... с {"status":"accepted"}.
-- Отзываем UPDATE на колонку status у authenticated/anon.
--
-- ВАЖНО: security definer функция change_task_status() работает от владельца
-- таблицы — на неё revoke не влияет.
--
-- Если приложение обновляет другие колонки через API — оставляем UPDATE
-- на остальные колонки явно. При необходимости расширьте список.

revoke update (status) on public.tasks from authenticated, anon;

grant update (title, description, assignee_id, object_id, updated_at)
  on public.tasks to authenticated;


-- ============================================================================
-- 6. Сужаем RLS-политику UPDATE на tasks
-- ============================================================================
-- Старая политика "Tasks update for manager" разрешала manager обновлять
-- любые задачи (в т.ч. чужие). Согласно правилу "manager не управляет
-- задачами других менеджеров" — сужаем до author_id = auth.uid().
--
-- Исполнителю обновление tasks напрямую не нужно: статус меняется через RPC
-- (security definer), а остальные поля он не редактирует. Поэтому политику
-- UPDATE для executor не создаём.

drop policy if exists "Tasks update for manager" on public.tasks;

create policy "Tasks update for author-manager"
on public.tasks for update
to authenticated
using ( public.is_manager() and author_id = auth.uid() )
with check ( public.is_manager() and author_id = auth.uid() );


-- ============================================================================
-- Готово.
-- ============================================================================
-- Проверка после применения:
--
--   -- 1. RPC доступен:
--   select proname, prosecdef, proacl
--   from pg_proc
--   where proname in ('change_task_status','can_set_task_status',
--                     'is_status_transition_allowed','prevent_direct_status_change');
--
--   -- 2. Триггер на месте:
--   select tgname from pg_trigger
--   where tgrelid = 'public.tasks'::regclass and tgname = 'trg_prevent_direct_status_change';
--
--   -- 3. Прямой UPDATE status должен падать:
--   --    update public.tasks set status = 'accepted' where id = '<id>';
--   --    => ERROR: Direct status change is not allowed.
--
--   -- 4. RPC должен работать (под JWT manager-автора задачи):
--   --    select public.change_task_status('<obj>', '<task>', 'on_review', 'accepted', null);
-- ============================================================================