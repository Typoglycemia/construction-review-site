-- supabase/migrations/003_contact_messages.sql
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text not null,
  message    text not null,
  status     text not null default 'unread' check (status in ('unread','read','resolved')),
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;
-- 公開readは許可しない(管理者のみservice_role経由でアクセス)
