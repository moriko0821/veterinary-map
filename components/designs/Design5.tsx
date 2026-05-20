'use client';
import { Search, MapPin, Clock, Star } from 'lucide-react';
import { useState } from 'react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';

export default function Design5({ clinics }: { clinics: Clinic[] }) {
  const [showResults, setShowResults] = useState(false);

  if (!showResults) {
    return (
      <div className="min-h-dvh w-full bg-linear-to-b from-orange-50 to-white px-6 pt-12 pb-6 flex flex-col">
        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl font-bold text-slate-900">
            どんな動物病院を<br />お探しですか？
          </h1>
          <p className="text-sm text-slate-600 mt-2">全国10,830件から検索</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-6">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Search size={20} className="text-orange-500" />
            <input
              placeholder="地域・病院名・特徴"
              className="flex-1 outline-none text-sm"
              onFocus={() => setShowResults(true)}
            />
          </div>
        </div>
        <button
          onClick={() => setShowResults(true)}
          className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 mb-3 flex items-center justify-center gap-2"
        >
          <MapPin size={18} />
          現在地から探す
        </button>
        <button
          onClick={() => setShowResults(true)}
          className="w-full py-3 rounded-2xl border-2 border-orange-200 text-orange-700 font-medium mb-3 flex items-center justify-center gap-2"
        >
          <Clock size={18} />
          今すぐ営業中
        </button>
        <button
          onClick={() => setShowResults(true)}
          className="w-full py-3 rounded-2xl border-2 border-orange-200 text-orange-700 font-medium flex items-center justify-center gap-2"
        >
          <Star size={18} className="fill-amber-400 text-amber-400" />
          評価4以上
        </button>
        <div className="mt-auto pt-8 text-center">
          <div className="text-xs text-slate-500 mb-2">人気の検索</div>
          <div className="flex gap-2 flex-wrap justify-center">
            {['#猫専門', '#夜間', '#歯科', '#救急', '#エキゾチック'].map((t) => (
              <button
                key={t}
                onClick={() => setShowResults(true)}
                className="text-xs px-3 py-1.5 rounded-full bg-orange-100 text-orange-700"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white">
      <div className="absolute top-0 inset-x-0 z-10 bg-white shadow-sm p-3 flex items-center gap-2">
        <button onClick={() => setShowResults(false)} className="text-slate-600 px-2">←</button>
        <div className="flex-1 flex items-center gap-2 bg-orange-50 rounded-full px-3 py-2">
          <Search size={16} className="text-orange-500" />
          <input className="flex-1 bg-transparent outline-none text-sm" defaultValue="動物病院" />
        </div>
      </div>
      <MapView clinics={clinics} height="50vh" markerColor="#FF6F00" />
      <div className="absolute bottom-0 inset-x-0 z-10 h-[50vh] bg-white overflow-y-auto pt-3">
        <div className="px-4 pb-3 text-xs text-slate-500">
          {clinics.length}件ヒット
        </div>
        {clinics.slice(0, 30).map((c) => (
          <div key={c.id} className="px-4 py-3 border-b border-slate-100 flex gap-3">
            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">
              🏥
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate">{c.name}</div>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                <span className="text-amber-500">★ {c.rating ?? '-'}</span>
                <span>({c.review_count})</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{c.address}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
