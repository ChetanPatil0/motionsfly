/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    // 1. Tell Next.js not to bundle argon2 through Webpack
    serverComponentsExternalPackages: ["argon2"],
    // 2. Tell Vercel to copy the native Linux C++ binaries into the lambda deployment
    outputFileTracingIncludes: {
      "/**": ["./node_modules/argon2/prebuilds/**/*"]
    }
  }
};

export default nextConfig;
