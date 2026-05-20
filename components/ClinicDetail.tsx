'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Phone, Globe, MapPin, Clock, Star, Navigation } from 'lucide-react';
import MapView from '@/components/MapView';
import { supabase, type Clinic, type Review } from '@/lib/supabase';
import { safeHref, safeTel } from '@/lib/safe-link';

type Props = { id: string };

type Stub = { id: string; name: string; at: number };

function loadList(key: string): Stub[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}
function saveList(key: string, v: Stub[]) {
  localStorage.setItem(key, JSON.stringify(v));
}

export default function ClinicDetail({ id }: Props) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [favored, setFavored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [travelInfo, setTravelInfo] = useState<{
    walking?: string;
    driving?: string;
    transit?: string;
  } | null>(null);
  const [computingTravel, setComputingTravel] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: c, error: cErr } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (cErr || !c) {
        if (!cancelled) {
          setError('病院情報を取得できませんでした');
          setLoading(false);
        }
        return;
      }
      const { data: r } = await supabase
        .from('reviews')
        .select('*')
        .eq('clinic_id', id)
        .order('position');
      if (!cancelled) {
        setClinic(c as Clinic);
        setReviews((r ?? []) as Review[]);
        setLoading(false);

        // 履歴に記録
        const history = loadList('vet:history').filter((h) => h.id !== id);
        history.unshift({ id, name: (c as Clinic).name, at: Date.now() });
        saveList('vet:history', history.slice(0, 50));

        // お気に入り状態
        setFavored(loadList('vet:favorites').some((f) => f.id === id));
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleFavorite = () => {
    if (!clinic) return;
    const list = loadList('vet:favorites');
    if (favored) {
      saveList('vet:favorites', list.filter((f) => f.id !== id));
      setFavored(false);
    } else {
      list.unshift({ id, name: clinic.name, at: Date.now() });
      saveList('vet:favorites', list);
      setFavored(true);
    }
  };

  const computeTravelTime = async () => {
    if (!clinic?.lat || !clinic?.lng) return;
    setComputingTravel(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }),
      );
      const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
      const dest = `${clinic.lat},${clinic.lng}`;
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
      const fetchMode = (mode: string) =>
        fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&mode=${mode}&language=ja&key=${key}`,
        )
          .then((r) => r.json())
          .then(
            (j) =>
              j?.rows?.[0]?.elements?.[0]?.duration?.text as string | undefined,
          );
      const [walking, driving, transit] = await Promise.all([
        fetchMode('walking'),
        fetchMode('driving'),
        fetchMode('transit'),
      ]);
      setTravelInfo({ walking, driving, transit });
    } catch (e) {
      console.error(e);
      setError('現在地からの所要時間を計算できませんでした');
    } finally {
      setComputingTravel(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-slate-500">
        読み込み中…
      </div>
    );
  }
  if (error || !clinic) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center text-slate-600">
        <p>{error ?? '病院が見つかりませんでした'}</p>
        <Link href="/search" className="mt-4 text-orange-600 underline">
          検索に戻る
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-3 py-2.5">
        <Link href="/search" className="p-1.5 -ml-1" aria-label="戻る">
          <ArrowLeft size={20} className="text-slate-700" />
        </Link>
        <span className="flex-1 ml-1 font-semibold text-slate-900 truncate">
          {clinic.name}
        </span>
        <button
          onClick={toggleFavorite}
          className="p-2 -mr-1"
          aria-label={favored ? '保存を解除' : '保存する'}
        >
          <Heart
            size={22}
            className={favored ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}
          />
        </button>
      </header>

      {/* 地図 */}
      <div className="h-56">
        <MapView
          clinics={[clinic]}
          height="100%"
          markerColor="#FF6F00"
          initialCenter={
            clinic.lat && clinic.lng ? { lat: clinic.lat, lng: clinic.lng } : undefined
          }
          initialZoom={15}
        />
      </div>

      {/* 基本情報 */}
      <section className="px-5 py-4 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">{clinic.name}</h1>
        <div className="mt-1.5 flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {clinic.rating ?? '-'}
          </span>
          <span className="text-slate-500">({clinic.review_count} 件の評価)</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {clinic.is_24h && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              24時間営業
            </span>
          )}
          {clinic.open_sunday && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              日曜診療OK
            </span>
          )}
          {clinic.open_saturday && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              土曜診療OK
            </span>
          )}
        </div>
      </section>

      {/* 連絡先 */}
      <section className="px-5 py-4 border-b border-slate-100 space-y-3">
        {clinic.address && (
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm text-slate-700">{clinic.address}</div>
          </div>
        )}
        {(() => {
          const tel = safeTel(clinic.phone);
          return tel ? (
            <a href={tel} className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg active:bg-orange-50">
              <Phone size={18} className="text-orange-500 shrink-0" />
              <span className="text-sm text-orange-700 font-medium">{clinic.phone}</span>
            </a>
          ) : null;
        })()}
        {(() => {
          const url = safeHref(clinic.website);
          return url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg active:bg-orange-50"
            >
              <Globe size={18} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-700 truncate">{clinic.website}</span>
            </a>
          ) : null;
        })()}
        {(() => {
          const url = safeHref(clinic.google_maps_url);
          return url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg active:bg-orange-50"
            >
              <Navigation size={18} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-700">Google マップで開く</span>
            </a>
          ) : null;
        })()}
      </section>

      {/* 現在地から○分 */}
      <section className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <Navigation size={16} className="text-orange-500" />
          現在地からの所要時間
        </h3>
        {travelInfo ? (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <TravelCard label="徒歩" value={travelInfo.walking} emoji="🚶" />
            <TravelCard label="車" value={travelInfo.driving} emoji="🚗" />
            <TravelCard label="公共交通" value={travelInfo.transit} emoji="🚆" />
          </div>
        ) : (
          <button
            onClick={computeTravelTime}
            disabled={computingTravel}
            className="w-full py-2.5 rounded-xl border-2 border-orange-200 text-orange-700 text-sm font-medium disabled:opacity-50"
          >
            {computingTravel ? '計算中…' : '現在地から計算する'}
          </button>
        )}
      </section>

      {/* 営業時間 */}
      {clinic.business_hours_raw && (
        <section className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            営業時間
          </h3>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
            {clinic.business_hours_raw}
          </pre>
        </section>
      )}

      {/* 口コミ */}
      <section className="px-5 py-4 pb-8">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          口コミ ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">口コミはまだありません</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                  <span className="font-semibold">{r.author}</span>
                  <span>·</span>
                  <span>{r.posted_rel}</span>
                  <span className="ml-auto text-amber-600 font-bold">
                    ★{r.rating ?? '-'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {r.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function TravelCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string | undefined;
  emoji: string;
}) {
  return (
    <div className="bg-orange-50 rounded-xl p-3 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="text-[10px] text-slate-500 mt-1">{label}</div>
      <div className="text-sm font-bold text-orange-700 mt-0.5">{value ?? '-'}</div>
    </div>
  );
}
