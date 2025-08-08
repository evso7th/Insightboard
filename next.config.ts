import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
  experimental: {
    // allowedDevOrigins is now a top-level property
    serverActions: {
      bodySizeLimit: '4.5mb', // Увеличим лимит размера тела запроса
    },
  },
  // Увеличим максимальную продолжительность выполнения серверных действий до 5 минут (300 секунд)
  serverActions: {
    maxDuration: 300,
  },
  allowedDevOrigins: [
    'https://*.cloudworkstations.dev',
    'https://*.firebase.studio',
  ],
};

export default nextConfig;
