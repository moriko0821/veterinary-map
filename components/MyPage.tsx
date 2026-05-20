'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, History, Settings, Info, Star } from 'lucide-react';
import { supabase, type Clinic } from '@/lib/supabase';

type Stub = { id: string; name: string; at: number };

function loadList(key: string): Stub[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

export default function MyPage() {
  const [favs, setFavs] = useState<Stub[]>([]);
  const [history, setHistory] = useState<Stub[]>([]);
  const [tab, setTab] = useState<'fav' | 'history' | 'settings'>('fav');

  useEffect(() => {
    setFavs(loadList('vet:favorites'));
    setHistory(loadList('vet:history').sort((a, b) => b.at - a.at).slice(0, 20));
  }, []);

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-slate-50">
      <header className="bg-linear-to-b from-orange-50 to-transparent px-5 pt-8 pb-4">
        <h1 className="text-xl font-bold text-slate-900">マイページ</h1>
        <p className="text-xs text-slate-600 mt-1">
          保存した動物病院、最近見た病院、設定
        </p>
      </header>

      {/* セクションタブ */}
      <div className="px-3 mb-1 flex gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'fav' as const, label: '保存', icon: Heart },
          { id: 'history' as const, label: '履歴', icon: History },
          { id: 'settings' as const, label: '設定', icon: Settings },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              tab === t.id
                ? 'bg-orange-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-3 mt-3">
        {tab === 'fav' && (
          <div>
            {favs.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="まだ保存した病院がありません"
                desc="病院の詳細ページから ♡ で保存できます"
              />
            ) : (
              <ul className="space-y-2">
                {favs.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/clinic/${s.id}`}
                      className="block bg-white rounded-xl p-3 border border-slate-200"
                    >
                      <div className="font-medium text-slate-900">{s.name}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div>
            {history.length === 0 ? (
              <EmptyState
                icon={History}
                title="まだ閲覧履歴がありません"
                desc="病院の詳細ページを開くと自動で記録されます"
              />
            ) : (
              <ul className="space-y-2">
                {history.map((s) => (
                  <li key={s.id + s.at}>
                    <Link
                      href={`/clinic/${s.id}`}
                      className="block bg-white rounded-xl p-3 border border-slate-200"
                    >
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(s.at).toLocaleString('ja-JP')}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            <Row icon={Star} label="アプリ評価をつける" right="準備中" />
            <Row icon={Info} label="このアプリについて" right="v0.1 MVP" />
            <Row icon={Info} label="プライバシーポリシー" right="準備中" />
            <Row icon={Info} label="利用規約" right="準備中" />
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-6 py-10 text-center">
      <Icon size={36} className="text-slate-300 mx-auto mb-3" />
      <div className="font-semibold text-slate-700">{title}</div>
      <div className="text-xs text-slate-500 mt-1">{desc}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  right,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  right: string;
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <Icon size={18} className="text-slate-500" />
      <span className="flex-1 text-sm text-slate-800">{label}</span>
      <span className="text-xs text-slate-400">{right}</span>
    </div>
  );
}
