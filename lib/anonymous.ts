/**
 * lib/anonymous.ts
 * 匿名識別子(Cookie)発行、IPハッシュ・暗号化ユーティリティ
 *
 * 方針:
 * - 一般公開画面・DBの主キー参照には「ハッシュ値」のみを使う
 * - 生のIPアドレスは監査目的でのみ暗号化保存し、復号は管理者操作時に限定する
 */

import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

const IDENTIFIER_COOKIE_NAME = "anon_uid";
const IDENTIFIER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2年

/** 匿名識別子として使うランダムUUIDを生成する(初回アクセス時にCookie発行) */
export function generateAnonymousIdentifier(): string {
  return crypto.randomUUID();
}

/** Cookieに保存する匿名識別子をハッシュ化してDBキーにする(ソルト付き) */
export function hashIdentifier(identifier: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${identifier}`).digest("hex");
}

/** IPアドレスをハッシュ化する(突合・レートリミット判定用。生IPはここでは保持しない) */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * IPアドレスをAES-256-GCMで暗号化する(監査・法的対応のための最小限の保持)
 * key は環境変数 IP_ENCRYPTION_KEY (32byte, base64) を想定
 */
export function encryptIp(ip: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, "base64");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(ip, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv + authTag + encrypted を1つのbase64文字列にまとめる
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** 管理者操作時のみ呼び出す復号関数。呼び出し側で admin_access_logs への記録を必須とする */
export function decryptIp(payloadBase64: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, "base64");
  const payload = Buffer.from(payloadBase64, "base64");
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export const cookieConfig = {
  name: IDENTIFIER_COOKIE_NAME,
  maxAge: IDENTIFIER_COOKIE_MAX_AGE,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: true,
  path: "/",
};

/**
 * UAから簡易的にブラウザ/OS/端末種別を抽出する(詳細な解析はua-parser-js等の導入を推奨)
 */
export function parseUserAgent(ua: string) {
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const browser = /Chrome/i.test(ua)
    ? "Chrome"
    : /Safari/i.test(ua)
    ? "Safari"
    : /Firefox/i.test(ua)
    ? "Firefox"
    : "Other";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS/i.test(ua)
    ? "macOS"
    : /Android/i.test(ua)
    ? "Android"
    : /iOS|iPhone|iPad/i.test(ua)
    ? "iOS"
    : "Other";

  return {
    browser,
    os,
    deviceType: isMobile ? "mobile" : "desktop",
  };
}
