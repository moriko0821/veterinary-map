import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // title.template を使うと、子ページが title: 'XXX' を定義したときに
  // 「XXX｜全国動物病院マップ」と自動で末尾が付く。
  // 子ページで title を定義しない場合は default が使われる。
  title: {
    default: "全国動物病院マップ｜全国 10,830 件の動物病院を地図で検索",
    template: "%s｜全国動物病院マップ",
  },
  description:
    "全国の動物病院を地図とフィルターで検索できるスマホ向けサイト。夜間対応・土日診療・口コミ評価などの条件で絞り込み、現在地からの所要時間も確認できます。",
};

// Next.js 16 では themeColor は viewport 側で指定する
export const viewport: Viewport = {
  themeColor: "#FF6F00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
