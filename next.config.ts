import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow IBM Plex Mono and Inter from Google Fonts
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
