-- supabase/migrations/004_comments_ip_hash.sql
alter table comments add column if not exists ip_hash text;
create index if not exists idx_comments_ip_hash on comments (ip_hash);
