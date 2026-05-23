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
  // ページ全体に関わる致命的なエラー (病院データが取れなかった等)
  const [error, setError] = useState<string | null>(null);
  // Distance Matrix のような部分的な機能エラー (ページ全体は表示しつつ局所表示)
  const [travelError, setTravelError] = useState<string | null>(null);
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
    setTravelError(null);
    try {
      // 1) 現在地を取得
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }),
      );

      // 2) Google Maps JS SDK が読み込まれているか確認
      if (typeof google === 'undefined' || !google.maps?.importLibrary) {
        throw new Error('Maps SDK not loaded');
      }

      // 3) 新しい Routes ライブラリを動的読み込み (旧 DistanceMatrix の置き換え)
      //    Google が 2026-02-25 に DistanceMatrix を非推奨化、12ヶ月後削除予定。
      //    RouteMatrix: 多OD向け / Route.computeRoutes: 単一区間で乗換案内が強い
      //    eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routesLib = (await google.maps.importLibrary('routes')) as any;
      const RouteMatrix = routesLib?.RouteMatrix;
      const Route = routesLib?.Route;
      if (!RouteMatrix?.computeRouteMatrix) {
        throw new Error('Routes API not available');
      }

      const isDev = process.env.NODE_ENV === 'development';
      const dlog = (...args: unknown[]) => { if (isDev) console.log(...args); };

      // 4) 経路ごとに RouteMatrix を呼ぶ
      //    JS SDK は google.maps.LatLng インスタンスを期待 (REST形式 {latitude} ではない)
      const originLatLng = new google.maps.LatLng(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      const destLatLng = new google.maps.LatLng(clinic.lat!, clinic.lng!);

      const callMode = async (travelMode: 'WALKING' | 'DRIVING' | 'TRANSIT'): Promise<string | undefined> => {
        try {
          // ComputeRouteMatrixRequest:
          //   - origins/destinations: LatLng を配列に直接 (Waypoint ラップ不要)
          //   - travelMode: WALKING/DRIVING/TRANSIT (旧 TravelMode enum と同じ)
          //   - fields: 必須。JS SDKでの正式名は 'durationMillis'
          //   - TRANSIT 時のみ departureTime + transitPreference を追加で成功率向上
          // 戻り値: Promise<{matrix: RouteMatrix}>
          //   matrix.rows[origin_idx].items[destination_idx] が RouteMatrixItem
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const request: any = {
            origins: [originLatLng],
            destinations: [destLatLng],
            travelMode,
            fields: ['condition', 'durationMillis'],
            language: 'ja',
            region: 'JP',
          };
          if (travelMode === 'TRANSIT') {
            request.departureTime = new Date();
            // transitPreference は意図的に外す: LESS_WALKING 等の制約が
            // ROUTE_NOT_FOUND を増やすため、デフォルト (全モード許可) で広く探す
          }

          dlog(`[RouteMatrix][${travelMode}] REQUEST origin=${pos.coords.latitude},${pos.coords.longitude} dest=${clinic.lat},${clinic.lng}`);
          const response = await RouteMatrix.computeRouteMatrix(request);
          const { matrix } = response ?? {};
          const item = matrix?.rows?.[0]?.items?.[0];
          dlog(`[RouteMatrix][${travelMode}] item.condition=${item?.condition} durationMillis=${item?.durationMillis}`);

          if (item?.condition === 'ROUTE_EXISTS') {
            const ms = item.durationMillis;
            if (typeof ms === 'number' && !isNaN(ms)) {
              return formatDuration(Math.round(ms / 1000));
            }
          }

          // TRANSIT で ROUTE_NOT_FOUND の場合、computeRoutes (単一区間API) でフォールバック
          // Matrix は多OD向けで TRANSIT のカバレッジが薄いため、単区間APIの方が成功率が高い
          if (travelMode === 'TRANSIT' && Route?.computeRoutes) {
            dlog(`[Route fallback] trying computeRoutes for TRANSIT`);
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const routesReq: any = {
                origin: originLatLng,
                destination: destLatLng,
                travelMode: 'TRANSIT',
                departureTime: new Date(),
                fields: ['durationMillis'],
                language: 'ja',
                region: 'JP',
                computeAlternativeRoutes: false,
              };
              const routesRes = await Route.computeRoutes(routesReq);
              const route = routesRes?.routes?.[0];
              dlog(`[Route fallback] result durationMillis=${route?.durationMillis}`);
              const ms2 = route?.durationMillis;
              if (typeof ms2 === 'number' && !isNaN(ms2)) {
                return formatDuration(Math.round(ms2 / 1000));
              }
            } catch (fallbackErr) {
              dlog(`[Route fallback] failed:`, fallbackErr);
            }
          }
          return undefined;
        } catch (e) {
          console.error(`[RouteMatrix] mode=${travelMode} EXCEPTION:`, e);
          return undefined;
        }
      };

      const [walking, driving, transit] = await Promise.all([
        callMode('WALKING'),
        callMode('DRIVING'),
        callMode('TRANSIT'),
      ]);

      // 1つでも値が取れていれば成功表示 (公共交通だけ「なし」は許容)
      if (walking || driving || transit) {
        setTravelInfo({ walking, driving, transit });
        return;
      }
      // 全部空 = 通信失敗 or 設定問題の可能性大。コンソールに詳細あり
      setTravelError(
        '所要時間を取得できませんでした。しばらく経ってから再度お試しください。',
      );
    } catch (e) {
      console.error('[ClinicDetail] travel time error:', e);
      const msg = (e as Error)?.message ?? '';
      if (msg.includes('Maps SDK not loaded')) {
        setTravelError('地図の読み込みが完了していません。少し待ってから再度お試しください。');
      } else if (msg.includes('Routes API not available')) {
        setTravelError('Routes API が利用できません。GCP で Routes API を有効化してください。');
      } else if (msg.toLowerCase().includes('denied') || (e as GeolocationPositionError)?.code === 1) {
        setTravelError('位置情報の許可が必要です。ブラウザの設定から位置情報を許可してください。');
      } else if ((e as GeolocationPositionError)?.code === 3) {
        setTravelError('位置情報の取得がタイムアウトしました。屋外で再度お試しください。');
      } else {
        setTravelError('所要時間を計算できませんでした。位置情報の許可を確認してください。');
      }
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
          <>
            <button
              onClick={computeTravelTime}
              disabled={computingTravel}
              className="w-full py-2.5 rounded-xl border-2 border-orange-200 text-orange-700 text-sm font-medium disabled:opacity-50"
            >
              {computingTravel ? '計算中…' : '現在地から計算する'}
            </button>
            {travelError && (
              <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {travelError}
              </div>
            )}
          </>
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return '1分未満';
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}分`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `${hours}時間` : `${hours}時間${mins}分`;
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
  const isAvailable = !!value;
  return (
    <div className={`rounded-xl p-3 text-center ${isAvailable ? 'bg-orange-50' : 'bg-slate-100'}`}>
      <div className={`text-2xl ${isAvailable ? '' : 'opacity-40 grayscale'}`}>{emoji}</div>
      <div className="text-[10px] text-slate-500 mt-1">{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${isAvailable ? 'text-orange-700' : 'text-slate-400'}`}>
        {value ?? 'なし'}
      </div>
    </div>
  );
}
