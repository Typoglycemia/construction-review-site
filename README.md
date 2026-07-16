# 建設業者匿名評価サイト - スターターキット (MVP一式)

design-doc.md の設計に基づき、MVPで必要なコア機能を一通り実装したコードです。
Next.js(App Router) + TypeScript + Tailwind CSS + Supabase 構成。

## セットアップ手順

1. Supabaseプロジェクトを作成
2. SQL Editorで以下を順に実行
   - `supabase/schema.sql`
   - `supabase/migrations/002_ranking_cache.sql`
3. `.env.local.example` を `.env.local` にコピーし、値を設定
   - `IP_ENCRYPTION_KEY` は `openssl rand -base64 32` などで32byteの鍵を生成
4. 依存パッケージをインストール: `npm install`
5. 開発サーバー起動: `npm run dev`
6. 管理者アカウントは `admins` テーブルへ直接INSERT(Supabase Authでユーザー作成後、
   同じemailで role を設定)

## ディレクトリ構成と主な機能

```
app/
  page.tsx                       トップページ(ランキング/新着コメント/新着業者)
  search/page.tsx                検索結果
  companies/[id]/page.tsx        業者詳細(投票+コメント+JSON-LD構造化データ)
  companies/new/page.tsx         業者新規登録(重複チェック連携)
  ranking/[type]/page.tsx        良い/悪いランキング一覧
  sitemap.ts / robots.ts         SEO
  api/votes/route.ts             投票受付(Turnstile検証+リスク判定+DB書込)
  api/comments/route.ts          コメント投稿(リスク判定でstatus自動振分)
  api/companies/submissions/     業者登録申請(重複判定→高信頼度は登録ブロック)
  api/cron/ranking-batch/        ランキング再集計バッチのエンドポイント
  admin/
    layout.tsx                   認証+ロール別ナビゲーション
    dashboard/page.tsx           概況(未処理件数サマリ)
    comments/page.tsx            コメントモデレーション
    comments/history/page.tsx    投稿者の過去投稿まとめ(荒らし・組織的投稿の検知)
    companies/duplicates/page.tsx 重複業者の差分表示+統合/却下
    votes/page.tsx               不正投票検知キュー+無効化操作
  api/admin/                     上記操作に対応するAPI(操作は全てadmin_actions/moderation_logsに記録)

components/                      UIコンポーネント(投票パネル、コメント欄、業者カード等)
lib/
  ranking.ts                     ベイズ平均によるランキングスコア計算
  dedupe.ts                      業者名正規化・重複判定(法人番号/電話/URL/類似度)
  anonymous.ts                   匿名識別子発行・IPハッシュ化・暗号化
  moderation.ts                  投票/コメントのリスクスコア計算
  seo.ts                         メタデータ・構造化データ生成(断定的表現を避ける方針を反映)
  supabase.ts                    Supabaseクライアント初期化
scripts/ranking-batch.ts         ランキング定期集計バッチ本体
supabase/schema.sql              全テーブルDDL(RLS込み)
supabase/migrations/             追加マイグレーション
```

## 公開手順

`DEPLOY.md` にSupabase作成〜Vercelデプロイまでの手順をまとめています。

## 未実装・今後の拡張ポイント

- Cloudflare Turnstileウィジェットの実際の埋め込み(現状は `window.__turnstileToken` を
  参照するダミー実装。投票・コメント・登録フォームに実ウィジェットの設置が必要)
- Upstash Redisを使った本格的なレートリミット(現状はDBクエリベースの簡易実装)
- 管理者の個人情報閲覧ログ(`admin_access_logs`)を実際に記録する処理(IP復号時に必須)
- pg_trgmを使ったDB側での重複候補の自動検出バッチ(現状はAPI呼び出し時のオンデマンド判定のみ)
- 47都道府県・業種マスタデータの投入、業者データの実データ投入
- 特定商取引法表記・運営者情報など、実際の事業者情報に応じた法定表示の追加

## 重要な運用上の注意

- 本サービスは匿名での批判的投稿を扱うため、名誉毀損・営業妨害等のリスクを伴います。
  利用規約・プライバシーポリシー・削除依頼フローの整備、および必要に応じた弁護士への相談を
  強く推奨します。
- ランキングタイトルや自動生成文言で「詐欺」「悪徳」等の断定的表現を使わないこと
  (lib/seo.ts に方針を反映済み)。
