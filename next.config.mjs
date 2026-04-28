/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.coachingzona.uz" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "staging.e.ufa.uz" },
    ],
  },
};

export default nextConfig;
