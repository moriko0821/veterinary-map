'use client';

import { Search, MapPin, Star, Moon, Calendar, ChevronDown, X, MessageSquare } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { sanitizeSearchInput, splitKeywords } from '@/lib/sanitize';

// ---------- フィルター項目定義 ----------
type ToggleKey = 'nearby' | 'min_rating_4' | 'is_24h' | 'open_saturday' | 'open_sunday';

const BASIC_TOGGLES: { key: ToggleKey; label: string; icon: typeof Star; desc: string }[] = [
  { key: 'nearby', icon: MapPin, label: '現在地から探す', desc: '半径10km内' },
  { key: 'min_rating_4', icon: Star, label: '評価 ★4以上', desc: '信頼度高め' },
  { key: 'is_24h', icon: Moon, label: '夜間対応', desc: '夜間・深夜に診療あり' },
  { key: 'open_saturday', icon: Calendar, label: '土曜診療', desc: '土曜営業' },
  { key: 'open_sunday', icon: Calendar, label: '日曜診療', desc: '日曜営業' },
];

// 「人気のキーワード」: タップで口コミ検索欄に追加される
// 飼い主が実際によく検索しそうな普遍的なキーワードに絞る
const POPULAR_KEYWORDS = [
  '猫専門', '歯科', '眼科', '皮膚科', '整形外科',
  '腫瘍', '救急', '駐車場', '夜間', '優しい', '丁寧',
];

export default function SearchLanding() {
  const router = useRouter();
  const params = useSearchParams();

  // URL 初期化（編集モードで戻ってきたとき用）
  const [q, setQ] = useState(params.get('q') ?? '');
  const [reviewQ, setReviewQ] = useState(params.get('review_q') ?? '');
  const [toggles, setToggles] = useState<Set<ToggleKey>>(() => {
    const s = new Set<ToggleKey>();
    if (params.get('nearby') === '1') s.add('nearby');
    if (params.get('min_rating') === '4') s.add('min_rating_4');
    if (params.get('is_24h') === '1') s.add('is_24h');
    if (params.get('open_saturday') === '1') s.add('open_saturday');
    if (params.get('open_sunday') === '1') s.add('open_sunday');
    return s;
  });

  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  // 入力済みの口コミキーワード（空白区切り、サニタイズ + 重複除去 + 最大10件）
  const reviewKeywords = useMemo(() => splitKeywords(reviewQ), [reviewQ]);

  // 選択条件をクエリパラメータに変換
  const buildParams = useMemo(() => {
    return () => {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set('q', q.trim());
      if (reviewQ.trim()) sp.set('review_q', reviewQ.trim());
      if (toggles.has('nearby')) sp.set('nearby', '1');
      if (toggles.has('min_rating_4')) sp.set('min_rating', '4');
      if (toggles.has('is_24h')) sp.set('is_24h', '1');
      if (toggles.has('open_saturday')) sp.set('open_saturday', '1');
      if (toggles.has('open_sunday')) sp.set('open_sunday', '1');
      return sp;
    };
  }, [q, reviewQ, toggles]);

  // 件数プレビュー (debounced)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setCounting(true);
      let query = supabase
        .from('clinics')
        .select('id', { count: 'exact', head: true })
        .not('lat', 'is', null);

      const safeQ = sanitizeSearchInput(q);
      if (safeQ) {
        query = query.or(
          `name.ilike.%${safeQ}%,address.ilike.%${safeQ}%,city.ilike.%${safeQ}%,prefecture.ilike.%${safeQ}%`,
        );
      }
      if (toggles.has('min_rating_4')) query = query.gte('rating', 4);
      if (toggles.has('is_24h')) query = query.eq('is_24h', true);
      if (toggles.has('open_saturday')) query = query.eq('open_saturday', true);
      if (toggles.has('open_sunday')) query = query.eq('open_sunday', true);
      // 口コミキーワード: 各キーワードが reviews_text or name に含まれる病院 (AND)
      // reviewKeywords は既にサニタイズ済み
      reviewKeywords.forEach((kw) => {
        query = query.or(`name.ilike.%${kw}%,reviews_text.ilike.%${kw}%`);
      });

      const { count: c } = await query;
      if (!cancelled) {
        setCount(c ?? 0);
        setCounting(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, reviewKeywords, toggles]);

  const toggleBasic = (k: ToggleKey) => {
    const n = new Set(toggles);
    n.has(k) ? n.delete(k) : n.add(k);
    setToggles(n);
  };

  const addKeyword = (kw: string) => {
    const existing = new Set(reviewKeywords);
    if (existing.has(kw)) {
      // 既にあれば削除
      const remaining = reviewKeywords.filter((k) => k !== kw);
      setReviewQ(remaining.join(' '));
    } else {
      setReviewQ(reviewQ ? `${reviewQ.trim()} ${kw}` : kw);
    }
  };

  const reset = () => {
    setQ('');
    setReviewQ('');
    setToggles(new Set());
  };

  const submit = () => {
    const sp = buildParams();
    router.push(`/search/results?${sp.toString()}`);
  };

  const activeCount =
    toggles.size + reviewKeywords.length + (q.trim() ? 1 : 0);

  return (
    <main className="min-h-[calc(100dvh-4rem)] w-full bg-linear-to-b from-orange-50 to-white pb-32">
      {/* ヘッダー */}
      <header className="px-6 pt-10 pb-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          どんな動物病院を<br />お探しですか？
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          全国 <span className="font-bold text-orange-600">10,830 件</span> の動物病院から検索
        </p>
      </header>

      {/* 地域・施設名検索 */}
      <div className="px-6">
        <div className="bg-white rounded-2xl shadow-md mb-6 flex items-center gap-2 px-4 py-3">
          <Search size={20} className="text-orange-500 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="地域・病院名で検索（例: 渋谷区）"
            className="flex-1 outline-none text-sm bg-transparent"
            autoComplete="off"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-slate-400 -mr-1 p-1">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 基本条件 (シングルトグル) */}
      <section className="px-6 mb-6">
        <SectionHeader title="場所・基本条件" />
        <div className="space-y-2 mt-3">
          {BASIC_TOGGLES.map((b) => {
            const active = toggles.has(b.key);
            return (
              <button
                key={b.key}
                onClick={() => toggleBasic(b.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition active:scale-[0.99] ${
                  active
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/30'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <b.icon
                  size={18}
                  className={active ? 'text-white' : 'text-orange-500'}
                  fill={active && b.icon === Star ? 'currentColor' : 'none'}
                />
                <div className="flex-1 text-left">
                  <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>
                    {b.label}
                  </div>
                  <div className={`text-[11px] ${active ? 'text-orange-100' : 'text-slate-500'}`}>
                    {b.desc}
                  </div>
                </div>
                {active && (
                  <div className="w-6 h-6 rounded-full bg-white text-orange-500 flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 口コミから検索 (自由入力) */}
      <section className="px-6 mb-6">
        <SectionHeader title="口コミから検索" sub="自由に入力できます" icon={MessageSquare} />
        <div className="mt-3 bg-white rounded-2xl shadow-sm border border-orange-200">
          <div className="flex items-start gap-2 px-4 py-3">
            <MessageSquare size={18} className="text-orange-500 mt-0.5 shrink-0" />
            <textarea
              value={reviewQ}
              onChange={(e) => setReviewQ(e.target.value)}
              placeholder="例: 猫専門 夜間 駐車場(空白区切りで複数指定可)"
              rows={2}
              className="flex-1 outline-none text-sm bg-transparent resize-none placeholder:text-slate-400"
            />
            {reviewQ && (
              <button
                onClick={() => setReviewQ('')}
                className="text-slate-400 -mr-1 p-1 shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {reviewKeywords.length > 0 && (
            <div className="px-4 pb-3 pt-1 flex gap-1.5 flex-wrap border-t border-orange-100">
              {reviewKeywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium"
                >
                  {k}
                  <button onClick={() => addKeyword(k)} className="hover:text-orange-900">
                    <X size={11} />
                  </button>
                </span>
              ))}
              <span className="text-[10px] text-slate-500 self-center">
                すべて含む病院を検索
              </span>
            </div>
          )}
        </div>

        {/* 人気のキーワード chip */}
        <div className="mt-4">
          <div className="text-[11px] text-slate-500 mb-2 px-1">人気のキーワード（タップで追加）</div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_KEYWORDS.map((t) => {
              const active = reviewKeywords.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => addKeyword(t)}
                  className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition active:scale-95 ${
                    active
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white text-orange-700 border border-orange-200'
                  }`}
                >
                  #{t}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* リセット */}
      {activeCount > 0 && (
        <div className="px-6 mb-32">
          <button
            onClick={reset}
            className="w-full py-2 text-sm text-slate-500 active:text-slate-700"
          >
            条件をすべてクリア
          </button>
        </div>
      )}

      {/* フローティング検索ボタン */}
      <div
        className="fixed inset-x-0 z-20 px-4 pb-3 pointer-events-none"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={submit}
          className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold shadow-2xl shadow-orange-500/40 flex items-center justify-center gap-2 pointer-events-auto active:scale-[0.98] transition disabled:opacity-50"
        >
          <Search size={18} />
          <span>この条件で検索</span>
          {count !== null && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
              {counting ? '…' : `${count.toLocaleString()}件`}
            </span>
          )}
        </button>
      </div>
    </main>
  );
}

function SectionHeader({
  title,
  sub,
  icon: Icon = ChevronDown,
}: {
  title: string;
  sub?: string;
  icon?: typeof ChevronDown;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon size={16} className="text-orange-500" />
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {sub && <span className="text-[11px] text-slate-500">{sub}</span>}
    </div>
  );
}
