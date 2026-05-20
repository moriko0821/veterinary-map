'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Star, X, ChevronRight, SlidersHorizontal } from 'lucide-react';
import MapView from '@/components/MapView';
import { supabase, type Clinic } from '@/lib/supabase';
import { sanitizeSearchInput, splitKeywords } from '@/lib/sanitize';
import Link from 'next/link';

export default function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  // URL 由来の値はすべてサニタイズ済みに整える
  const q = sanitizeSearchInput(params.get('q') ?? '');
  const reviewQ = params.get('review_q') ?? '';
  const nearby = params.get('nearby') === '1';
  const minRating = params.get('min_rating');
  const is24h = params.get('is_24h') === '1';
  const openSaturday = params.get('open_saturday') === '1';
  const openSunday = params.get('open_sunday') === '1';
  // 口コミキーワード: 空白区切りで複数指定、サニタイズ + 重複除去 + 最大10件で AND 絞り込み
  const reviewKeywords = useMemo(() => splitKeywords(reviewQ), [reviewQ]);

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSelectedId(null);

      try {
        let userPos: GeolocationPosition | null = null;
        if (nearby && typeof navigator !== 'undefined' && navigator.geolocation) {
          userPos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              maximumAge: 60_000,
            }),
          ).catch(() => null);
        }

        if (nearby && userPos) {
          const lat = userPos.coords.latitude;
          const lng = userPos.coords.longitude;
          if (!cancelled) setCenter({ lat, lng });

          const { data, error: rpcErr } = await supabase.rpc('nearby_clinics', {
            center_lat: lat,
            center_lng: lng,
            radius_m: 10_000,
            min_rating: minRating ? Number(minRating) : 0,
            min_reviews: 0,
          });
          if (rpcErr) throw rpcErr;
          if (!cancelled) {
            setClinics(
              (data ?? []).map((r: { id: string; name: string; address: string | null; prefecture: string | null; city: string | null; rating: number | null; review_count: number | null; lat: number; lng: number }) => ({
                id: r.id,
                name: r.name,
                address: r.address,
                prefecture: r.prefecture,
                city: r.city,
                rating: r.rating,
                review_count: r.review_count,
                phone: null,
                website: null,
                google_maps_url: null,
                business_hours_raw: null,
                is_24h: false,
                open_saturday: false,
                open_sunday: false,
                lat: r.lat,
                lng: r.lng,
              })),
            );
          }
        } else {
          // 通常検索
          let query = supabase
            .from('clinics')
            .select(
              'id,name,address,prefecture,city,rating,review_count,phone,website,google_maps_url,business_hours_raw,is_24h,open_saturday,open_sunday,lat,lng',
            )
            .not('lat', 'is', null);

          if (q) {
            // q は既にサニタイズ済み (URL読み込み時に sanitizeSearchInput を通している)
            // 地域・施設名検索: 口コミは含めない (review_q が口コミ専用)
            query = query.or(
              `name.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%,prefecture.ilike.%${q}%`,
            );
          }
          if (minRating) query = query.gte('rating', Number(minRating));
          if (is24h) query = query.eq('is_24h', true);
          if (openSaturday) query = query.eq('open_saturday', true);
          if (openSunday) query = query.eq('open_sunday', true);
          // 口コミキーワード: 複数指定は AND、各キーワードは「名前 or 口コミ本文」で OR
          // reviewKeywords は splitKeywords でサニタイズ済み
          reviewKeywords.forEach((kw) => {
            query = query.or(`name.ilike.%${kw}%,reviews_text.ilike.%${kw}%`);
          });

          const { data, error: dbErr } = await query
            .order('review_count', { ascending: false })
            .limit(200);
          if (dbErr) throw dbErr;
          if (!cancelled) setClinics((data ?? []) as Clinic[]);
        }
      } catch (e) {
        // 詳細はコンソールへ (開発時のデバッグ用)。ユーザー画面には汎用メッセージのみ。
        console.error('[SearchResults] load error:', e);
        if (!cancelled) setError('検索に失敗しました。時間を置いて再度お試しください。');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [q, nearby, minRating, is24h, openSaturday, openSunday, reviewKeywords]);

  // マーカーが選ばれたらリストの該当要素にスクロール
  useEffect(() => {
    if (!selectedId) return;
    const el = itemRefs.current[selectedId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedId]);

  type Chip = { label: string; key: string; reviewKw?: string };
  const filterChips: Chip[] = [];
  if (q) filterChips.push({ label: `「${q}」`, key: 'q' });
  if (nearby) filterChips.push({ label: '現在地周辺 10km', key: 'nearby' });
  if (minRating) filterChips.push({ label: `★${minRating}以上`, key: 'min_rating' });
  if (is24h) filterChips.push({ label: '夜間対応', key: 'is_24h' });
  if (openSaturday) filterChips.push({ label: '土曜診療', key: 'open_saturday' });
  if (openSunday) filterChips.push({ label: '日曜診療', key: 'open_sunday' });
  reviewKeywords.forEach((kw) =>
    filterChips.push({ label: `口コミ:${kw}`, key: 'review_q', reviewKw: kw }),
  );

  const removeChip = (chip: Chip) => {
    const sp = new URLSearchParams(params.toString());
    if (chip.key === 'review_q' && chip.reviewKw) {
      const remaining = reviewKeywords.filter((k) => k !== chip.reviewKw);
      if (remaining.length) sp.set('review_q', remaining.join(' '));
      else sp.delete('review_q');
    } else {
      sp.delete(chip.key);
    }
    router.replace(`/search/results?${sp.toString()}`);
  };

  const editFilters = () => {
    // 現在の条件を /search にそのまま渡して編集モードへ
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden flex flex-col bg-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-2 p-3">
          <button onClick={() => router.push('/search')} className="p-1 -ml-1">
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">検索結果</div>
            <div className="text-xs text-slate-500">
              {loading ? '読み込み中…' : `${clinics.length.toLocaleString()} 件`}
            </div>
          </div>
          <button
            onClick={editFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold active:bg-orange-200"
          >
            <SlidersHorizontal size={13} />
            条件編集
          </button>
        </div>
        {filterChips.length > 0 && (
          <div className="px-3 pb-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {filterChips.map((c) => (
              <button
                key={c.key + (c.reviewKw ?? '')}
                onClick={() => removeChip(c)}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-orange-100 text-orange-700 font-medium active:bg-orange-200"
              >
                {c.label}
                <X size={12} />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 地図 (上 45%) */}
      <div className="shrink-0 h-[45%]">
        <MapView
          clinics={clinics}
          height="100%"
          markerColor="#FF6F00"
          initialCenter={center ?? undefined}
          // 現在地: 街区レベル、それ以外: 関東全体が見える程度
          initialZoom={center ? 13 : 9}
          selectedId={selectedId}
          // 地域名検索(q)がある時だけ結果範囲にフィット。フィルターのみなら関東中心の固定ズーム
          fitToClinics={!center && !!q && clinics.length > 0}
          onSelect={(c) => setSelectedId(c.id)}
        />
      </div>

      {/* リスト (下 残り) */}
      <div ref={listRef} className="flex-1 overflow-y-auto bg-white">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 m-3 rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && clinics.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            <MapPin size={32} className="mx-auto text-slate-300 mb-2" />
            該当する動物病院が見つかりませんでした
            <div className="mt-2">
              <button
                onClick={() => router.push('/search')}
                className="text-orange-600 underline"
              >
                条件を変える
              </button>
            </div>
          </div>
        )}
        {clinics.map((c) => {
          const isSelected = c.id === selectedId;
          return (
            <Link
              key={c.id}
              href={`/clinic/${c.id}`}
              ref={(el) => { itemRefs.current[c.id] = el; }}
              className={`block px-4 py-3 border-b transition ${
                isSelected
                  ? 'bg-orange-50 border-orange-300 border-l-4 border-l-orange-500'
                  : 'border-slate-100 hover:bg-slate-50 active:bg-slate-100'
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  isSelected ? 'bg-orange-200' : 'bg-orange-100'
                }`}>
                  🏥
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{c.name}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                    <span className="inline-flex items-center gap-0.5">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {c.rating ?? '-'}
                    </span>
                    <span>({c.review_count}件)</span>
                    <span className="truncate">{c.city || c.prefecture}</span>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {c.is_24h && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        24h
                      </span>
                    )}
                    {c.open_saturday && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        土曜OK
                      </span>
                    )}
                    {c.open_sunday && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        日曜OK
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* 選択中だけ展開: 住所と詳細リンク */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  {c.address && (
                    <div className="text-xs text-slate-600 mb-2 truncate">
                      📍 {c.address}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-700 font-semibold">
                      タップで詳細へ
                    </span>
                    <ChevronRight size={16} className="text-orange-500" />
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
