-- Явные GRANT для anon/authenticated.
-- Нужно из-за изменения Supabase от 30.10.2026: новые таблицы в public
-- больше не получают права автоматически.
-- RLS не отключается — политики продолжают фильтровать строки.

grant select, insert, update, delete
  on table public.profiles,
           public.objects,
           public.tasks,
           public.task_status_history
  to anon, authenticated;

grant usage, select
  on all sequences in schema public
  to anon, authenticated;

grant execute on function public.change_task_status(
  uuid, uuid, public.task_status, public.task_status, text
) to authenticated;

grant execute on function public.get_task_available_transitions(
  uuid, uuid, public.task_status
) to authenticated;

grant execute on function public.is_status_transition_allowed(
  public.task_status, public.task_status
) to authenticated;

grant execute on function public.is_task_transition_allowed(
  public.tasks, public.task_status
) to authenticated;

grant execute on function public.can_set_task_status(
  public.tasks, public.task_status
) to authenticated;

grant execute on function public.current_role()            to authenticated;
grant execute on function public.is_manager()              to authenticated;
grant execute on function public.can_access_object(uuid)   to authenticated;
grant execute on function public.can_access_task(uuid)     to authenticated;