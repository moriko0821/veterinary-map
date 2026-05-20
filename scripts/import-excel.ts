/**
 * Excel → Geocode → Supabase インポートスクリプト
 *
 * 実行方法:
 *   pnpm tsx scripts/import-excel.ts                # 本番モード（全件）
 *   pnpm tsx scripts/import-excel.ts --dry          # 最初の 5 件だけテスト（API費用ゼロにはならないが確認用）
 *   pnpm tsx scripts/import-excel.ts --skip-geocode # ジオコーディングをスキップ（座標は null のまま、口コミと営業時間のみ更新したい時用）
 *
 * 中断したら同じコマンドで再開可能（.import-progress.json に進捗保存）
 */
// このマシンの AV/プロキシが SSL を再署名するため、Node の標準CAでは Cloudflare 配下の
// Supabase エンドポイント証明書を検証できない。ローカル一回限りのスクリプト用なので
// 検証無効化を許容（送受信先は固定の Supabase/Google API のみ）
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { parseReviews, parseBusinessHours, parseAddress } from './parse';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env.local') });

const XLSX_PATH = path.resolve(__dirname, '../../全国動物病院リスト.xlsx');
const PROGRESS_PATH = path.resolve(__dirname, '.import-progress.json');
const ERROR_LOG = path.resolve(__dirname, '.import-errors.csv');

const DRY = process.argv.includes('--dry');
const SKIP_GEOCODE = process.argv.includes('--skip-geocode');
// --limit N で「未処理のうち最初の N 件だけ処理」
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split('=')[1]) : null;
const BATCH_SIZE = 50;        // Supabase に 50 件ずつ upsert
const GEOCODE_CONCURRENCY = 10; // 同時 Geocoding API 呼び出し数

// ---------- 環境変数チェック ----------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY_SERVER || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ .env.local に NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を入れてください');
  process.exit(1);
}
if (!SKIP_GEOCODE && !MAPS_KEY) {
  console.error('❌ .env.local に GOOGLE_MAPS_API_KEY_SERVER (または NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) を入れてください');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------- 進捗ファイル ----------
type Progress = { doneIds: string[]; failedIds: string[] };
function loadProgress(): Progress {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
  } catch {
    return { doneIds: [], failedIds: [] };
  }
}
function saveProgress(p: Progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(p));
}

// ---------- Geocoding ----------
type GeocodeResult = { lat: number; lng: number; accuracy: string } | null;

async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!MAPS_KEY) return null;
  const params = new URLSearchParams({
    address,
    region: 'jp',
    language: 'ja',
    key: MAPS_KEY,
  });
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Geocoding HTTP ${res.status} for: ${address.slice(0, 40)}`);
    return null;
  }
  const data = await res.json() as {
    status: string;
    results: Array<{
      geometry: { location: { lat: number; lng: number }; location_type: string };
    }>;
    error_message?: string;
  };
  if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED') {
    throw new Error(`Geocoding ${data.status}: ${data.error_message ?? ''}`);
  }
  if (data.status !== 'OK' || !data.results.length) {
    return null;
  }
  const r = data.results[0];
  return {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    accuracy: r.geometry.location_type,
  };
}

// ---------- 並列処理ユーティリティ ----------
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function runOne() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runOne));
  return results;
}

// ---------- メイン ----------
async function main() {
  console.log(`📂 Excel 読み込み: ${XLSX_PATH}`);
  if (!fs.existsSync(XLSX_PATH)) {
    console.error('❌ Excel ファイルが見つかりません');
    process.exit(1);
  }
  const wb = XLSX.readFile(XLSX_PATH, { cellDates: false });
  const ws = wb.Sheets['all_vets'];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: '' });
  console.log(`✅ ${rows.length} 行読み込み完了`);

  let targetRows = rows;
  if (DRY) {
    targetRows = rows.slice(0, 5);
    console.log(`🧪 DRY モード: 最初の ${targetRows.length} 件のみ処理`);
  }

  // 進捗復元
  const progress = loadProgress();
  const doneSet = new Set(progress.doneIds);
  const skipped = targetRows.filter((r) => doneSet.has(String(r['店舗ID'])));
  let todo = targetRows.filter((r) => !doneSet.has(String(r['店舗ID'])));
  console.log(`📊 既完了 ${skipped.length} / 残り ${todo.length}`);
  if (LIMIT !== null && LIMIT > 0) {
    todo = todo.slice(0, LIMIT);
    console.log(`🎯 --limit=${LIMIT} 指定: 今回は ${todo.length} 件のみ処理 (推定コスト ~$${(todo.length * 0.005).toFixed(2)})`);
  }

  if (!fs.existsSync(ERROR_LOG)) {
    fs.writeFileSync(ERROR_LOG, 'place_id,name,address,reason\n');
  }

  // バッチごとに処理
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    console.log(`\n🔄 バッチ ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(todo.length / BATCH_SIZE)} (${batch.length}件)`);

    // 1) 各行を整形 + Geocoding
    const records = await mapWithConcurrency(batch, GEOCODE_CONCURRENCY, async (row) => {
      const place_id = String(row['店舗ID'] || '').trim();
      const name = String(row['施設名'] || '').trim();
      const address_raw = String(row['住所'] || '').trim();
      const { postal_code, cleaned, prefecture: prefFromAddr, city } = parseAddress(address_raw);
      const prefecture = String(row['都道府県'] || prefFromAddr || '').trim() || null;
      const area = String(row['取得エリア'] || '').trim() || null;
      const rating_str = String(row['評価の平均'] || '').trim();
      const rating = rating_str ? Number(rating_str) : null;
      const review_count = Number(row['口コミ数'] || 0);
      const phone = String(row['電話番号'] || '').trim() || null;
      const website = String(row['Webサイト'] || '').trim() || null;
      const business_hours_raw = String(row['営業時間'] || '').trim() || null;
      const reviews_raw = String(row['口コミ(最大5件)'] || '').trim();
      const google_maps_url = String(row['GoogleマップURL'] || '').trim() || null;

      const bh = parseBusinessHours(business_hours_raw);
      const reviews = parseReviews(reviews_raw);

      // ジオコーディング
      let lat: number | null = null;
      let lng: number | null = null;
      if (!SKIP_GEOCODE && cleaned) {
        try {
          const g = await geocodeAddress(cleaned);
          if (g) {
            lat = g.lat;
            lng = g.lng;
          } else {
            fs.appendFileSync(
              ERROR_LOG,
              `${place_id},"${name}","${cleaned.replace(/"/g, '""')}",geocode_no_result\n`,
            );
          }
        } catch (e) {
          fs.appendFileSync(
            ERROR_LOG,
            `${place_id},"${name}","${cleaned.replace(/"/g, '""')}",geocode_error:${(e as Error).message}\n`,
          );
        }
      }

      const clinic = {
        id: place_id,
        name,
        address: cleaned,
        postal_code,
        prefecture,
        city,
        area,
        rating,
        review_count,
        phone,
        website,
        google_maps_url,
        business_hours_raw,
        business_hours: bh ? bh.byDay : null,
        is_24h: bh?.is_24h ?? false,
        open_saturday: bh?.open_saturday ?? false,
        open_sunday: bh?.open_sunday ?? false,
        closed_days: bh?.closed_days ?? [],
        lat,
        lng,
        reviews_text: reviews.map((r) => r.text).join('\n'),
        geocoded_at: !SKIP_GEOCODE && lat !== null ? new Date().toISOString() : null,
      };

      return { clinic, reviews, place_id };
    });

    // 2) Supabase へ upsert
    const clinicRows = records.map((r) => r.clinic).filter((c) => c.id);
    const { error: clinicErr } = await supabase.from('clinics').upsert(clinicRows, {
      onConflict: 'id',
    });
    if (clinicErr) {
      console.error('  ❌ clinics upsert error:', clinicErr.message);
      // 全部失敗扱いで次のバッチへ（マニュアル介入が必要）
      records.forEach((r) => progress.failedIds.push(r.place_id));
      saveProgress(progress);
      continue;
    }

    // 3) reviews を入れる（クリニックごとに古い口コミを delete → insert）
    const placeIds = records.map((r) => r.place_id);
    await supabase.from('reviews').delete().in('clinic_id', placeIds);
    const reviewRows = records.flatMap((r) =>
      r.reviews.map((rv) => ({
        clinic_id: r.place_id,
        author: rv.author,
        rating: rv.rating,
        text: rv.text,
        posted_rel: rv.posted_rel,
        position: rv.position,
      })),
    );
    if (reviewRows.length) {
      const { error: revErr } = await supabase.from('reviews').insert(reviewRows);
      if (revErr) console.warn('  ⚠️ reviews insert error:', revErr.message);
    }

    // 4) 進捗保存
    records.forEach((r) => progress.doneIds.push(r.place_id));
    saveProgress(progress);
    const successCount = clinicRows.filter((c) => c.lat !== null).length;
    console.log(`  ✅ ${clinicRows.length}件 upsert (うちジオコーディング成功 ${successCount}件)`);
  }

  console.log('\n🎉 全件処理完了');
  console.log(`  成功: ${progress.doneIds.length}`);
  console.log(`  失敗: ${progress.failedIds.length}`);
  console.log(`  エラーログ: ${ERROR_LOG}`);
}

main().catch((e) => {
  console.error('💥 致命的エラー:', e);
  process.exit(1);
});
