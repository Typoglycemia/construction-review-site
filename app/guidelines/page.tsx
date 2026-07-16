// app/guidelines/page.tsx
export const metadata = { title: "投稿ガイドライン" };

export default function GuidelinesPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 prose prose-sm">
      <h1>投稿ガイドライン</h1>
      <p>安心してご利用いただくため、投稿の際は以下をお守りください。</p>

      <h2>投稿していただきたいこと</h2>
      <ul>
        <li>実際の利用体験に基づいた、事実に即した内容</li>
        <li>対応の速さ、見積もりの正確さ、施工の質など、具体的な内容</li>
      </ul>

      <h2>投稿を禁止していること</h2>
      <ul>
        <li>個人の住所・電話番号・メールアドレス・家族情報などの個人情報</li>
        <li>脅迫、犯罪予告</li>
        <li>差別的表現</li>
        <li>明らかな虚偽情報</li>
        <li>同一人物による大量投稿、Botによる投稿</li>
        <li>無関係な誹謗中傷、なりすまし</li>
      </ul>

      <p>
        投稿内容については投稿者自身が責任を負います。ガイドラインに反する投稿を見つけた場合は、
        各コメントの通報ボタンからお知らせください。
      </p>
    </main>
  );
}
