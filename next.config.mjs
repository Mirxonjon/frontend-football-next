/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    remotePatterns: [
      { protocol: "https", hostname: "api.coachingzona.uz" },
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
    ];
  },
  productionBrowserSourceMaps: false,
  compress: true,
};

export default nextConfig;
