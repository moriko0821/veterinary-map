import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '利用規約｜全国動物病院マップ',
};

export default function TermsPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-white">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center px-3 py-2.5">
        <Link href="/my" className="p-1.5 -ml-1" aria-label="戻る">
          <ArrowLeft size={20} className="text-slate-700" />
        </Link>
        <h1 className="flex-1 ml-1 font-semibold text-slate-900">利用規約</h1>
      </header>

      <article className="px-5 py-6 max-w-2xl mx-auto text-slate-800 leading-relaxed text-sm">
        <p className="text-slate-600 mb-6">
          本利用規約（以下「本規約」）は、「全国動物病院マップ」（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく前に、本規約を必ずお読みください。本サービスを利用された時点で、本規約に同意いただいたものとみなします。
        </p>

        <H2>第1条 サービスの内容</H2>
        <p>本サービスは、全国の動物病院の情報を、地図とフィルター検索で提供するウェブサービスです。表示される情報には以下が含まれます。</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>動物病院の名称、住所、電話番号、Webサイト</li>
          <li>営業時間、対応動物等の情報</li>
          <li>Google マップ上の口コミ</li>
          <li>評価（星の数）</li>
        </ul>

        <H2>第2条 情報の正確性と免責</H2>
        <ol className="list-decimal pl-5 space-y-3 mt-2">
          <li>本サービスで表示される動物病院の情報は、Google マップから取得したものを元にしており、<strong>最新の情報や完全に正確な情報を保証するものではありません</strong>。</li>
          <li>営業時間・休診日・診療内容・連絡先等が変更されている場合があります。<strong>ご利用前に必ず各動物病院の公式情報をご確認ください</strong>。</li>
          <li className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r">
            <strong>緊急時は、直接動物病院に電話で確認するか、夜間救急動物病院等の公式情報をご確認ください</strong>。本サービスの情報を頼りにしたことで発生した損害について、本サービスは一切の責任を負いません。
          </li>
          <li>口コミは、Google マップに投稿された第三者の意見であり、本サービスの見解ではありません。</li>
        </ol>

        <H2>第3条 医療行為への注意</H2>
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r mt-2">
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>本サービスは医療相談・診断のためのサービスではありません</strong>。動物の健康に関する判断は、必ず獣医師等の専門家にご相談ください。</li>
            <li>本サービスに掲載されている情報を、医療的な判断の根拠としないでください。</li>
          </ol>
        </div>

        <H2>第4条 禁止事項</H2>
        <p>利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
        <ol className="list-decimal pl-5 space-y-1 mt-2">
          <li>本サービスのデータを大量・自動的に取得する行為（スクレイピング、クローリング等）</li>
          <li>本サービスのデータを商用利用する行為（事前の許可がある場合を除く）</li>
          <li>本サービスの動作を妨害する行為（過剰なリクエスト等）</li>
          <li>本サービスを通じて取得した動物病院情報を、本来の用途以外で利用する行為</li>
          <li>法令・公序良俗に反する行為</li>
          <li>動物病院に対する誹謗中傷や営業妨害</li>
        </ol>

        <H2>第5条 サービスの変更・中断・終了</H2>
        <p>本サービスは、利用者への事前通知なく、以下を行う場合があります。</p>
        <ol className="list-decimal pl-5 space-y-1 mt-2">
          <li>本サービスの内容を変更すること</li>
          <li>本サービスの提供を一時的に中断すること</li>
          <li>本サービスの提供を終了すること</li>
        </ol>
        <p className="mt-2">これにより利用者または第三者に発生した損害について、本サービスは責任を負いません。</p>

        <H2>第6条 知的財産権</H2>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          <li>本サービスのデザイン、ソースコード、その他の創作物に関する権利は、本サービスの運営者に帰属します。</li>
          <li>動物病院の情報・口コミ等のデータは、Google マップから取得したものであり、Google および投稿者にも権利があります。</li>
        </ol>

        <H2>第7条 第三者サービスの利用</H2>
        <p>本サービスは、Google Maps Platform、Supabase、Vercel等の第三者サービスを利用しています。これらのサービスの利用規約も併せて適用される場合があります。</p>

        <H2>第8条 本規約の変更</H2>
        <p>本規約は、必要に応じて予告なく変更されることがあります。重要な変更がある場合は、本サービス上でお知らせします。</p>

        <H2>第9条 準拠法・裁判管轄</H2>
        <ol className="list-decimal pl-5 space-y-1 mt-2">
          <li>本規約は日本法に準拠して解釈されます。</li>
          <li>本サービスに関する紛争については、運営者の所在地を管轄する裁判所を専属的合意管轄裁判所とします。</li>
        </ol>

        <H2>第10条 お問い合わせ</H2>
        <p>本規約に関するお問い合わせは、以下のメールアドレスまでお願いいたします。</p>
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
