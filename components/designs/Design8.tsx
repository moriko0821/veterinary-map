'use client';
import { Search, Clock, Cat, Dog, Bird, Shield, Car, Moon, Pill, Eye } from 'lucide-react';
import { useState } from 'react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';

const CHIPS = [
  { label: '24時間', icon: Clock, color: 'bg-red-100 text-red-700 border-red-200' },
  { label: '猫専門', icon: Cat, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: '犬OK', icon: Dog, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: '夜間', icon: Moon, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { label: '駐車場', icon: Car, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: '救急', icon: Shield, color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { label: '歯科', icon: Pill, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { label: '眼科', icon: Eye, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { label: '鳥OK', icon: Bird, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
];

export default function Design8({ clinics }: { clinics: Clinic[] }) {
  const [active, setActive] = useState<Set<string>>(new Set());

  const toggle = (l: string) => {
    const n = new Set(active);
    n.has(l) ? n.delete(l) : n.add(l);
    setActive(n);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white">
      {/* Top: search + chips */}
      <div className="absolute top-0 inset-x-0 z-10 bg-white shadow-sm">
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2">
            <Search size={16} className="text-violet-600" />
            <input placeholder="動物病院を検索" className="flex-1 bg-transparent outline-none text-sm" />
            <span className="text-xs text-violet-600 font-semibold">📍 北海道</span>
          </div>
        </div>
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CHIPS.map((chip) => {
            const isActive = active.has(chip.label);
            return (
              <button
                key={chip.label}
                onClick={() => toggle(chip.label)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                  isActive ? 'bg-violet-600 text-white border-violet-600' : chip.color
                }`}
              >
                <chip.icon size={13} />
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <MapView clinics={clinics} height="100dvh" markerColor="#7C4DFF" />

      <div className="absolute bottom-4 inset-x-3 z-10 bg-white rounded-2xl shadow-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">
            {active.size > 0 ? `${active.size}個のフィルター適用中` : `${clinics.length}件すべて表示中`}
          </span>
          <button className="text-xs text-violet-600 font-semibold">並び替え ▾</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {clinics.slice(0, 10).map((c) => (
            <div key={c.id} className="shrink-0 w-44 bg-violet-50 rounded-xl p-3">
              <div className="font-medium text-slate-900 text-sm truncate">{c.name}</div>
              <div className="text-xs text-slate-600 mt-1 flex gap-2">
                <span className="text-amber-500">★{c.rating ?? '-'}</span>
                <span>{c.review_count}件</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">{c.city}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
