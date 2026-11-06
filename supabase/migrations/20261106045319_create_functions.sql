-- 1. current_role() -> user_role
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 2. is_manager() -> boolean
create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager'
  );
$$;

-- 3. can_access_object(obj_id) -> boolean
create or replace function public.can_access_object(p_object_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.is_manager() then true
    else exists (
      select 1 from public.tasks
      where object_id = p_object_id and assignee_id = auth.uid()
    )
  end;
$$;

-- 4. can_access_task(task_id) -> boolean
create or replace function public.can_access_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.is_manager() then true
    else exists (
      select 1 from public.tasks
      where id = p_task_id and assignee_id = auth.uid()
    )
  end;
$$;

-- 5. change_task_status (RPC)
create or replace function public.change_task_status(
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task record;
  v_from_status public.task_status;
begin
  -- Получаем задачу с блокировкой строки
  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Task not found';
  end if;

  v_from_status := v_task.status;

  -- Проверка прав (только менеджер или назначенный исполнитель)
  if not (public.is_manager() or v_task.assignee_id = auth.uid()) then
    raise exception 'Permission denied';
  end if;

  -- Требование комментария при возврате на доработку
  if v_from_status = 'on_review' and p_to_status = 'needs_rework' and p_comment is null then
    raise exception 'Comment is required when moving to needs_rework';
  end if;

  -- Обновляем статус
  update public.tasks set status = p_to_status, updated_at = now() where id = p_task_id;

  -- Записываем историю
  insert into public.task_status_history (task_id, from_status, to_status, changed_by, comment)
  values (p_task_id, v_from_status, p_to_status, auth.uid(), p_comment);
end;
$$;

-- Даем права на выполнение RPC аутентифицированным пользователям
grant execute on function public.change_task_status(uuid, public.task_status, text) to authenticated;