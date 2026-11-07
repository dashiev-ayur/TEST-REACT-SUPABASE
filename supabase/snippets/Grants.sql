-- ============================================================================
-- Полная проверка и выдача прав (GRANT) для всех таблиц проекта
-- ============================================================================
-- Выполнять в SQL Editor УДАЛЁННОГО проекта Supabase.
--
-- Контекст: с 30.10.2026 Supabase не выдаёт автоматически права
-- SELECT/INSERT/UPDATE/DELETE для anon/authenticated на новые таблицы
-- в схеме public. Этот скрипт:
--   1) показывает текущее состояние прав;
--   2) выдаёт недостающие права для anon/authenticated;
--   3) НЕ отключает RLS — политики продолжают фильтровать строки.
--
-- ВАЖНО: GRANT лишь позволяет запросу "дойти" до таблицы.
-- Какие строки вернуть/изменить — решает RLS. Безопасность не страдает.
-- ============================================================================


-- ============================================================================
-- 1. ДИАГНОСТИКА: текущее состояние прав
-- ============================================================================
-- Для каждой таблицы и каждой привилегии — true/false для anon/authenticated.

select
  t.table_name,
  has_table_privilege('anon',          format('public.%I', t.table_name), 'SELECT') as anon_select,
  has_table_privilege('anon',          format('public.%I', t.table_name), 'INSERT') as anon_insert,
  has_table_privilege('anon',          format('public.%I', t.table_name), 'UPDATE') as anon_update,
  has_table_privilege('anon',          format('public.%I', t.table_name), 'DELETE') as anon_delete,
  has_table_privilege('authenticated', format('public.%I', t.table_name), 'SELECT') as auth_select,
  has_table_privilege('authenticated', format('public.%I', t.table_name), 'INSERT') as auth_insert,
  has_table_privilege('authenticated', format('public.%I', t.table_name), 'UPDATE') as auth_update,
  has_table_privilege('authenticated', format('public.%I', t.table_name), 'DELETE') as auth_delete
from information_schema.tables t
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
order by t.table_name;


-- ============================================================================
-- 2. ВЫДАЧА ПРАВ: все таблицы проекта
-- ============================================================================
-- Выдаём полный набор anon/authenticated на уровне таблиц.
-- RLS-политики остаются главным фильтром — они не отключаются.
--
-- Если для какой-то таблицы anon не должен иметь доступ вовсе
-- (например, profiles), можно не выдавать ей права — RLS всё равно
-- отфильтрует, но GRANT даст "дойти" до таблицы. Для profiles
-- у вас нет INSERT/UPDATE/DELETE политик для authenticated,
-- поэтому выдача прав безопасна: RLS заблокирует запись.

grant select, insert, update, delete
  on table public.profiles
  to anon, authenticated;

grant select, insert, update, delete
  on table public.objects
  to anon, authenticated;

grant select, insert, update, delete
  on table public.tasks
  to anon, authenticated;

grant select, insert, update, delete
  on table public.task_status_history
  to anon, authenticated;


-- ============================================================================
-- 3. ПОСЛЕДОВАТЕЛЬНОСТИ (на случай, если где-то есть serial/bigserial)
-- ============================================================================
-- В вашей схеме id — uuid с gen_random_uuid(), а task_status_history.id —
-- bigint generated always as identity. Для identity-колонок права на
-- последовательность не нужны (это внутренняя последовательность).
-- Но если в будущем добавите serial/bigserial — этот grant пригодится.

grant usage, select
  on all sequences in schema public
  to anon, authenticated;


-- ============================================================================
-- 4. ФУНКЦИИ: права на выполнение
-- ============================================================================
-- У вас уже есть grant execute на change_task_status и
-- get_task_available_transitions для authenticated. Проверим и, если нужно,
-- выдадим ещё раз (идемпотентно). anon не должен вызывать эти RPC —
-- им нужен auth.uid(), без JWT они вернут ошибку/пусто.

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

grant execute on function public.current_role()  to authenticated;
grant execute on function public.is_manager()    to authenticated;
grant execute on function public.can_access_object(uuid) to authenticated;
grant execute on function public.can_access_task(uuid)   to authenticated;


-- ============================================================================
-- 5. КОНТРОЛЬНАЯ ПРОВЕРКА (повтор диагностики)
-- ============================================================================
-- После выполнения блока 2-4 все *_select/*_insert/*_update/*_delete
-- должны быть true для authenticated (и anon, если так задумано).
-- Если для anon какие-то права не нужны — их можно отозвать:
--   revoke insert, update, delete on public.profiles from anon;

select
  t.table_name,
  has_table_privilege('anon',          format('public.%I', t.table_name), 'SELECT') as anon_select,
  has_table_privilege('anon',          format('public.%I', t.table_name), 'INSERT') as anon_insert,
  has_table_privilege('authenticated', format('public.%I', t.table_name), 'SELECT') as auth_select,
  has_table_privilege('authenticated', format('public.%I', t.table_name), 'INSERT') as auth_insert,
  has_table_privilege('authenticated', format('public.%I', t.table_name), 'UPDATE') as auth_update,
  has_table_privilege('authenticated', format('public.%I', t.table_name), 'DELETE') as auth_delete
from information_schema.tables t
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
order by t.table_name;


-- ============================================================================
-- 6. ПРОВЕРКА "ОТ ИМЕНИ РОЛИ"
-- ============================================================================
-- Самый честный тест: переключиться на authenticated и попробовать
-- прочитать каждую таблицу. Если RLS не пускает — вернётся 0 строк (не ошибка).
-- Если прав нет — вернётся 42501 permission denied.

-- set role authenticated;
--   select count(*) from public.objects;
--   select count(*) from public.tasks;
--   select count(*) from public.profiles;
--   select count(*) from public.task_status_history;
-- reset role;


-- ============================================================================
-- ВАЖНО ПОСЛЕ ПРИМЕНЕНИЯ
-- ============================================================================
-- 1. GRANT не отключает RLS. Политики продолжают фильтровать строки.
-- 2. anon получает права на таблицы, но RLS-политики у вас написаны
--    для `to authenticated`. Для anon строки не вернутся (0 строк),
--    но ошибки 42501 не будет.
-- 3. Если хотите, чтобы anon ВООБЩЕ не имел доступа к profiles:
--      revoke all on public.profiles from anon;
--    Тогда anon-запрос упадёт с 42501 — это ожидаемо и нормально.
-- 4. Проверьте на Vercel, что используется ПУБЛИЧНЫЙ ключ (anon/publishable),
--    а не service_role/secret. service_role обходит RLS, но это не то,
--    что должно быть на фронтенде.
-- 5. Убедитесь, что SUPABASE_URL на Vercel указывает на ТОТ ЖЕ проект,
--    где вы выполнили эти GRANT.
-- ============================================================================