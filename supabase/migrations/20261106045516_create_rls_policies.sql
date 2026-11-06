-- ============================================
-- 1. objects
-- ============================================
alter table public.objects enable row level security;

-- SELECT: manager -> все; executor -> только где есть его задачи
create policy "Objects select for manager"
on public.objects for select
to authenticated
using ( public.is_manager() );

create policy "Objects select for executor"
on public.objects for select
to authenticated
using ( exists (
  select 1 from public.tasks
  where tasks.object_id = objects.id and tasks.assignee_id = auth.uid()
) );

-- INSERT/UPDATE/DELETE: только manager
create policy "Objects insert for manager"
on public.objects for insert
to authenticated
with check ( public.is_manager() );

create policy "Objects update for manager"
on public.objects for update
to authenticated
using ( public.is_manager() )
with check ( public.is_manager() );

create policy "Objects delete for manager"
on public.objects for delete
to authenticated
using ( public.is_manager() );

-- ============================================
-- 2. tasks
-- ============================================
alter table public.tasks enable row level security;

-- SELECT: manager -> все; executor -> только assignee_id = auth.uid()
create policy "Tasks select for manager"
on public.tasks for select
to authenticated
using ( public.is_manager() );

create policy "Tasks select for executor"
on public.tasks for select
to authenticated
using ( assignee_id = auth.uid() );

-- INSERT/DELETE: только manager
create policy "Tasks insert for manager"
on public.tasks for insert
to authenticated
with check ( public.is_manager() );

create policy "Tasks delete for manager"
on public.tasks for delete
to authenticated
using ( public.is_manager() );

-- UPDATE: только manager (но статус меняется только через RPC)
-- Политика разрешает update для manager, но мы не даем прямых прав на изменение status через API
create policy "Tasks update for manager"
on public.tasks for update
to authenticated
using ( public.is_manager() )
with check ( public.is_manager() );

-- ============================================
-- 3. task_status_history (append-only)
-- ============================================
alter table public.task_status_history enable row level security;

-- SELECT: по правилам доступа к задаче
create policy "History select via task access"
on public.task_status_history for select
to authenticated
using ( public.can_access_task(task_id) );

-- INSERT: разрешен только через SECURITY DEFINER функцию change_task_status
-- Прямой INSERT через API запрещен (нет политики INSERT для authenticated)
-- RPC функция работает с правами владельца (security definer) и обходит RLS

-- UPDATE/DELETE: запрещены
-- Создаем триггер, который физически блокирует изменения
create or replace function public.reject_history_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'task_status_history is append-only. % is not allowed.', tg_op;
end;
$$;

create trigger enforce_history_append_only
before update or delete on public.task_status_history
for each row execute function public.reject_history_mutation();

-- ============================================
-- 4. profiles
-- ============================================
alter table public.profiles enable row level security;

-- SELECT: свой профиль; manager -> все
create policy "Profiles select own"
on public.profiles for select
to authenticated
using ( id = auth.uid() );

create policy "Profiles select all for manager"
on public.profiles for select
to authenticated
using ( public.is_manager() );

-- UPDATE/INSERT/DELETE: только service_role
-- Политики для authenticated не создаем, значит доступ запрещен.
-- service_role обходит RLS по умолчанию.