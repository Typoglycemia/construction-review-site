# 公開(デプロイ)手順

このコードは Supabase + Vercel での公開を想定して作られています。以下の手順で
実際にインターネット上へ公開できます。

## 1. Supabaseプロジェクトを作成

1. https://supabase.com でプロジェクトを新規作成
2. 「SQL Editor」で以下を **この順番** で実行
   - `supabase/schema.sql`
   - `supabase/migrations/002_ranking_cache.sql`
   - `supabase/migrations/003_contact_messages.sql`
3. 「Project Settings > API」から以下をメモ
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`(絶対に公開しない)
4. 「Authentication > Users」で管理者用ユーザーを1名作成(メール+パスワード)
5. 作成したユーザーと同じメールアドレスで `admins` テーブルに1行追加
   ```sql
   insert into admins (email, role) values ('you@example.com', 'super_admin');
   ```

## 2. 環境変数を準備

`.env.local.example` を `.env.local` にコピーして値を埋める。

```bash
cp .env.local.example .env.local
```

- `IP_HASH_SALT`: 任意のランダム文字列(例: `openssl rand -hex 16`)
- `IP_ENCRYPTION_KEY`: 32byteのbase64鍵(例: `openssl rand -base64 32`)
- `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`: Cloudflare Turnstileでサイトを登録して取得
  (https://dash.cloudflare.com/ > Turnstile)
- `CRON_SECRET`: 任意のランダム文字列(Vercel Cronの認証用)
- `NEXT_PUBLIC_SITE_URL`: 本番URL(例: `https://your-domain.vercel.app`)

## 3. ローカルで動作確認

```bash
npm install
npm run dev
```

`http://localhost:3000` でトップページが表示されることを確認。
`/admin/login` から手順1で作った管理者アカウントでログインできることを確認。

## 4. Vercelへデプロイ

1. このディレクトリをGitHubリポジトリにpush
2. https://vercel.com で「Add New Project」→ そのリポジトリを選択
3. 「Environment Variables」に `.env.local` の内容を全て登録
4. Deployを実行
5. デプロイ完了後、`vercel.json` の cron設定が自動的に有効になり、
   15分おきに `/api/cron/ranking-batch` が実行されてランキングが更新される
   (Vercel Cronはプロジェクトのプランによって実行頻度に制限があるため要確認)

## 5. 独自ドメインの設定(任意)

Vercelの「Settings > Domains」から独自ドメインを追加し、DNSレコードを設定する。
ドメイン変更後は `NEXT_PUBLIC_SITE_URL` を更新し、再デプロイすること
(sitemap.ts / SEOメタデータに影響するため)。

## 公開前に必ず確認してほしいこと

- [ ] 利用規約・プライバシーポリシー(`app/terms`, `app/privacy`)の内容を、実際の運営者情報
      (事業者名・連絡先等)に合わせて編集したか
- [ ] 特定商取引法表記など、運営形態に応じて必要な法定表示を追加したか
- [ ] Cloudflare Turnstileが実際に動作するか(現状 `VotePanel` / `CommentSection` は
      `window.__turnstileToken` を参照するダミー実装なので、実際のウィジェット埋め込みが必要)
- [ ] 匿名とはいえ名誉毀損・営業妨害等のリスクがあるサービスである点について、
      弁護士へ一度相談したか
