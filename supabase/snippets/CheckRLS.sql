select relname, relrowsecurity
from pg_class
where relname in ('profiles', 'objects', 'tasks', 'task_status_history');

-- alter table public.<name> enable row level security;