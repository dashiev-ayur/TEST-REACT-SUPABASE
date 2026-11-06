# Supabase

```bash
supabase login
# https://supabase.com/dashboard/project/<ваш-project-ref>
supabase link --project-ref <ваш-project-ref>

supabase start
supabase db pull
supabase migration new create_enums_and_tables
supabase migration new create_functions
supabase migration new create_rls_policies

supabase migration new function_change_task_status
supabase migration new get_task_available_transitions

supabase migration up
# для отката создавать новую миграцию..
# forward-only - подход

# пересоздаст локальную БД с нуля и применит все миграции по порядку м seed
supabase db reset

# применить миграции
supabase db push
supabase db push --include-seed

# отправка в облако применит только те миграции, которых еще нет в облаке
supabase db push --remote --dry-run
supabase db push --remote
supabase db push --include-seed --remote

# чистка миграций для remote
# 1. удалить файлы миграций
# 2. Эта команда извлечёт полную схему текущей базы данных и сгенерирует новый файл миграции
supabase db pull
# 3. Чистка истории
# DELETE FROM supabase_migrations.schema_migrations;
supabase db push --remote

# Генерация типа для экземпляра supabase<Database> для подсказок
supabase gen types typescript --local > frontend/src/types/database.ts

# === Полное пересоздание ===
# 1. Остановить Supabase и удалить все связанные Docker volumes
supabase stop --no-backup
docker rm $(docker ps -a | grep supabase | awk '{print $1}')
docker volume rm $(docker volume ls | grep supabase | awk '{print $2}')
supabase db reset

# 2. Запустить Supabase заново (создастся чистый контейнер БД)
supabase start
# 3. Применить миграции и seed (база уже пустая)
supabase db reset

# === Backup  ===
supabase db dump --linked --data-only --file seed.sql
```



```sql
# пользователи
select
  u.id,
  u.email,
  u.email_confirmed_at,
  (u.encrypted_password is not null and u.encrypted_password <> '') as has_password,
  i.provider,
  i.provider_id
from auth.users u
left join auth.identities i on i.user_id = u.id

# Проверка пароля
select encrypted_password = crypt('password05', encrypted_password) as password_matches
from auth.users
where email = 'manager@example.com';


UPDATE auth.users
SET confirmation_token = ''
WHERE confirmation_token IS NULL;


UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_token_new = COALESCE(email_change_token_new, '')
WHERE email IN ('manager@example.com', 'executor@example.com');


```