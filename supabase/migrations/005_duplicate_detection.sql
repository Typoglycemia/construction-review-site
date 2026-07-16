-- supabase/migrations/005_duplicate_detection.sql

-- 同じペアを何度も登録しないためのユニーク制約
-- (company_id_a < company_id_b の順で必ず登録するルールにする)
alter table company_merge_candidates
  add constraint uq_merge_candidate_pair unique (company_id_a, company_id_b);

-- 重複候補を検出する関数
create or replace function detect_company_duplicates(
  name_similarity_threshold float default 0.6
)
returns table (
  company_id_a uuid,
  company_id_b uuid,
  similarity_score float,
  match_reason text
) as $$
begin
  return query
  -- 高信頼度: 法人番号が一致
  select a.id, b.id, 1.0::float, 'corporate_number'::text
  from companies a
  join companies b on a.id < b.id
  where a.status = 'published' and b.status = 'published'
    and a.corporate_number is not null
    and a.corporate_number = b.corporate_number

  union

  -- 高信頼度: 電話番号が一致
  select a.id, b.id, 1.0::float, 'phone'::text
  from companies a
  join companies b on a.id < b.id
  where a.status = 'published' and b.status = 'published'
    and a.phone is not null
    and a.phone = b.phone

  union

  -- 中信頼度: 都道府県が同じ かつ 会社名の類似度が高い
  select a.id, b.id, similarity(a.normalized_name, b.normalized_name), 'name_similarity'::text
  from companies a
  join companies b on a.id < b.id
  where a.status = 'published' and b.status = 'published'
    and a.prefecture = b.prefecture
    and similarity(a.normalized_name, b.normalized_name) >= name_similarity_threshold;
end;
$$ language plpgsql;
