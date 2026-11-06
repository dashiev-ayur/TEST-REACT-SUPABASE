-- ============================================================================
-- seed.sql — тестовые данные для локальной разработки / CI
-- ============================================================================
--
-- Что делает файл:
--   0. Идемпотентность: удаляет свои прежние данные (по фиксированным UUID
--      и по FK-связям) перед вставкой. Порядок удаления — от зависимых
--      таблиц к независимым, чтобы не нарушать FK.
--   1. Создаёт пользователей в auth.users + auth.identities:
--        managers:
--          - anna@example.com   / password05  (manager, Анна Смирнова)
--          - boris@example.com  / password05  (manager, Борис Кузнецов)
--        executors:
--          - viktor@example.com / password05  (executor, Виктор Орлов)
--          - daria@example.com  / password05  (executor, Дарья Лебедева)
--          - egor@example.com   / password05  (executor, Егор Новиков)
--   2. Заполняет public.profiles.
--   3. Создаёт один объект "Дом на холмах" (Москва, Ленина-123).
--   4. Создаёт три задачи на этом объекте:
--        - "Монтаж окон":           author = Анна,  assignee = Виктор
--        - "Бетонирование дорожек": author = Борис, assignee = Дарья
--        - "Заливка крыльца":       author = Борис, assignee = Егор
--   5. Пишет стартовые записи в task_status_history (from_status = NULL,
--      to_status = 'new').
--
-- Замечания:
--   - Файл идемпотентен: повторный запуск не упадёт.
--   - UUID фиксированы, чтобы на них можно было ссылаться в тестах.
--   - SECURITY: только для локальной разработки / CI.
--   - Хеш пароля — bcrypt (cost 10), как у Supabase Auth.
--   - В auth.users поля *_token* должны быть '', а не NULL, иначе GoTrue
--     падает с "converting NULL to string is unsupported".
--
-- ============================================================================

create extension if not exists "pgcrypto";


-- ============================================================================
-- 0. Идемпотентность: чистим свои прежние данные
-- ============================================================================
-- Порядок КРИТИЧЕН из-за FK:
--   task_status_history -> tasks -> objects -> profiles -> auth.identities -> auth.users
--
-- Удаляем не только по фиксированным id объектов/задач, но и по FK-связям
-- (created_by / author_id / assignee_id), потому что от предыдущих прогонов
-- могли остаться строки с другими id, но теми же пользователями.
--

do $$
declare
  -- Пользователи
  anna_id   uuid := '11111111-1111-1111-1111-111111111111';
  boris_id  uuid := '11111111-1111-1111-1111-222222222222';
  viktor_id uuid := '22222222-2222-2222-2222-111111111111';
  daria_id  uuid := '22222222-2222-2222-2222-222222222222';
  egor_id   uuid := '22222222-2222-2222-2222-333333333333';

  v_user_ids uuid[] := array[anna_id, boris_id, viktor_id, daria_id, egor_id];

  -- Объект и задачи
  obj_id        uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  task_windows  uuid := '70000001-0000-0000-0000-000000000001';
  task_concrete uuid := '70000002-0000-0000-0000-000000000002';
  task_porch    uuid := '70000003-0000-0000-0000-000000000003';

  v_task_ids uuid[] := array[task_windows, task_concrete, task_porch];
begin

  -- 0.1. История: всё, что относится к нашим задачам или к нашим задачам,
  --      созданным пользователями (на случай других id от прошлых прогонов).
  delete from public.task_status_history
  where task_id = any(v_task_ids)
     or task_id in (
       select id from public.tasks
       where author_id   = any(v_user_ids)
          or assignee_id = any(v_user_ids)
     );

  -- 0.2. Задачи: наши id + задачи, где фигурируют наши пользователи.
  delete from public.tasks
  where id = any(v_task_ids)
     or author_id   = any(v_user_ids)
     or assignee_id = any(v_user_ids);

  -- 0.3. Объекты: наш id + объекты, созданные нашими пользователями.
  delete from public.objects
  where id = obj_id
     or created_by = any(v_user_ids);

  -- 0.4. Профили: наши id.
  delete from public.profiles
  where id = any(v_user_ids);

  -- 0.5. auth.identities и auth.users: наши id.
  delete from auth.identities
  where user_id = any(v_user_ids);

  delete from auth.users
  where id = any(v_user_ids);
end $$;


-- ============================================================================
-- 1-3. Пользователи auth + identities + profiles
-- ============================================================================

do $$
declare
  anna_id   uuid := '11111111-1111-1111-1111-111111111111';
  boris_id  uuid := '11111111-1111-1111-1111-222222222222';
  viktor_id uuid := '22222222-2222-2222-2222-111111111111';
  daria_id  uuid := '22222222-2222-2222-2222-222222222222';
  egor_id   uuid := '22222222-2222-2222-2222-333333333333';

  v_encrypted_pw text := extensions.crypt('password05', extensions.gen_salt('bf'));
begin
  -- ------------------------------------------------------------------------
  -- 1. auth.users
  -- ------------------------------------------------------------------------
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    (
      anna_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'anna@example.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Анна Смирнова"}',
      now(), now(),
      '', '', '', ''
    ),
    (
      boris_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'boris@example.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Борис Кузнецов"}',
      now(), now(),
      '', '', '', ''
    ),
    (
      viktor_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'viktor@example.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Виктор Орлов"}',
      now(), now(),
      '', '', '', ''
    ),
    (
      daria_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'daria@example.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Дарья Лебедева"}',
      now(), now(),
      '', '', '', ''
    ),
    (
      egor_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'egor@example.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Егор Новиков"}',
      now(), now(),
      '', '', '', ''
    )
  on conflict do nothing;

  -- ------------------------------------------------------------------------
  -- 2. auth.identities
  -- ------------------------------------------------------------------------
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values
    (
      anna_id, anna_id,
      format('{"sub": "%s", "email": "anna@example.com"}', anna_id)::jsonb,
      'email', anna_id, now(), now(), now()
    ),
    (
      boris_id, boris_id,
      format('{"sub": "%s", "email": "boris@example.com"}', boris_id)::jsonb,
      'email', boris_id, now(), now(), now()
    ),
    (
      viktor_id, viktor_id,
      format('{"sub": "%s", "email": "viktor@example.com"}', viktor_id)::jsonb,
      'email', viktor_id, now(), now(), now()
    ),
    (
      daria_id, daria_id,
      format('{"sub": "%s", "email": "daria@example.com"}', daria_id)::jsonb,
      'email', daria_id, now(), now(), now()
    ),
    (
      egor_id, egor_id,
      format('{"sub": "%s", "email": "egor@example.com"}', egor_id)::jsonb,
      'email', egor_id, now(), now(), now()
    )
  on conflict do nothing;

  -- ------------------------------------------------------------------------
  -- 3. profiles
  -- ------------------------------------------------------------------------
  insert into public.profiles (id, email, full_name, role)
  values
    (anna_id,   'anna@example.com',   'Анна Смирнова',  'manager'),
    (boris_id,  'boris@example.com',  'Борис Кузнецов', 'manager'),
    (viktor_id, 'viktor@example.com', 'Виктор Орлов',   'executor'),
    (daria_id,  'daria@example.com',  'Дарья Лебедева', 'executor'),
    (egor_id,   'egor@example.com',   'Егор Новиков',   'executor')
  on conflict do nothing;
end $$;


-- ============================================================================
-- 4-5. Объект, задачи и история
-- ============================================================================
-- Схема:
--
--   Object "Дом на холмах" (создала Анна)
--     ├─ Task "Монтаж окон"          : Анна  -> Виктор  (new)
--     ├─ Task "Бетонирование дорожек": Борис -> Дарья   (new)
--     └─ Task "Заливка крыльца"      : Борис -> Егор    (new)
--
-- Сценарии для проверки прав:
--   - Анна (manager) — автор только "Монтаж окон"; к задачам Бориса
--     на смену статуса доступа нет.
--   - Борис (manager) — автор "Бетонирование..." и "Заливка...";
--     к "Монтаж окон" на смену статуса доступа нет.
--   - Каждый executor видит объект ровно через одну свою задачу.

do $$
declare
  anna_id   uuid := '11111111-1111-1111-1111-111111111111';
  boris_id  uuid := '11111111-1111-1111-1111-222222222222';
  viktor_id uuid := '22222222-2222-2222-2222-111111111111';
  daria_id  uuid := '22222222-2222-2222-2222-222222222222';
  egor_id   uuid := '22222222-2222-2222-2222-333333333333';

  obj_id uuid := 'aaaaaaaa-0000-0000-0000-000000000001';

  task_windows  uuid := '70000001-0000-0000-0000-000000000001';
  task_concrete uuid := '70000002-0000-0000-0000-000000000002';
  task_porch    uuid := '70000003-0000-0000-0000-000000000003';
begin
  -- ------------------------------------------------------------------------
  -- 4. Объект
  -- ------------------------------------------------------------------------
  insert into public.objects (id, name, address, created_by)
  values (obj_id, 'Дом на холмах', 'Москва, Ленина-123', anna_id)
  on conflict do nothing;

  -- ------------------------------------------------------------------------
  -- 5. Задачи
  -- ------------------------------------------------------------------------
  insert into public.tasks
    (id, title, description, object_id, assignee_id, author_id, status)
  values
    (
      task_windows,
      'Монтаж окон',
      'Установить пластиковые окна во всех комнатах первого этажа.',
      obj_id, viktor_id, anna_id, 'new'
    ),
    (
      task_concrete,
      'Бетонирование дорожек',
      'Залить бетонные дорожки от калитки до крыльца и вокруг дома.',
      obj_id, daria_id, boris_id, 'new'
    ),
    (
      task_porch,
      'Заливка крыльца',
      'Залить бетонную площадку под крыльцо и ступени.',
      obj_id, egor_id, boris_id, 'new'
    )
  on conflict do nothing;

  -- ------------------------------------------------------------------------
  -- 6. История: стартовые записи (from_status = null => создание задачи)
  -- ------------------------------------------------------------------------
  -- В проде эти записи должен создавать триггер AFTER INSERT ON tasks.
  -- У нас такого триггера нет, поэтому пишем руками.
  -- append-only триггер на task_status_history пропускает INSERT — ок.
  insert into public.task_status_history
    (task_id, from_status, to_status, changed_by, comment)
  values
    (task_windows,  null, 'new', anna_id,  'Task created'),
    (task_concrete, null, 'new', boris_id, 'Task created'),
    (task_porch,    null, 'new', boris_id, 'Task created');
end $$;


-- ============================================================================
-- Готово.
-- ============================================================================
-- Логины (пароль у всех password05):
--
--   manager:   anna@example.com   — Анна Смирнова
--   manager:   boris@example.com  — Борис Кузнецов
--   executor:  viktor@example.com — Виктор Орлов
--   executor:  daria@example.com  — Дарья Лебедева
--   executor:  egor@example.com   — Егор Новиков
--
-- Проверки после seed:
--
--   select count(*) from auth.users;          -- 5
--   select count(*) from public.profiles;     -- 5
--   select count(*) from public.objects;      -- 1
--   select count(*) from public.tasks;        -- 3
--   select count(*) from public.task_status_history;  -- 3
--
-- ============================================================================