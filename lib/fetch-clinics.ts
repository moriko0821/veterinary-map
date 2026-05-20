import 'server-only';

// ローカル開発: AV/プロキシのSSL再署名で Node の標準CA が Supabase 証明書を検証できないため、
// 検証を無効化。本番(Vercel)では発動しないので影響なし。
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { createClient } from '@supabase/supabase-js';
import type { Clinic } from './supabase';

// サーバー側だけで使う（環境変数を直接読む）
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function fetchSampleClinics(limit = 50): Promise<Clinic[]> {
  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('clinics')
    .select(
      'id,name,address,prefecture,city,rating,review_count,phone,website,google_maps_url,business_hours_raw,is_24h,open_saturday,open_sunday,lat,lng',
    )
    .not('lat', 'is', null)
    .order('review_count', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('fetchSampleClinics error', error);
    return [];
  }
  return data as Clinic[];
}
