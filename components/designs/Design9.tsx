'use client';
import { Search, MapPin, Flame, TrendingUp, Star } from 'lucide-react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';
import { useState } from 'react';

export default function Design9({ clinics }: { clinics: Clinic[] }) {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return (
      <div className="relative h-dvh w-full overflow-hidden">
        <button
          onClick={() => setShowMap(false)}
          className="absolute top-3 left-3 z-10 px-3 py-2 rounded-full bg-white shadow-lg text-sm font-medium text-[#5D4037]"
        >
          ← 戻る
        </button>
        <MapView clinics={clinics} height="100dvh" markerColor="#EF6C00" />
      </div>
    );
  }

  const sections = [
    { title: 'あなたの近くで人気', icon: TrendingUp, color: 'text-orange-600', data: clinics.slice(0, 6) },
    { title: '🔥 24時間営業', icon: Flame, color: 'text-red-600', data: clinics.filter((c) => c.is_24h).slice(0, 6).concat(clinics.slice(0, 6)).slice(0, 6) },
    { title: '⭐ 評価が高い', icon: Star, color: 'text-amber-600', data: [...clinics].sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6) },
  ];

  return (
    <div className="min-h-dvh w-full bg-amber-50">
      <header className="px-4 pt-4 pb-3 bg-linear-to-bfrom-orange-100 to-amber-50 sticky top-0 z-10">
        <h1 className="font-bold text-[#5D4037] text-xl mb-2">おすすめの動物病院</h1>
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-md">
          <Search size={18} className="text-orange-500" />
          <input placeholder="病院を検索" className="flex-1 outline-none text-sm" />
        </div>
      </header>

      {sections.map((sec, i) => (
        <section key={i} className="mt-5">
          <div className="px-4 mb-3 flex items-center gap-2">
            <sec.icon size={18} className={sec.color} />
            <h2 className="font-bold text-[#5D4037]">{sec.title}</h2>
          </div>
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto no-scrollbar">
            {sec.data.map((c) => (
              <div key={c.id + i} className="shrink-0 w-44 bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="h-24 bg-linear-to-br from-orange-200 to-amber-200 flex items-center justify-center text-4xl">
                  🏥
                </div>
                <div className="p-3">
                  <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <span className="text-amber-500 font-bold">★{c.rating ?? '-'}</span>
                    <span>·</span>
                    <span>{c.review_count}件</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{c.city}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="px-4 py-6">
        <button
          onClick={() => setShowMap(true)}
          className="w-full py-3.5 rounded-2xl bg-[#EF6C00] text-white font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <MapPin size={18} />
          地図で全部見る
        </button>
      </div>
    </div>
  );
}
