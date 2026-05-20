'use client';
import { Menu, Phone, Globe } from 'lucide-react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';

const CHIPS = ['24時間営業', '夜間救急', '土曜診療', '日曜診療', '駐車場', '猫専門', '犬専門', '歯科', '眼科'];

export default function Design3({ clinics }: { clinics: Clinic[] }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white">
      <header className="absolute top-0 inset-x-0 z-10 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-bold text-[#1A237E] text-base">全国動物病院検索</h1>
          <Menu className="text-[#00897B]" size={22} />
        </div>
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              className="shrink-0 px-3 py-1.5 text-xs rounded border border-[#00897B]/30 text-[#00897B] bg-white hover:bg-[#00897B]/5 whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      </header>

      <MapView clinics={clinics} height="100dvh" mapStyle="minimal" markerColor="#00897B" />

      <div className="absolute inset-x-0 bottom-0 z-10 bg-white border-t border-slate-200 h-[36vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 py-2 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-[#1A237E]">
            検索結果 ({clinics.length}件)
          </h2>
        </div>
        <ul>
          {clinics.slice(0, 30).map((c) => (
            <li key={c.id} className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-[#00897B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ▪
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 text-sm">{c.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    評価 {c.rating ?? '-'} / 5 ({c.review_count}件)
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {c.is_24h && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">24h</span>}
                    {c.open_sunday && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">日曜OK</span>}
                    {c.phone && <Phone size={11} className="text-slate-400" />}
                    {c.website && <Globe size={11} className="text-slate-400" />}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
