import type { NextConfig } from "next";

// ============================================================
// Content-Security-Policy (CSP)
//
// アプリが通信・読み込みする必要のあるドメインを明示する。
// 列挙されていないドメインはブラウザが自動的にブロックする。
//
// 必須ドメイン:
//   Google Maps JS API:     maps.googleapis.com, maps.gstatic.com
//   Distance Matrix API:    maps.googleapis.com (ブラウザから fetch)
//   Supabase:               *.supabase.co (REST + WebSocket)
// ============================================================
// スクリプト指令: 'unsafe-eval' は Next.js dev で React Refresh 等が必要とするため dev のみ追加。
// 本番では eval を使う実装がないため削除し XSS の影響範囲を縮小する。
const SCRIPT_SRC = process.env.NODE_ENV === 'production'
  ? "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com";

const CSP_DIRECTIVES = [
  // 基本: 同一オリジンのみ
  "default-src 'self'",
  // スクリプト: 環境別 (上記 SCRIPT_SRC 参照)
  SCRIPT_SRC,
  // スタイル: Self + inline (Tailwind) + Google Maps
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // 画像: Self + データURI + Google Maps タイル + Google Maps ロゴ
  "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com",
  // フォント: Self + Google Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // fetch/xhr: Self + Supabase + Google Maps (legacy) + Google Routes API
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://routes.googleapis.com",
  // フレーム埋め込みを禁止 (X-Frame-Options 同等)
  "frame-ancestors 'none'",
  // 基本URI制限
  "base-uri 'self'",
  // フォーム送信先制限
  "form-action 'self'",
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    const securityHeaders = [
      // クリックジャッキング防止: 他サイトの iframe にこのサイトを埋め込ませない
      { key: "X-Frame-Options", value: "DENY" },
      // MIME スニッフィング防止: ブラウザの「自動判定」を無効化
      { key: "X-Content-Type-Options", value: "nosniff" },
      // リファラ漏洩を最小化
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // ブラウザの古い XSS フィルタを有効化 (現代では不要だが念のため)
      { key: "X-XSS-Protection", value: "0" },
      // CSP: 通信可能ドメインを制限 (詳細は上記 CSP_DIRECTIVES)
      { key: "Content-Security-Policy", value: CSP_DIRECTIVES.join("; ") },
      // 位置情報/カメラ等は当アプリで現在地のみ使用、他は許可しない
      {
        key: "Permissions-Policy",
        value: "geolocation=(self), camera=(), microphone=(), payment=()",
      },
    ];

    // HSTS は本番(HTTPS)時のみ。ローカル http://localhost で付けると HTTPS 強制で開けなくなる
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        // すべてのパスに適用
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
