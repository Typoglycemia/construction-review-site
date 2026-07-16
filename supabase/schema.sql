-- =========================================================
-- 建設業者匿名評価サイト DBスキーマ (Supabase / PostgreSQL)
-- =========================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- 類似文字列検索用

-- ---------------------------------------------------------
-- companies
-- ---------------------------------------------------------
create table companies (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  normalized_name    text not null,
  corporate_number   text,
  postal_code        text,
  prefecture         text not null,
  city               text,
  address            text,
  phone              text,
  website_url        text,
  logo_url           text,
  category           text,
  license_information text,
  source_type        text not null default 'user_submission'
                       check (source_type in ('official_data','user_submission')),
  status             text not null default 'pending'
                       check (status in ('pending','published','merged','hidden')),
  merged_into_id     uuid references companies(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_companies_normalized_name on companies using gin (normalized_name gin_trgm_ops);
create index idx_companies_prefecture on companies (prefecture);
create index idx_companies_category on companies (category);
create index idx_companies_corporate_number on companies (corporate_number);
create index idx_companies_phone on companies (phone);

-- ---------------------------------------------------------
-- company_aliases (表記ゆれ・旧社名等)
-- ---------------------------------------------------------
create table company_aliases (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  alias_name   text not null,
  normalized_alias text not null,
  alias_type   text not null default 'name_variant'
                 check (alias_type in ('name_variant','phone','former_name')),
  created_at   timestamptz not null default now()
);
create index idx_company_aliases_company on company_aliases (company_id);
create index idx_company_aliases_normalized on company_aliases using gin (normalized_alias gin_trgm_ops);

-- ---------------------------------------------------------
-- company_categories (多対多)
-- ---------------------------------------------------------
create table company_categories (
  company_id    uuid not null references companies(id) on delete cascade,
  category_slug text not null,
  primary key (company_id, category_slug)
);

-- ---------------------------------------------------------
-- anonymous_users (匿名識別子の集約)
-- ---------------------------------------------------------
create table anonymous_users (
  id                       uuid primary key default gen_random_uuid(),
  anonymous_identifier_hash text not null unique,
  first_seen_at            timestamptz not null default now(),
  last_seen_at             timestamptz not null default now(),
  total_comments           integer not null default 0,
  total_votes              integer not null default 0,
  risk_score               numeric not null default 0
);

-- ---------------------------------------------------------
-- votes
-- ---------------------------------------------------------
create table votes (
  id                        uuid primary key default gen_random_uuid(),
  company_id                uuid not null references companies(id) on delete cascade,
  vote_type                 text not null check (vote_type in ('good','bad')),
  anonymous_user_id         uuid references anonymous_users(id),
  anonymous_identifier_hash text not null,
  ip_hash                   text not null,
  is_valid                  boolean not null default true,
  invalid_reason            text,
  risk_score                numeric not null default 0,
  created_at                timestamptz not null default now()
);

create index idx_votes_company on votes (company_id);
create index idx_votes_identifier on votes (anonymous_identifier_hash);
create index idx_votes_valid on votes (company_id, is_valid);
-- 同一識別子×同一業者の再投票制御はアプリ層(時間窓)で判定するためユニーク制約は付与しない

-- ---------------------------------------------------------
-- comments
-- ---------------------------------------------------------
create table comments (
  id                        uuid primary key default gen_random_uuid(),
  company_id                uuid not null references companies(id) on delete cascade,
  anonymous_user_id         uuid references anonymous_users(id),
  anonymous_identifier_hash text not null,
  sentiment                 text not null check (sentiment in ('good','bad')),
  nickname                  text,
  body                      text not null,
  helpful_count             integer not null default 0,
  status                    text not null default 'published'
                              check (status in ('published','pending_review','hidden','deleted')),
  risk_score                numeric not null default 0,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_comments_company on comments (company_id, created_at desc);
create index idx_comments_identifier on comments (anonymous_identifier_hash);
create index idx_comments_status on comments (status);

-- ---------------------------------------------------------
-- comment_reactions (参考になった)
-- ---------------------------------------------------------
create table comment_reactions (
  id                        uuid primary key default gen_random_uuid(),
  comment_id                uuid not null references comments(id) on delete cascade,
  anonymous_identifier_hash text not null,
  created_at                timestamptz not null default now(),
  unique (comment_id, anonymous_identifier_hash)
);

-- ---------------------------------------------------------
-- reports (通報)
-- ---------------------------------------------------------
create table reports (
  id                        uuid primary key default gen_random_uuid(),
  comment_id                uuid not null references comments(id) on delete cascade,
  reason                    text not null check (reason in (
                                'false_info','defamation','personal_info','threat',
                                'discrimination','impersonation','spam','irrelevant','other')),
  detail                    text,
  anonymous_identifier_hash text not null,
  status                    text not null default 'pending'
                              check (status in ('pending','reviewed','dismissed')),
  created_at                timestamptz not null default now()
);
create index idx_reports_comment on reports (comment_id);
create index idx_reports_status on reports (status);

-- ---------------------------------------------------------
-- access_logs (PIIは暗号化して保持。保存期間は短めに運用でパージ)
-- ---------------------------------------------------------
create table access_logs (
  id                    uuid primary key default gen_random_uuid(),
  anonymous_user_id     uuid references anonymous_users(id),
  company_id            uuid references companies(id),
  ip_address_encrypted  text, -- アプリ層でAES暗号化した値を保存
  ip_hash               text not null,
  user_agent            text,
  browser               text,
  os                    text,
  device_type           text,
  referrer              text,
  created_at            timestamptz not null default now()
);
create index idx_access_logs_created on access_logs (created_at);
create index idx_access_logs_company on access_logs (company_id);

-- ---------------------------------------------------------
-- company_submissions (新規登録申請)
-- ---------------------------------------------------------
create table company_submissions (
  id            uuid primary key default gen_random_uuid(),
  submitted_data jsonb not null,
  duplicate_candidate_id uuid references companies(id),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  anonymous_identifier_hash text not null,
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- company_edit_requests (修正依頼)
-- ---------------------------------------------------------
create table company_edit_requests (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  proposed_changes jsonb not null,
  reason        text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  anonymous_identifier_hash text not null,
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- company_merge_candidates (重複業者候補)
-- ---------------------------------------------------------
create table company_merge_candidates (
  id              uuid primary key default gen_random_uuid(),
  company_id_a    uuid not null references companies(id) on delete cascade,
  company_id_b    uuid not null references companies(id) on delete cascade,
  similarity_score numeric not null,
  match_reason    text, -- 'corporate_number' / 'phone' / 'name_trgm' / 'website'
  status          text not null default 'pending' check (status in ('pending','merged','rejected')),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------
-- takedown_requests (削除・権利侵害申請)
-- ---------------------------------------------------------
create table takedown_requests (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references companies(id),
  comment_id    uuid references comments(id),
  request_type  text not null check (request_type in (
                    'wrong_info','confused_with_other','rights_violation',
                    'problematic_comment','personal_info_exposed')),
  requester_contact text, -- 暗号化推奨
  detail        text,
  status        text not null default 'pending' check (status in ('pending','resolved','rejected')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- admins / moderation_logs / admin_actions / admin_access_logs
-- ---------------------------------------------------------
create table admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  role          text not null check (role in ('super_admin','moderator','support')),
  created_at    timestamptz not null default now()
);

create table moderation_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references admins(id),
  target_type   text not null, -- 'comment' | 'vote' | 'company'
  target_id     uuid not null,
  action        text not null, -- 'hide' | 'delete' | 'restore' | 'invalidate_vote' 等
  reason         text,
  created_at    timestamptz not null default now()
);

create table admin_actions (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references admins(id),
  action_type   text not null,
  target_type   text,
  target_id     uuid,
  detail        jsonb,
  created_at    timestamptz not null default now()
);

-- 個人情報閲覧ログ(36章)
create table admin_access_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid references admins(id),
  viewed_target_type text not null, -- 'ip_address' | 'access_log' | 'submission_contact'
  viewed_target_id   uuid,
  reason        text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Row Level Security (概略。詳細ポリシーは要件に応じ調整)
-- ---------------------------------------------------------
alter table companies enable row level security;
alter table votes enable row level security;
alter table comments enable row level security;
alter table comment_reactions enable row level security;
alter table reports enable row level security;
alter table access_logs enable row level security;

-- 公開閲覧: 公開済み業者・公開コメントのみ匿名read許可
create policy companies_public_read on companies
  for select using (status = 'published');

create policy comments_public_read on comments
  for select using (status = 'published');

-- 書き込みはservice role(サーバー側API経由)のみを想定し、匿名クライアントからの直接insertは許可しない
-- (votes / comments の insert は Next.js API Route 経由でservice_role keyを使い、
--  レートリミット・Turnstile検証・risk_score計算を通してから書き込む)
