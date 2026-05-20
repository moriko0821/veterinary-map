/**
 * 営業時間フラグ再計算スクリプト
 *
 * is_24h / open_saturday / open_sunday / closed_days / business_hours を
 * 既存の business_hours_raw から再パースして更新する。
 * Geocoding 不要、Supabase の update のみ。10秒程度で完了。
 *
 * 実行: pnpm tsx scripts/recompute-flags.ts
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { parseBusinessHours } from './parse';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ env vars missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('📥 全 clinics の business_hours_raw を取得中...');
  // ページング読み込み (Supabase 1000件制限のため)
  const all: { id: string; business_hours_raw: string | null }[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('clinics')
      .select('id,business_hours_raw')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`✅ ${all.length} 件取得`);

  // パース
  console.log('🔄 営業時間を再パース...');
  const updates = all.map((c) => {
    const bh = parseBusinessHours(c.business_hours_raw);
    return {
      id: c.id,
      business_hours: bh ? bh.byDay : null,
      is_24h: bh?.is_24h ?? false,
      open_saturday: bh?.open_saturday ?? false,
      open_sunday: bh?.open_sunday ?? false,
      closed_days: bh?.closed_days ?? [],
    };
  });

  // 統計
  const stats = {
    is_24h: updates.filter((u) => u.is_24h).length,
    open_saturday: updates.filter((u) => u.open_saturday).length,
    open_sunday: updates.filter((u) => u.open_sunday).length,
  };
  console.log(`📊 新しい統計:`);
  console.log(`  夜間対応 (is_24h): ${stats.is_24h}`);
  console.log(`  土曜診療: ${stats.open_saturday}`);
  console.log(`  日曜診療: ${stats.open_sunday}`);

  // 1件ずつ update (upsert は INSERT 扱いになり name not null に当たるため)
  console.log('💾 Supabase に書き込み中...');
  let done = 0;
  const CONCURRENCY = 20;
  async function worker(items: typeof updates) {
    for (const u of items) {
      const { error } = await supabase
        .from('clinics')
        .update({
          business_hours: u.business_hours,
          is_24h: u.is_24h,
          open_saturday: u.open_saturday,
          open_sunday: u.open_sunday,
          closed_days: u.closed_days,
        })
        .eq('id', u.id);
      if (error) {
        console.error('  ❌ update error:', u.id, error.message);
      }
      done++;
      if (done % 500 === 0) {
        console.log(`  ${done} / ${updates.length}`);
      }
    }
  }
  // 並列ワーカーで分割
  const chunks: (typeof updates)[] = Array.from({ length: CONCURRENCY }, () => []);
  updates.forEach((u, i) => chunks[i % CONCURRENCY].push(u));
  await Promise.all(chunks.map(worker));

  console.log('🎉 完了');
}

main().catch((e) => {
  console.error('💥 致命的エラー:', e);
  process.exit(1);
});
