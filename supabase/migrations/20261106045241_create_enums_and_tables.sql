-- 1. ENUM-типы
create type public.user_role as enum ('manager', 'executor');
create type public.task_status as enum ('new', 'in_progress', 'on_review', 'accepted', 'needs_rework');

-- 2. Таблица profiles
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (id)
);

-- 3. Таблица objects
create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Таблица tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  object_id uuid not null references public.objects(id) on delete cascade,
  assignee_id uuid not null references public.profiles(id),
  author_id uuid not null references public.profiles(id),
  status public.task_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Таблица task_status_history (append-only)
create table public.task_status_history (
  id bigint primary key generated always as identity,
  task_id uuid not null references public.tasks(id) on delete cascade,
  from_status public.task_status,
  to_status public.task_status not null,
  changed_by uuid not null references public.profiles(id),
  comment text,
  created_at timestamptz not null default now()
);

-- 6. Индексы для внешних ключей (помогают RLS-политикам)
create index idx_objects_created_by on public.objects(created_by);
create index idx_tasks_object_id on public.tasks(object_id);
create index idx_tasks_assignee_id on public.tasks(assignee_id);
create index idx_tasks_author_id on public.tasks(author_id);
create index idx_history_task_id on public.task_status_history(task_id);

