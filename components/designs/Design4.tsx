'use client';
import { Heart, Filter, Navigation, Search } from 'lucide-react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';
import { useState } from 'react';

export default function Design4({ clinics }: { clinics: Clinic[] }) {
  const [selected, setSelected] = useState<Clinic | null>(null);
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      <MapView
        clinics={clinics}
        height="100dvh"
        mapStyle="dark"
        markerColor="#00E5FF"
        onSelect={setSelected}
      />

      {/* Floating action buttons (right side, stacked) */}
      <div className="absolute right-4 bottom-32 z-10 flex flex-col gap-3">
        <button className="w-14 h-14 rounded-full bg-slate-800/90 backdrop-blur shadow-lg flex items-center justify-center text-white border border-cyan-400/30 hover:border-cyan-400 transition">
          <Heart size={22} className="text-pink-400" />
        </button>
        <button className="w-14 h-14 rounded-full bg-slate-800/90 backdrop-blur shadow-lg flex items-center justify-center text-white border border-cyan-400/30 hover:border-cyan-400 transition">
          <Filter size={22} className="text-yellow-300" />
        </button>
        <button className="w-14 h-14 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 flex items-center justify-center text-slate-900">
          <Navigation size={22} fill="currentColor" />
        </button>
      </div>

      {/* Top search overlay */}
      <div className="absolute top-4 inset-x-4 z-10">
        <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur rounded-full px-4 py-3 border border-cyan-400/30">
          <Search size={18} className="text-cyan-400" />
          <input
            placeholder="病院を検索…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
          />
          <span className="text-xs text-cyan-400 font-mono">{clinics.length}件</span>
        </div>
      </div>

      {/* Selected clinic card */}
      {selected && (
        <div className="absolute bottom-4 inset-x-4 z-10 bg-slate-800/95 backdrop-blur rounded-2xl p-4 border border-cyan-400/50 shadow-2xl text-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-cyan-300">{selected.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{selected.city}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-500 text-xl">×</button>
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-amber-400">★ {selected.rating ?? '-'}</span>
            <span className="text-slate-400">{selected.review_count}件</span>
          </div>
        </div>
      )}

      {!selected && (
        <div className="absolute bottom-4 inset-x-4 z-10 text-center text-slate-400 text-xs">
          地図上のマーカーをタップ
        </div>
      )}
    </div>
  );
}
