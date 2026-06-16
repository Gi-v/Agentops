/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for our ultra-lightweight Multi-Stage Docker builds
  output: 'standalone',
  
  // Bypass strict type-checking during production compilation
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Bypass strict ESLint checks during production compilation
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;