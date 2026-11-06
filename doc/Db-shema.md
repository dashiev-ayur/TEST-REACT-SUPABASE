=====================================================================
CRM для строительной компании — схема таблиц (PostgreSQL / Supabase)
=====================================================================

ENUM-ТИПЫ
---------------------------------------------------------------------
user_role      : 'manager' | 'executor'
task_status    : 'new' | 'in_progress' | 'on_review' | 'accepted' | 'needs_rework'

=====================================================================
1. profiles  — профили пользователей (расширение auth.users)
================================================================-----
id          uuid        PK, FK -> auth.users.id
email       text        NOT NULL
full_name   text        NOT NULL
role        user_role   NOT NULL
created_at  timestamptz NOT NULL DEFAULT now()

---------------------------------------------------------------------
2. objects  — стройки (объекты)
---------------------------------------------------------------------
id          uuid        PK DEFAULT gen_random_uuid()
name        text        NOT NULL
address     text
created_by  uuid        NOT NULL FK -> profiles.id
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()

---------------------------------------------------------------------
3. tasks  — задачи по объектам
---------------------------------------------------------------------
id           uuid         PK DEFAULT gen_random_uuid()
title        text         NOT NULL
description  text
object_id    uuid         NOT NULL FK -> objects.id ON DELETE CASCADE
assignee_id  uuid         NOT NULL FK -> profiles.id
author_id    uuid         NOT NULL FK -> profiles.id
status       task_status  NOT NULL DEFAULT 'new'
created_at   timestamptz  NOT NULL DEFAULT now()
updated_at   timestamptz  NOT NULL DEFAULT now()

---------------------------------------------------------------------
4. task_status_history  — история смены статусов (append-only)
---------------------------------------------------------------------
id           bigint       PK GENERATED ALWAYS AS IDENTITY
task_id      uuid         NOT NULL FK -> tasks.id ON DELETE CASCADE
from_status  task_status           (NULL при создании задачи)
to_status    task_status  NOT NULL
changed_by   uuid         NOT NULL FK -> profiles.id
comment      text                  (обязателен при -> needs_rework)
created_at   timestamptz  NOT NULL DEFAULT now()

=====================================================================
СВЯЗИ
================================================================-----
auth.users        1 ── 1   profiles
profiles(manager) 1 ── N   objects.created_by
objects           1 ── N   tasks.object_id
profiles(executor)1 ── N   tasks.assignee_id
profiles(manager) 1 ── N   tasks.author_id
tasks             1 ── N   task_status_history.task_id

=====================================================================
RPC / ФУНКЦИИ (не таблицы, но часть схемы)
================================================================-----
change_task_status(task_id, to_status, comment)
    SECURITY DEFINER — единственный способ менять tasks.status:
      • проверяет роль + назначение + допустимость перехода
      • требует comment при on_review -> needs_rework
      • обновляет tasks.status
      • INSERT в task_status_history

current_role()            -> user_role   (SECURITY DEFINER)
is_manager()              -> boolean
can_access_object(obj_id) -> boolean     (для RLS objects)
can_access_task(task_id)  -> boolean     (для RLS tasks/history)

=====================================================================
RLS-ПОЛИТИКИ (кратко)
================================================================-----
objects
    SELECT : manager -> все; executor -> только где есть его задачи
    INSERT/UPDATE/DELETE : только manager

tasks
    SELECT : manager -> все; executor -> только assignee_id = auth.uid()
    INSERT/DELETE : только manager
    UPDATE : только manager (status — только через change_task_status)

task_status_history
    SELECT : по правилам доступа к задаче (can_access_task)
    INSERT : только через change_task_status (SECURITY DEFINER)
    UPDATE/DELETE : запрещены (политика + триггер BEFORE UPDATE/DELETE)

profiles
    SELECT : свой профиль; manager -> все
    UPDATE/INSERT/DELETE : только service_role (админ)
    Регистрация отключена — пользователей создаёт админ вручную

    

В вашей схеме указано, что change_task_status — единственный способ менять tasks.status. Политика Tasks update for manager разрешает менеджеру делать UPDATE таблицы tasks напрямую через API. Это означает, что технически менеджер может обойти RPC и изменить status вручную, если у него есть доступ к клиенту Supabase.

Если вы хотите полностью запретить прямое изменение статуса даже для менеджера, можно сделать так:

Убрать политику Tasks update for manager.

Создать отдельную RPC-функцию для редактирования остальных полей задачи (title, description, assignee_id) от имени менеджера.

Либо использовать триггер BEFORE UPDATE на tasks, который проверяет, изменилось ли поле status, и если да — требует, чтобы это происходило внутри функции change_task_status (например, через установку специальной локальной переменной set_config). Это более сложный, но надежный подход.

Для большинства проектов текущего уровня достаточно того, что статус меняется через RPC, а прямое изменение через API — это осознанное действие менеджера.