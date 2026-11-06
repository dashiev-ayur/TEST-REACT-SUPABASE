-- ============================================================================
-- Миграция: get_task_available_transitions + общий хелпер + переписанный
--            change_task_status через общий хелпер
-- ============================================================================
--
-- Что делает:
--
--   1. is_task_transition_allowed(task, to) — общая проверка
--      "граф + права" для одной пары (task, to_status). Используется
--      и в get_task_available_transitions, и в change_task_status.
--      Гарантирует: если get_... вернул 'allow', то change_task_status
--      с теми же (auth.uid(), task, to) не упадёт на проверке прав/графа.
--
--   2. get_task_available_transitions(object_id, task_id, from_status) —
--      read-only RPC для UI. Возвращает:
--        {
--          expected_status: <что прислал клиент>,
--          current_status:  <актуальный статус из БД>,
--          stale:           <true, если expected != current>,
--          transitions: {
--            <status>: 'allow' | 'disallow',
--            ... по всем значениям enum task_status
--          }
--        }
--      transitions считаются от АКТУАЛЬНОГО статуса (current_status),
--      а не от expected — чтобы после F5 клиент сразу видел правильные
--      кнопки без второго запроса. stale=true — сигнал "покажи уведомление,
--      статус изменился".
--
--      Комментарий НЕ учитывается (правило "needs_rework требует комментарий"
--      остаётся в change_task_status и документируется как контракт формы).
--
--   3. change_task_status(object_id, task_id, from_status, to_status, comment)
--      — переписан через is_task_transition_allowed. Логика та же, что была,
--      + object_id guard + единый хелпер. from_status остаётся optimistic
--      lock'ом: при несовпадении — 40001 (клиент делает F5).
--
--   4. drop старой перегрузки change_task_status(uuid, task_status, text),
--      чтобы не было двух версий. Если клиент ещё вызывает старую —
--      обновите вызовы на новую сигнатуру с object_id.
--
-- SQLSTATE:
--   42501 — недостаточно прав
--   P0001 — нарушение бизнес-правила (переход, комментарий)
--   P0002 — задача не найдена
--   40001 — serialization_failure (from_status устарел)
--
-- ============================================================================


-- ============================================================================
-- 1. Общий хелпер: граф + права для пары (task, to_status)
-- ============================================================================
-- Возвращает true, если переход task.status -> p_to разрешён графом
-- И у текущего пользователя есть право ставить p_to.
--
-- НЕ проверяет:
--   - совпадение from_status с БД (это делает вызывающий);
--   - комментарий для needs_rework (это делает change_task_status).
--
-- security definer — чтобы читать profiles в обход RLS (как can_set_task_status).
-- stable — не пишет в БД.

create or replace function public.is_task_transition_allowed(
  p_task public.tasks,
  p_to   public.task_status
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- 1. Переход должен быть в графе (очередность).
  if not public.is_status_transition_allowed(p_task.status, p_to) then
    return false;
  end if;

  -- 2. Права: может ли текущий пользователь ставить p_to.
  return public.can_set_task_status(p_task, p_to);
end;
$$;


-- ============================================================================
-- 2. get_task_available_transitions — read-only RPC для UI
-- ============================================================================
-- object_id — guard контекста (задача должна принадлежать объекту).
-- from_status — ожидание клиента; используется только для stale-детекта.
-- transitions считаются от АКТУАЛЬНОГО статуса (current_status).
--
-- Формат ответа:
--   {
--     "expected_status": "new",
--     "current_status": "in_progress",
--     "stale": true,
--     "transitions": {
--       "new": "disallow",
--       "in_progress": "disallow",
--       "on_review": "allow",
--       "accepted": "disallow",
--       "needs_rework": "disallow"
--     }
--   }
--
-- Переход в тот же статус всегда 'disallow' (is_status_transition_allowed
-- не содержит пар (x, x), так что это получается автоматически).
--
-- jsonb_object_agg + enum_range — новые значения enum подхватываются
-- автоматически, без правки функции.

create or replace function public.get_task_available_transitions(
  p_object_id   uuid,
  p_task_id     uuid,
  p_from_status public.task_status
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  -- Guard контекста: задача должна принадлежать объекту.
  select * into v_task
  from public.tasks
  where id = p_task_id
    and object_id = p_object_id;

  if not found then
    raise exception 'Task not found for given object'
      using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'expected_status', p_from_status,
    'current_status',  v_task.status,
    'stale',           (v_task.status is distinct from p_from_status),
    'transitions', coalesce(
      (
        select jsonb_object_agg(
          s.status::text,
          case
            when public.is_task_transition_allowed(v_task, s.status)
              then 'allow'
            else 'disallow'
          end
        )
        from unnest(enum_range(null::public.task_status)) as s(status)
      ),
      '{}'::jsonb
    )
  );
end;
$$;

grant execute on function
  public.get_task_available_transitions(uuid, uuid, public.task_status)
  to authenticated;


-- ============================================================================
-- 3. change_task_status — переписан через is_task_transition_allowed
-- ============================================================================
-- Сигнатура изменилась: добавлен p_object_id первым параметром (для
-- симметрии с get_... и guard'а контекста). Старая перегрузка удаляется
-- ниже, чтобы не было двух версий.
--
-- Порядок проверок:
--   1) задача найдена по (id, object_id) — FOR UPDATE;
--   2) from_status совпадает с БД — иначе 40001 (клиент делает F5);
--   3) is_task_transition_allowed(task, to) — граф + права;
--   4) комментарий для needs_rework;
--   5) set_config, UPDATE, INSERT history.

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
  -- 1. Найти задачу по (id, object_id) с блокировкой строки.
  select * into v_task
  from public.tasks
  where id = p_task_id
    and object_id = p_object_id
  for update;

  if not found then
    raise exception 'Task not found for given object'
      using errcode = 'P0002';
  end if;

  -- 2. from_status — optimistic lock.
  if v_task.status is distinct from p_from_status then
    raise exception 'Task status changed: expected %, actual %',
      p_from_status, v_task.status
      using errcode = '40001';
  end if;

  -- 3. Граф + права (общий хелпер с get_task_available_transitions).
  if not public.is_task_transition_allowed(v_task, p_to_status) then
    raise exception 'Transition % -> % is not allowed for current user',
      v_task.status, p_to_status
      using errcode = '42501';
  end if;

  -- 4. Комментарий для needs_rework (execution-time правило, не часть матрицы).
  if p_to_status = 'needs_rework' and v_comment is null then
    raise exception 'Comment is required when moving to needs_rework'
      using errcode = 'P0001';
  end if;

  -- 5. Разрешаем триггеру пропустить UPDATE status (только в этой транзакции).
  perform set_config('app.allow_status_change', 'on', true);

  -- 6. Обновляем задачу.
  update public.tasks
  set status     = p_to_status,
      updated_at = now()
  where id = p_task_id;

  -- 7. Пишем историю.
  insert into public.task_status_history
    (task_id, from_status, to_status, changed_by, comment)
  values
    (p_task_id, v_task.status, p_to_status, auth.uid(), v_comment);
end;
$$;

grant execute on function
  public.change_task_status(
    uuid, uuid, public.task_status, public.task_status, text
  )
  to authenticated;


-- ============================================================================
-- 4. Удаляем старую перегрузку change_task_status(uuid, task_status, text)
-- ============================================================================
-- Чтобы не было двух версий с разными сигнатурами. Если клиент ещё
-- вызывает старую — обновите вызовы: добавьте object_id первым аргументом.

drop function if exists public.change_task_status(
  uuid, public.task_status, text
);


-- ============================================================================
-- Готово.
-- ============================================================================
-- Проверки:
--
--   -- 1. Сигнатуры:
--   select proname, pg_get_function_arguments(oid)
--   from pg_proc
--   where proname in (
--     'is_task_transition_allowed',
--     'get_task_available_transitions',
--     'change_task_status'
--   );
--
--   -- 2. get_task_available_transitions под JWT Виктора (assignee "Монтаж окон",
--   --    задача в 'new', клиент думает что 'new'):
--   -- select public.get_task_available_transitions(
--   --   'aaaaaaaa-0000-0000-0000-000000000001',
--   --   '70000001-0000-0000-0000-000000000001',
--   --   'new'
--   -- );
--   -- Ожидаем: stale=false, in_progress=allow, остальные disallow.
--
--   -- 3. Под JWT Анны (author, но не assignee):
--   -- select public.get_task_available_transitions(
--   --   'aaaaaaaa-0000-0000-0000-000000000001',
--   --   '70000001-0000-0000-0000-000000000001',
--   --   'new'
--   -- );
--   -- Ожидаем: все disallow (new->in_progress делает только assignee).
--
--   -- 4. stale-детект: клиент думает 'new', а в БД уже 'in_progress':
--   -- select public.get_task_available_transitions(
--   --   'aaaaaaaa-0000-0000-0000-000000000001',
--   --   '70000001-0000-0000-0000-000000000001',
--   --   'new'
--   -- );
--   -- Ожидаем: stale=true, current_status='in_progress',
--   -- transitions для on_review=allow (если executor).
--
--   -- 5. change_task_status — новая сигнатура:
--   -- select public.change_task_status(
--   --   'aaaaaaaa-0000-0000-0000-000000000001',
--   --   '70000001-0000-0000-0000-000000000001',
--   --   'new', 'in_progress', null
--   -- );
-- ============================================================================