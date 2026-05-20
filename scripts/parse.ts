// Excel 行のパース処理（口コミ・営業時間・住所）
// 単体で import-excel.ts から使用

export type ReviewParsed = {
  author: string;
  posted_rel: string;
  rating: number | null;
  text: string;
  position: number;
};

const REVIEW_DELIMITER = /\n-+\n/; // 23個ハイフンが基本だが念のため緩めに
const REVIEW_HEADER_RE = /^(.+?)\s*\/\s*(.+?)\s*[⭐★](\d)\s*:\s*([\s\S]*)$/;

export function parseReviews(raw: string | null | undefined): ReviewParsed[] {
  if (!raw) return [];
  const segments = raw.split(REVIEW_DELIMITER).map((s) => s.trim()).filter(Boolean);
  const result: ReviewParsed[] = [];
  segments.forEach((seg, idx) => {
    const m = seg.match(REVIEW_HEADER_RE);
    if (!m) {
      // ヘッダーが取れない場合は本文だけ拾う
      result.push({
        author: 'unknown',
        posted_rel: '',
        rating: null,
        text: seg,
        position: idx,
      });
      return;
    }
    const [, author, posted_rel, rating, text] = m;
    result.push({
      author: author.trim(),
      posted_rel: posted_rel.trim(),
      rating: Number(rating),
      text: text.trim(),
      position: idx,
    });
  });
  return result;
}

// ---------- 営業時間 ----------
const DAY_MAP: Record<string, string> = {
  月曜日: 'mon', 火曜日: 'tue', 水曜日: 'wed', 木曜日: 'thu',
  金曜日: 'fri', 土曜日: 'sat', 日曜日: 'sun',
};

export type BusinessHours = {
  raw: string;
  byDay: Record<string, { closed: boolean; periods: { open: string; close: string }[] }>;
  is_24h: boolean;
  open_saturday: boolean;
  open_sunday: boolean;
  closed_days: string[];
};

const TIME_RANGE_RE = /(\d{1,2})時(\d{2})分\s*[～〜~-]\s*(\d{1,2})時(\d{2})分/g;

export function parseBusinessHours(raw: string | null | undefined): BusinessHours | null {
  if (!raw) return null;
  const byDay: BusinessHours['byDay'] = {};
  const closed_days: string[] = [];
  // is_24h は「夜間対応あり」(深夜・早朝・21時以降開始 など) を示す。
  // 真の意味で 0:00-24:00 の連続営業は Google Maps データ上ほぼ存在しないため、
  // UI ラベル「夜間対応」と意味を揃えるためにこのフラグの意味を拡張している。
  let is_24h = false;

  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^(月|火|水|木|金|土|日)曜日\s*[:：]\s*(.+)$/);
    if (!m) continue;
    const dayJp = m[1] + '曜日';
    const dayEn = DAY_MAP[dayJp];
    const rhs = m[2].trim();
    if (/定休日|休|closed/i.test(rhs) && !/時/.test(rhs)) {
      byDay[dayEn] = { closed: true, periods: [] };
      closed_days.push(dayEn);
      continue;
    }
    const periods: { open: string; close: string }[] = [];
    let mm: RegExpExecArray | null;
    TIME_RANGE_RE.lastIndex = 0;
    while ((mm = TIME_RANGE_RE.exec(rhs)) !== null) {
      const o = `${mm[1].padStart(2, '0')}:${mm[2]}`;
      const c = `${mm[3].padStart(2, '0')}:${mm[4]}`;
      periods.push({ open: o, close: c });

      const openH = Number(mm[1]);
      const closeH = Number(mm[3]);
      // 夜間対応の判定:
      // - 21時以降に営業開始 (例: 21:00〜5:00)
      // - 0〜5時に営業開始 (深夜・早朝枠)
      // - 22時以降まで営業 (例: 18:00〜23:00)
      // - 0時に閉店 (= 24時まで or 翌0時)
      // - 翌日にまたぐ (例: 20:00〜2:30 → closeH < openH)
      const wrapsToNextDay =
        (closeH < openH) || (closeH <= 5 && openH >= 18);
      if (
        openH >= 21 ||
        openH <= 5 ||
        closeH >= 22 ||
        closeH === 0 ||
        wrapsToNextDay
      ) {
        is_24h = true;
      }
    }
    if (/24時間営業|24時間/.test(rhs)) is_24h = true;
    byDay[dayEn] = { closed: periods.length === 0, periods };
  }

  return {
    raw,
    byDay,
    is_24h,
    open_saturday: !!byDay['sat'] && !byDay['sat'].closed,
    open_sunday: !!byDay['sun'] && !byDay['sun'].closed,
    closed_days,
  };
}

// ---------- 住所パース ----------
export function parseAddress(addr: string | null | undefined): {
  postal_code: string | null;
  cleaned: string;
  prefecture: string | null;
  city: string | null;
} {
  if (!addr) return { postal_code: null, cleaned: '', prefecture: null, city: null };
  const postalMatch = addr.match(/〒?\s*(\d{3}-?\d{4})/);
  const postal_code = postalMatch ? postalMatch[1].replace('-', '').replace(/(\d{3})(\d{4})/, '$1-$2') : null;
  const cleaned = addr.replace(/〒?\s*\d{3}-?\d{4}\s*/, '').trim();

  // 都道府県（北海道 / 〇〇都・道・府・県）
  const prefMatch = cleaned.match(/^(北海道|東京都|京都府|大阪府|.{2,3}県)/);
  const prefecture = prefMatch ? prefMatch[1] : null;

  // 市区町村（郡もあり得る）。雑だが大部分でうまく行く
  let city: string | null = null;
  if (prefecture) {
    const rest = cleaned.slice(prefecture.length);
    const cityMatch = rest.match(/^([^0-9０-９]+?(?:市|区|町|村|郡[^0-9０-９]+?[町村]))/);
    if (cityMatch) city = cityMatch[1];
  }
  return { postal_code, cleaned, prefecture, city };
}
