'use client';
import { Search, MapPin, Filter, ChevronRight } from 'lucide-react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';

export default function Design6({ clinics }: { clinics: Clinic[] }) {
  return (
    <div className="flex flex-col h-dvh w-full bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-3 py-2.5 flex items-center gap-2 border-b border-slate-200">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
          <Search size={16} className="text-slate-500" />
          <input
            placeholder="検索"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <button className="p-2 rounded-lg bg-slate-100">
          <MapPin size={16} className="text-[#0288D1]" />
        </button>
        <button className="p-2 rounded-lg bg-[#0288D1] text-white">
          <Filter size={16} />
        </button>
      </header>

      {/* Map fixed 1/2 */}
      <div className="h-1/2 shrink-0">
        <MapView clinics={clinics} height="100%" markerColor="#0288D1" />
      </div>

      {/* List bottom 1/2 */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-slate-600">{clinics.length}件</span>
          <select className="text-xs bg-transparent text-[#455A64] font-medium">
            <option>距離順</option>
            <option>評価順</option>
            <option>口コミ数順</option>
          </select>
        </div>
        {clinics.slice(0, 30).map((c) => (
          <div
            key={c.id}
            className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 text-sm truncate">{c.name}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                <span className="text-amber-500">★{c.rating ?? '-'}</span>
                <span>{c.review_count}件</span>
                <span className="truncate">{c.city || c.prefecture}</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
