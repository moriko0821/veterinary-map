'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Map, User } from 'lucide-react';

const TABS = [
  { href: '/search', label: '検索', icon: Search },
  { href: '/map', label: 'マップ', icon: Map },
  { href: '/my', label: 'マイページ', icon: User },
];

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 grid grid-cols-3"
      // 下部タブの高さは pb-safe を考慮（iOS のホームバー回避）
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((t) => {
        // /search や /search?q=... を「検索」タブのアクティブ扱いに
        const isActive = pathname === t.href || pathname.startsWith(t.href + '/');
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              isActive ? 'text-orange-600' : 'text-slate-500'
            }`}
          >
            <t.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
