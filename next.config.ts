import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'https://8080-firebase-hugepos-1754404777683.cluster-4xpux6pqdzhrktbhjf2cumyqtg.cloudworkstations.dev',
    'http://localhost:8080',
    'http://localhost:9002',
    'http://localhost:3001',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3001',
  ],
};

export default nextConfig;
