'use client';

import { useEffect, useState } from 'react';
import { Filter, Locate, X } from 'lucide-react';
import MapView from '@/components/MapView';
import { supabase, type Clinic } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const PREF_OPTIONS = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県',
  '岐阜県','静岡県','愛知県','三重県',
  '滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県',
  '鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県',
  '福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];

export default function MapExplore() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Clinic | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [prefecture, setPrefecture] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [is24h, setIs24h] = useState(false);
  const [openSunday, setOpenSunday] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 35.681236,
    lng: 139.767125, // 東京駅 (デフォルト)
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let q = supabase
        .from('clinics')
        .select(
          'id,name,address,prefecture,city,rating,review_count,phone,website,google_maps_url,business_hours_raw,is_24h,open_saturday,open_sunday,lat,lng',
        )
        .not('lat', 'is', null);
      if (prefecture) q = q.eq('prefecture', prefecture);
      if (minRating > 0) q = q.gte('rating', minRating);
      if (is24h) q = q.eq('is_24h', true);
      if (openSunday) q = q.eq('open_sunday', true);

      const { data } = await q.order('review_count', { ascending: false }).limit(500);
      if (!cancelled) {
        setClinics((data ?? []) as Clinic[]);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [prefecture, minRating, is24h, openSunday]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  const filterCount =
    (prefecture ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (is24h ? 1 : 0) +
    (openSunday ? 1 : 0);

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-slate-50">
      {/* 上部: タイトル + 件数 */}
      <header className="absolute top-0 inset-x-0 z-10 bg-white/95 backdrop-blur shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <h1 className="font-bold text-slate-900">マップ探索</h1>
          <span className="text-xs text-slate-500">
            {loading ? '…' : `${clinics.length} 件表示中`}
          </span>
          <button
            onClick={() => setShowFilters(true)}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold"
          >
            <Filter size={14} />
            フィルター
            {filterCount > 0 && (
              <span className="bg-orange-600 text-white rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 地図 */}
      <MapView
        clinics={clinics}
        height="100%"
        markerColor="#FF6F00"
        initialCenter={center}
        initialZoom={11}
        onSelect={setSelected}
      />

      {/* 現在地 FAB */}
      <button
        onClick={useMyLocation}
        className="absolute bottom-24 right-4 z-10 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-orange-600 active:scale-95 transition"
        aria-label="現在地に移動"
      >
        <Locate size={20} />
      </button>

      {/* 選択中の病院カード */}
      {selected && (
        <div className="absolute bottom-4 inset-x-4 z-10 bg-white rounded-2xl shadow-2xl p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate">{selected.name}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                ★{selected.rating ?? '-'} · {selected.review_count}件
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">{selected.address}</div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-400 -mr-1 -mt-1 p-1"
            >
              <X size={18} />
            </button>
          </div>
          <button
            onClick={() => router.push(`/clinic/${selected.id}`)}
            className="mt-3 w-full py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm"
          >
            詳しく見る →
          </button>
        </div>
      )}

      {/* フィルタードロワー (下から) */}
      {showFilters && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowFilters(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 max-h-[80dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">絞り込み</h2>
              <button onClick={() => setShowFilters(false)} className="text-slate-400">
                <X size={22} />
              </button>
            </div>

            <label className="block mb-4">
              <div className="text-xs font-semibold text-slate-700 mb-1.5">都道府県</div>
              <select
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
              >
                <option value="">すべて</option>
                {PREF_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-700 mb-1.5">
                評価 {minRating > 0 ? `★${minRating} 以上` : 'すべて'}
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <label className="flex items-center justify-between py-3 border-t border-slate-100">
              <span className="text-sm text-slate-700">24時間営業</span>
              <input
                type="checkbox"
                checked={is24h}
                onChange={(e) => setIs24h(e.target.checked)}
                className="w-5 h-5 accent-orange-500"
              />
            </label>
            <label className="flex items-center justify-between py-3 border-t border-slate-100">
              <span className="text-sm text-slate-700">日曜診療あり</span>
              <input
                type="checkbox"
                checked={openSunday}
                onChange={(e) => setOpenSunday(e.target.checked)}
                className="w-5 h-5 accent-orange-500"
              />
            </label>

            <button
              onClick={() => setShowFilters(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-orange-500 text-white font-bold"
            >
              この条件で見る ({clinics.length}件)
            </button>
            {filterCount > 0 && (
              <button
                onClick={() => {
                  setPrefecture('');
                  setMinRating(0);
                  setIs24h(false);
                  setOpenSunday(false);
                }}
                className="mt-2 w-full py-2 text-sm text-slate-500"
              >
                フィルターをクリア
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
