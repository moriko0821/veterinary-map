'use client';
import { Search, MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';

export default function Design1({ clinics }: { clinics: Clinic[] }) {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white">
      {/* Sticky search bar */}
      <div className="absolute top-0 inset-x-0 z-10 p-3">
        <div className="flex items-center gap-2 bg-white shadow-lg rounded-full px-4 py-2.5">
          <Search size={18} className="text-blue-600" />
          <input
            placeholder="動物病院を検索"
            className="flex-1 outline-none text-sm placeholder:text-slate-400"
          />
          <button className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <MapPin size={16} />
          </button>
        </div>
      </div>

      {/* Map */}
      <MapView clinics={clinics} height="100dvh" markerColor="#1976D2" />

      {/* Bottom sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-white rounded-t-2xl shadow-2xl transition-all ${
          sheetExpanded ? 'h-[60vh]' : 'h-[28vh]'
        }`}
      >
        <button
          onClick={() => setSheetExpanded(!sheetExpanded)}
          className="w-full py-2 flex justify-center"
        >
          <span className="w-10 h-1 rounded-full bg-slate-300" />
        </button>
        <div className="px-4 pb-4 overflow-y-auto h-[calc(100%-2rem)]">
          <h2 className="font-semibold text-slate-900 mb-3">
            近くの動物病院 ({clinics.length})
          </h2>
          <ul className="space-y-3">
            {clinics.slice(0, sheetExpanded ? 50 : 5).map((c) => (
              <li key={c.id} className="flex gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  🏥
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{c.name}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {c.rating ?? '-'}
                    </span>
                    <span>·</span>
                    <span>{c.review_count}件</span>
                    <span>·</span>
                    <span className="truncate">{c.city || c.prefecture}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
