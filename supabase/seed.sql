-- Включаем pgcrypto для хеширования паролей
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  -- Фиксированные UUID, чтобы на них можно было ссылаться в других seed-файлах
  manager_id UUID := '11111111-1111-1111-1111-111111111111';
  executor_id UUID := '22222222-2222-2222-2222-222222222222';
  v_encrypted_pw TEXT := extensions.crypt('password05', extensions.gen_salt('bf'));
BEGIN
  -- 1. Создаем пользователя-менеджера в auth.users
  -- Важно: confirmation_token, email_change, email_change_token_new, recovery_token
  -- должны быть пустыми строками (''), а не NULL, иначе Auth-сервис падает
  -- с ошибкой "converting NULL to string is unsupported"
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    manager_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'manager@example.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Manager User"}',
    now(), now(),
    '', '', '', ''
  );

  -- 2. Создаем identity для менеджера (без этого вход не сработает)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    manager_id, manager_id,
    format('{"sub": "%s", "email": "manager@example.com"}', manager_id)::jsonb,
    'email', manager_id, now(), now(), now()
  );

  -- 3. Создаем пользователя-исполнителя
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    executor_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'executor@example.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Executor User"}',
    now(), now(),
    '', '', '', ''
  );

  -- 4. Создаем identity для исполнителя
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    executor_id, executor_id,
    format('{"sub": "%s", "email": "executor@example.com"}', executor_id)::jsonb,
    'email', executor_id, now(), now(), now()
  );

  -- 5. Заполняем таблицу profiles (создана в миграции)
  -- id совпадает с id из auth.users
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES
    (manager_id, 'manager@example.com', 'Manager User', 'manager'),
    (executor_id, 'executor@example.com', 'Executor User', 'executor');
END $$;
