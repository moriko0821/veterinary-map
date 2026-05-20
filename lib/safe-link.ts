/**
 * 外部リンクの安全化ヘルパー
 *
 * Supabase に格納されたデータ（Excel から取り込んだ Google Maps 由来）を
 * <a href> や tel: リンクとして使う前に必ず通す。
 *
 * 攻撃シナリオ例: clinic.website = "javascript:alert(document.cookie)"
 * → 何も検証しないとユーザーがタップした瞬間に任意コード実行が可能。
 * これらを null に丸めて無害化する。
 */

/**
 * URL が安全か検証する。
 * - http://, https:// のみ許可
 * - javascript:, data:, file:, vbscript: などは null
 * - 不正な URL もパース失敗で null
 *
 * 注: 病院サイトには http:// 平文サイトも多いため、http も許可している。
 *     本番で https のみに絞りたくなったら ALLOW_HTTP を false に。
 */
const ALLOW_HTTP = true;

export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') return parsed.toString();
    if (ALLOW_HTTP && parsed.protocol === 'http:') return parsed.toString();
    return null;
  } catch {
    return null;
  }
}

/**
 * 電話番号を tel: リンク用に正規化する。
 * - 数字、ハイフン、プラス、スペース、括弧のみ通す
 * - それ以外の文字 (英字や記号) はすべて除去
 * - 結果が空文字なら null
 */
export function safeTel(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // 国際電話含めて許容: 数字 0-9, ハイフン, プラス, スペース, 括弧
  const cleaned = phone.replace(/[^\d\-+\s()]/g, '').trim();
  if (!cleaned || !/\d/.test(cleaned)) return null;
  return `tel:${cleaned}`;
}
