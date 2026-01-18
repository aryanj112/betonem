import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail builds on ESLint errors in production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail builds on TypeScript errors in production (optional)
    // ignoreBuildErrors: true,
  },
  experimental: {
    // Ensure dynamic rendering works properly
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ensure environment variables are available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
