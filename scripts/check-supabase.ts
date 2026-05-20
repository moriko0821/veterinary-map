/**
 * Supabase スキーマ + RLS 検証スクリプト
 * 実行: pnpm tsx scripts/check-supabase.ts
 *
 * 確認内容:
 *  1) 環境変数が正しくセットされているか
 *  2) service_role 経由で clinics / reviews テーブル + nearby_clinics RPC にアクセス可能
 *  3) anon 経由で SELECT は可能、INSERT/UPDATE/DELETE は すべて拒否される (RLS 動作確認)
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE || !ANON) {
  console.error(
    '❌ .env.local に NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です',
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = createClient(SUPABASE_URL, ANON, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let allOk = true;
const note = (ok: boolean, msg: string) => {
  console.log(`${ok ? '✅' : '❌'} ${msg}`);
  if (!ok) allOk = false;
};

async function main() {
  console.log(`🔌 Supabase URL: ${SUPABASE_URL}`);

  // ========================================
  // セクション 1: service_role でスキーマ確認
  // ========================================
  console.log('\n=== service_role 接続: スキーマ確認 ===');

  const { error: cErr, count: cCount } = await admin
    .from('clinics')
    .select('id', { count: 'exact', head: true });
  note(!cErr, `clinics テーブル: ${cErr ? cErr.message : `OK (現在 ${cCount} 件)`}`);

  const { error: rErr, count: rCount } = await admin
    .from('reviews')
    .select('id', { count: 'exact', head: true });
  note(!rErr, `reviews テーブル: ${rErr ? rErr.message : `OK (現在 ${rCount} 件)`}`);

  const { error: nErr } = await admin.rpc('nearby_clinics', {
    center_lat: 35.681236,
    center_lng: 139.767125,
    radius_m: 100,
  });
  note(!nErr, `nearby_clinics 関数: ${nErr ? nErr.message : 'OK'}`);

  // ========================================
  // セクション 2: anon で RLS 動作確認
  // ========================================
  console.log('\n=== anon 接続: RLS 動作確認 (公開ユーザー想定) ===');

  // 2-A: SELECT は許可されているはず
  const { data: anonRead, error: anonReadErr } = await anon
    .from('clinics')
    .select('id,name')
    .limit(1);
  note(
    !anonReadErr && (anonRead?.length ?? 0) > 0,
    `clinics SELECT (anon): ${anonReadErr ? anonReadErr.message : 'OK (公開読み取り可)'}`,
  );

  // 2-B: INSERT は拒否されるはず
  const fakeId = `__rls_test_${Date.now()}`;
  const { error: insErr } = await anon
    .from('clinics')
    .insert({ id: fakeId, name: 'RLS test' });
  note(
    !!insErr,
    `clinics INSERT (anon): ${
      insErr ? `拒否 ✓ (${insErr.code ?? insErr.message.slice(0, 60)})` : '❌ 通ってしまった！RLS設定を確認してください'
    }`,
  );

  // 念のため、もし INSERT が通ってしまったら掃除
  if (!insErr) {
    await admin.from('clinics').delete().eq('id', fakeId);
    console.log('  ⚠️ 挿入されたテスト行を削除しました');
  }

  // 2-C: UPDATE は拒否されるはず (実在の行を狙う)
  const { data: someRow } = await admin.from('clinics').select('id').limit(1).single();
  if (someRow) {
    const { data: updData, error: updErr } = await anon
      .from('clinics')
      .update({ name: 'RLS update test' })
      .eq('id', someRow.id)
      .select();
    // RLS では「行が見つからない」扱いで data=[] になることもある
    const blocked = !!updErr || (updData?.length ?? 0) === 0;
    note(
      blocked,
      `clinics UPDATE (anon): ${
        blocked
          ? `拒否 ✓ ${updErr ? `(${updErr.code ?? updErr.message.slice(0, 40)})` : '(影響行 0)'}`
          : '❌ 更新が通ってしまった！RLS設定を確認してください'
      }`,
    );
  }

  // 2-D: DELETE は拒否されるはず
  if (someRow) {
    const { data: delData, error: delErr } = await anon
      .from('clinics')
      .delete()
      .eq('id', someRow.id)
      .select();
    const blocked = !!delErr || (delData?.length ?? 0) === 0;
    note(
      blocked,
      `clinics DELETE (anon): ${
        blocked
          ? `拒否 ✓ ${delErr ? `(${delErr.code ?? delErr.message.slice(0, 40)})` : '(影響行 0)'}`
          : '❌ 削除が通ってしまった！RLS設定を確認してください'
      }`,
    );
  }

  // 2-E: reviews も同様に確認
  const { data: someReview } = await admin.from('reviews').select('id').limit(1).single();
  if (someReview) {
    const { data: rDelData, error: rDelErr } = await anon
      .from('reviews')
      .delete()
      .eq('id', someReview.id)
      .select();
    const blocked = !!rDelErr || (rDelData?.length ?? 0) === 0;
    note(
      blocked,
      `reviews DELETE (anon): ${
        blocked
          ? `拒否 ✓ ${rDelErr ? `(${rDelErr.code ?? rDelErr.message.slice(0, 40)})` : '(影響行 0)'}`
          : '❌ 削除が通ってしまった！RLS設定を確認してください'
      }`,
    );
  }

  // ========================================
  // まとめ
  // ========================================
  console.log('');
  if (allOk) {
    console.log('🎉 すべての検証OK！ RLS は正しく動作しています。');
  } else {
    console.error(
      '💥 失敗あり。Supabase ダッシュボード > Authentication > Policies で書き込み用ポリシーが追加されていないか確認してください。',
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('💥 致命的エラー:', e);
  process.exit(1);
});
