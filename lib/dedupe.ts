/**
 * lib/dedupe.ts
 * 業者名の正規化・重複候補判定ロジック
 */

/** 法人格・記号・全角半角・大文字小文字を正規化する */
export function normalizeCompanyName(raw: string): string {
  let s = raw;

  // 全角英数字→半角
  s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );

  // 法人格の略称を統一( (株) ㈱ → 株式会社 等)
  s = s.replace(/\(株\)|㈱/g, "株式会社");
  s = s.replace(/\(有\)|㈲/g, "有限会社");
  s = s.replace(/\(同\)|㈾/g, "合同会社");

  // 法人格そのものを除去(前株・後株どちらも吸収)
  const corporateForms = ["株式会社", "有限会社", "合同会社", "合名会社", "合資会社"];
  for (const form of corporateForms) {
    s = s.split(form).join("");
  }

  // スペース・ハイフン・記号類を除去
  s = s.replace(/[\s\u3000\-‐-‒–—―ー・.,、。()（）]/g, "");

  return s.toLowerCase().trim();
}

/** 電話番号を数字のみに正規化 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw.replace(/[^0-9]/g, "");
}

/** URLをドメイン単位で正規化(http/https, www, 末尾スラッシュの違いを吸収) */
export function normalizeWebsiteDomain(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** 簡易的な文字列類似度(トライグラムベースのJaccard係数)。DB側はpg_trgmを使用する想定で、これはクライアント側の簡易プレビュー用 */
export function trigramSimilarity(a: string, b: string): number {
  const trigrams = (s: string): Set<string> => {
    const padded = `  ${s}  `;
    const grams = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) {
      grams.add(padded.slice(i, i + 3));
    }
    return grams;
  };

  const setA = trigrams(a);
  const setB = trigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const g of setA) {
    if (setB.has(g)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export type ExistingCompany = {
  id: string;
  name: string;
  normalizedName: string;
  corporateNumber: string | null;
  phone: string | null;
  websiteUrl: string | null;
  prefecture: string;
  city: string | null;
};

export type NewCompanyInput = {
  name: string;
  corporateNumber?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  prefecture: string;
  city?: string | null;
};

export type DuplicateMatch = {
  company: ExistingCompany;
  confidence: "high" | "medium";
  reason: string;
  score: number;
};

const NAME_SIMILARITY_THRESHOLD = 0.6;

/**
 * 新規登録候補が既存業者と重複している可能性を判定する。
 * - high: 法人番号/電話番号/公式サイトドメインの完全一致 → 即警告し、既存ページへ誘導
 * - medium: 名称類似度が高く、かつ都道府県が一致 → 登録は受理するが管理者確認キューへ
 */
export function findDuplicateCandidates(
  input: NewCompanyInput,
  existingCompanies: ExistingCompany[]
): DuplicateMatch[] {
  const normalizedInputName = normalizeCompanyName(input.name);
  const normalizedInputPhone = normalizePhone(input.phone);
  const normalizedInputDomain = normalizeWebsiteDomain(input.websiteUrl);

  const matches: DuplicateMatch[] = [];

  for (const existing of existingCompanies) {
    // 高信頼度: 法人番号一致
    if (
      input.corporateNumber &&
      existing.corporateNumber &&
      input.corporateNumber === existing.corporateNumber
    ) {
      matches.push({
        company: existing,
        confidence: "high",
        reason: "corporate_number",
        score: 1,
      });
      continue;
    }

    // 高信頼度: 電話番号一致
    const existingPhone = normalizePhone(existing.phone);
    if (normalizedInputPhone && existingPhone && normalizedInputPhone === existingPhone) {
      matches.push({
        company: existing,
        confidence: "high",
        reason: "phone",
        score: 1,
      });
      continue;
    }

    // 高信頼度: 公式サイトドメイン一致
    const existingDomain = normalizeWebsiteDomain(existing.websiteUrl);
    if (normalizedInputDomain && existingDomain && normalizedInputDomain === existingDomain) {
      matches.push({
        company: existing,
        confidence: "high",
        reason: "website",
        score: 1,
      });
      continue;
    }

    // 中信頼度: 名称類似度 + 都道府県一致
    if (existing.prefecture === input.prefecture) {
      const similarity = trigramSimilarity(normalizedInputName, existing.normalizedName);
      if (similarity >= NAME_SIMILARITY_THRESHOLD) {
        matches.push({
          company: existing,
          confidence: "medium",
          reason: "name_similarity",
          score: similarity,
        });
      }
    }
  }

  // スコアの高い順(高信頼度優先)にソート
  return matches.sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === "high" ? -1 : 1;
    return b.score - a.score;
  });
}

/** 公式サイトのドメインからfaviconのURLを組み立てる(Googleの公開faviconサービスを利用) */
export function buildFaviconUrl(websiteUrl: string | null | undefined): string | null {
  const domain = normalizeWebsiteDomain(websiteUrl);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
