import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'プライバシーポリシー｜全国動物病院マップ',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-white">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-3 py-2.5">
        <Link href="/my" className="p-1.5 -ml-1" aria-label="戻る">
          <ArrowLeft size={20} className="text-slate-700" />
        </Link>
        <h1 className="flex-1 ml-1 font-semibold text-slate-900">プライバシーポリシー</h1>
      </header>

      <article className="px-5 py-6 max-w-2xl mx-auto text-slate-800 leading-relaxed text-sm">
        <p className="text-slate-600 mb-6">
          本プライバシーポリシー（以下「本ポリシー」）は、「全国動物病院マップ」（以下「本サービス」）が、利用者の情報をどのように取り扱うかを定めるものです。本サービスを利用される方は、本ポリシーに同意したものとみなします。
        </p>

        <H2>第1条 取得する情報</H2>
        <p>本サービスは、以下の情報を取得することがあります。</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          <li><strong>位置情報</strong>: 「現在地から探す」「現在地からの所要時間」機能をご利用いただいた場合に、ブラウザの位置情報APIを通じて、利用者の現在地（緯度・経度）を取得します。</li>
          <li><strong>ブラウザ内データ（ローカルストレージ）</strong>: 「保存」した動物病院のID、閲覧履歴を、利用者のブラウザ内にのみ保存します。本サービスのサーバーには送信されません。</li>
          <li><strong>アクセスログ</strong>: 本サービスをホスティングしている Vercel が自動的に取得するアクセスログ（IPアドレス、ユーザーエージェント、参照元URL、アクセス日時等）。</li>
        </ol>

        <H2>第2条 情報の利用目的</H2>
        <p>取得した情報は、以下の目的でのみ利用します。</p>
        <ol className="list-decimal pl-5 space-y-1 mt-2">
          <li>位置情報: 現在地周辺の動物病院検索、および現在地からの所要時間計算のため</li>
          <li>ローカルストレージ: 利用者ご自身の利便性向上のため（保存・履歴機能の提供）</li>
          <li>アクセスログ: 不正アクセス防止、サービス改善のため</li>
        </ol>

        <H2>第3条 第三者への提供</H2>
        <p>本サービスは、以下の第三者サービスを利用しています。これらのサービスは、それぞれのプライバシーポリシーに基づいて情報を取り扱います。</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <Th>サービス</Th>
                <Th>用途</Th>
                <Th>送信される情報</Th>
              </tr>
            </thead>
            <tbody>
              <Tr cells={['Google Maps Platform', '地図表示、所要時間計算', '位置情報（所要時間計算時）、リクエスト時のIP等']} />
              <Tr cells={['Supabase', '動物病院データの取得', 'リクエスト時のIP等（位置情報は送信されません）']} />
              <Tr cells={['Vercel', 'サーバーホスティング', 'アクセスログ全般']} />
            </tbody>
          </table>
        </div>
        <ul className="list-disc pl-5 mt-3 space-y-1 text-xs">
          <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">Google プライバシーポリシー</a></li>
          <li><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">Supabase Privacy Policy</a></li>
          <li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline">Vercel Privacy Policy</a></li>
        </ul>

        <H2>第4条 情報の保管・削除</H2>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>位置情報</strong>: 本サービスのサーバーには保存しません。Google Maps API への送信後、当方では保持しません。</li>
          <li><strong>ローカルストレージ</strong>: 利用者のブラウザ内にのみ保存されます。利用者ご自身でブラウザの設定からいつでも削除できます。</li>
          <li><strong>アクセスログ</strong>: Vercel の保持期間に従います。</li>
        </ul>

        <H2>第5条 利用者の権利</H2>
        <p>利用者は、いつでも以下を行うことができます。</p>
        <ol className="list-decimal pl-5 space-y-1 mt-2">
          <li>ブラウザの位置情報許可を取り消す（OS・ブラウザの設定から）</li>
          <li>ローカルストレージのデータを削除する（ブラウザの「履歴とサイトデータの削除」から）</li>
          <li>本サービスの利用を停止する</li>
        </ol>

        <H2>第6条 安全管理措置</H2>
        <p>本サービスは、情報の安全管理のため、以下の措置を講じています。</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>HTTPS による全通信の暗号化</li>
          <li>Supabase の Row Level Security による不正書き換え防止</li>
          <li>Content Security Policy 等のブラウザレベルのセキュリティ対策</li>
        </ul>

        <H2>第7条 Cookie・類似技術</H2>
        <p>本サービス自体は Cookie を利用しません。ただし、上記の第三者サービスが Cookie を利用する場合があります。</p>

        <H2>第8条 本ポリシーの変更</H2>
        <p>本ポリシーの内容は、必要に応じて予告なく変更することがあります。重要な変更がある場合は、本サービス上でお知らせします。</p>

        <H2>第9条 お問い合わせ</H2>
        <p>本ポリシーに関するお問い合わせは、以下のメールアドレスまでお願いいたします。</p>
        <p className="mt-2">📧 <a href="mailto:hocchikisu.hasami0821@gmail.com" className="text-orange-600 underline break-all">hocchikisu.hasami0821@gmail.com</a></p>

        <hr className="my-8 border-slate-200" />
        <p className="text-xs text-slate-500">
          制定日: 2026年5月23日<br />
          最終更新日: 2026年5月23日
        </p>
      </article>
    </main>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-bold text-base text-slate-900 mt-7 mb-2 border-l-4 border-orange-500 pl-3">{children}</h2>;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="border border-slate-200 px-2 py-1.5 text-left font-semibold">{children}</th>;
}
function Tr({ cells }: { cells: string[] }) {
  return (
    <tr>
      {cells.map((c, i) => <td key={i} className="border border-slate-200 px-2 py-1.5 align-top">{c}</td>)}
    </tr>
  );
}
