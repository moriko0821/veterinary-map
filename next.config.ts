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
const CSP_DIRECTIVES = [
  // 基本: 同一オリジンのみ
  "default-src 'self'",
  // スクリプト: Self + Google Maps. Next.js dev 用に 'unsafe-eval' を含める (本番では削るのが理想)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
  // スタイル: Self + inline (Tailwind) + Google Maps
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // 画像: Self + データURI + Google Maps タイル + Google Maps ロゴ
  "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com",
  // フォント: Self + Google Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // fetch/xhr: Self + Supabase + Google Maps
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com",
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
