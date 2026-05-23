/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Slim, self-contained production server for Docker — copies only the
  // files actually needed at runtime, so the final image stays small and
  // SSR/ISR keep working (no static export).
  output: "standalone",
  // Speed: silently rewrite `import { Modal } from "antd"` to direct
  // sub-module imports so the bundler ships only the AntD modules we use.
  // Same idea for ant-design icons.
  modularizeImports: {
    antd: {
      transform: "antd/es/{{kebabCase member}}",
      preventFullImport: true,
    },
    "@ant-design/icons": {
      transform: "@ant-design/icons/es/icons/{{member}}",
      preventFullImport: true,
    },
  },
  transpilePackages: [
    "antd",
    "@ant-design/icons",
    "rc-util",
    "rc-pagination",
    "rc-picker",
  ],
  sassOptions: {
    includePaths: ["./src/assets/scss"],
  },
  // Allow Next/Image to optimise covers from the API host(s).
  images: {
    formats: ["image/avif", "image/webp"],
    // Cache optimised images aggressively — addresses Lighthouse's
    // "inefficient cache lifetime" finding (saves up to ~8 MB on repeat
    // visits). The hash in the URL makes invalidation safe.
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [
      { protocol: "https", hostname: "api.coachingzona.uz" },
      { protocol: "https", hostname: "api.coaching-center.uz" },
      { protocol: "https", hostname: "coaching-center.uz" },
      { protocol: "http", hostname: "localhost", port: "4021" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "staging.e.ufa.uz" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  // Security: reasonable headers everywhere, plus long-lived cache for
  // hashed static assets.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Static, content-hashed bundles can be cached forever by the
        // browser. Next sets immutable on /_next/static already, but make
        // it explicit + apply to /static if used.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Optimised images served by Next's image pipeline — same long
        // cache, addresses Lighthouse's 8 MiB cache-lifetime finding.
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Favicons, app icons and the manifest — these rarely change and
        // can sit in the browser cache for a year. The manifest itself is
        // tiny; the icon files are the meaningful win.
        source: "/(icon|apple-icon|icon-192|icon-512).png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },
  productionBrowserSourceMaps: false,
  compress: true,
};

export default nextConfig;
