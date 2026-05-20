'use client';
import { Map as MapIcon, List, Heart, User, Search } from 'lucide-react';
import { useState } from 'react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';

export default function Design7({ clinics }: { clinics: Clinic[] }) {
  const [tab, setTab] = useState<'map' | 'list' | 'fav' | 'me'>('map');

  return (
    <div className="flex flex-col h-dvh w-full bg-slate-50">
      <header className="bg-white px-4 py-3 border-b border-slate-200">
        <h1 className="font-bold text-[#37474F]">全国動物病院マップ</h1>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {tab === 'map' && (
          <MapView clinics={clinics} height="100%" markerColor="#26A69A" />
        )}
        {tab === 'list' && (
          <div className="h-full overflow-y-auto bg-white">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-3">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                <Search size={16} className="text-slate-500" />
                <input placeholder="検索" className="flex-1 bg-transparent outline-none text-sm" />
              </div>
            </div>
            {clinics.slice(0, 30).map((c) => (
              <div key={c.id} className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#26A69A]/10 text-[#26A69A] flex items-center justify-center font-bold">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ★{c.rating ?? '-'} · {c.review_count}件 · {c.city || c.prefecture}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'fav' && (
          <div className="h-full flex items-center justify-center text-slate-500 px-8 text-center">
            <div>
              <Heart size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm">お気に入りした病院がここに表示されます</p>
            </div>
          </div>
        )}
        {tab === 'me' && (
          <div className="h-full bg-white p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#26A69A]/10 mx-auto flex items-center justify-center text-3xl">
                🐶
              </div>
              <h2 className="font-bold mt-3 text-[#37474F]">ゲスト</h2>
            </div>
            <div className="space-y-1">
              {['登録した動物', '検索履歴', '通知設定', '利用規約', 'プライバシー'].map((t) => (
                <button key={t} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg text-sm text-slate-700">
                  {t} →
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <nav className="bg-white border-t border-slate-200 grid grid-cols-4">
        {[
          { id: 'map' as const, icon: MapIcon, label: 'マップ' },
          { id: 'list' as const, icon: List, label: 'リスト' },
          { id: 'fav' as const, icon: Heart, label: 'お気に入り' },
          { id: 'me' as const, icon: User, label: '自分' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center py-2.5 gap-1 transition ${
              tab === t.id ? 'text-[#26A69A]' : 'text-slate-400'
            }`}
          >
            <t.icon size={20} />
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
