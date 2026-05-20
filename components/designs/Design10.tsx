'use client';
import { useState } from 'react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';

export default function Design10({ clinics }: { clinics: Clinic[] }) {
  const [selected, setSelected] = useState<Clinic | null>(null);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white">
      <header className="absolute top-0 inset-x-0 z-10 bg-white border-b border-slate-200 py-3 px-5">
        <div className="flex items-center justify-between">
          <h1 className="font-light text-2xl tracking-tight text-slate-900">
            動物病院<span className="text-red-500">.</span>
          </h1>
          <button className="text-xs uppercase tracking-widest text-slate-500">Menu</button>
        </div>
        <div className="mt-3 border-b border-slate-300 pb-2">
          <input
            placeholder="検索..."
            className="w-full bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
        </div>
      </header>

      <MapView
        clinics={clinics}
        height="100dvh"
        mapStyle="minimal"
        markerColor="#E53935"
        onSelect={setSelected}
      />

      {/* Bottom info bar */}
      <div className="absolute bottom-0 inset-x-0 z-10 bg-white border-t border-slate-200">
        {selected ? (
          <div className="px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-medium text-slate-900 truncate">{selected.name}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-xs uppercase tracking-widest text-slate-500"
              >
                Close
              </button>
            </div>
            <div className="mt-2 flex items-baseline gap-4 text-sm">
              <span className="font-light text-slate-900">{selected.rating ?? '-'}</span>
              <span className="text-xs uppercase tracking-widest text-slate-500">
                · {selected.review_count} reviews
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 truncate">{selected.address}</div>
            <button className="mt-3 text-xs uppercase tracking-widest text-red-500 font-medium">
              詳しく ▸
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">表示中</div>
              <div className="font-light text-2xl text-slate-900 mt-0.5">
                {clinics.length} <span className="text-xs uppercase tracking-widest text-slate-500 ml-1">clinics</span>
              </div>
            </div>
            <button className="border border-slate-900 text-slate-900 px-4 py-2 text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition">
              List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
