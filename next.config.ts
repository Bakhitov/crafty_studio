import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hsbwwsadm9nwvz1a.public.blob.vercel-storage.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
