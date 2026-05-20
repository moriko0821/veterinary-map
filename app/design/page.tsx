import Link from 'next/link';
import { notFound } from 'next/navigation';

const designs = [
  { id: 1, name: 'クラシック・マップ', tag: 'Google Maps風', palette: ['#FFFFFF', '#1976D2', '#212121'], desc: '白×青のシンプル。学習コストゼロ、誰でも使える' },
  { id: 2, name: 'もふもふパステル', tag: 'やさしい動物系', palette: ['#FFF5F0', '#F8BBD0', '#A1887F'], desc: 'ピンク・クリーム・ベージュ。ペット愛と温かみ' },
  { id: 3, name: 'ホスピタル・トラスト', tag: '医療系信頼感', palette: ['#FFFFFF', '#00897B', '#1A237E'], desc: '白×緑×紺。清潔感・信頼性' },
  { id: 4, name: 'アクション中心', tag: 'FAB スタイル', palette: ['#212121', '#00E5FF', '#FFEA00'], desc: 'ダーク地図 + 蛍光FAB。直感的操作' },
  { id: 5, name: '検索ファースト', tag: 'Yelp/食べログ風', palette: ['#FFFFFF', '#FF6F00', '#212121'], desc: '白×オレンジ。検索意図ユーザーに最適' },
  { id: 6, name: 'スプリットビュー', tag: '同時表示', palette: ['#FFFFFF', '#455A64', '#0288D1'], desc: '地図とリストを同時表示。情報密度高' },
  { id: 7, name: 'タブナビ', tag: 'ネイティブアプリ風', palette: ['#FAFAFA', '#26A69A', '#37474F'], desc: '下部タブ。機能の分離が明確' },
  { id: 8, name: 'チップフィルター', tag: '即操作型', palette: ['#FFFFFF', '#7C4DFF', '#FF4081'], desc: '横スクロールchipで即フィルター' },
  { id: 9, name: 'ストーリーカード', tag: '発見系', palette: ['#FFF8E1', '#EF6C00', '#5D4037'], desc: 'キュレーションカード。Instagram風' },
  { id: 10, name: 'ミニマル・モノクロ', tag: '洗練系', palette: ['#FFFFFF', '#212121', '#E53935'], desc: '白黒+差し色。Apple Maps風' },
];

export default function DesignIndex() {
  // 本番では非公開 (開発時のデザイン検討用)
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">デザイン候補 10 案</h1>
        <p className="text-sm text-slate-600 mt-1">
          スマホでの表示を想定。タップで各デモを確認。
        </p>
        <p className="text-xs text-slate-500 mt-2">
          💡 ヒント: DevTools (F12) でデバイスツールバー → iPhone モード等にすると本来の見た目になります
        </p>
      </header>

      <ul className="grid gap-3">
        {designs.map((d) => (
          <li key={d.id}>
            <Link
              href={`/design/${d.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-lg">
                  {d.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="font-semibold text-slate-900">{d.name}</h2>
                    <span className="text-xs text-slate-500">{d.tag}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5 truncate">{d.desc}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {d.palette.map((c) => (
                    <span
                      key={c}
                      className="w-4 h-4 rounded-full border border-slate-200"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-400 text-center mt-8">
        各案を一通り見て、気に入った番号を教えてください
      </p>
    </main>
  );
}
