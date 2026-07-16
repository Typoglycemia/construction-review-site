-- supabase/migrations/002_ranking_cache.sql
-- ランキングバッチ処理結果のキャッシュテーブル

create table site_stats (
  id                     text primary key default 'singleton',
  site_average_good_ratio numeric not null default 0.5,
  computed_at            timestamptz not null default now()
);

create table company_rankings (
  company_id   uuid primary key references companies(id) on delete cascade,
  good_score   numeric not null,
  bad_score    numeric not null,
  total_votes  integer not null,
  computed_at  timestamptz not null default now()
);

create index idx_company_rankings_good on company_rankings (good_score desc);
create index idx_company_rankings_bad on company_rankings (bad_score desc);

alter table site_stats enable row level security;
alter table company_rankings enable row level security;

create policy site_stats_public_read on site_stats for select using (true);
create policy company_rankings_public_read on company_rankings for select using (true);
