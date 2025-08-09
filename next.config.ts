import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
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
  },
 allowedDevOrigins: [
    'https://*.cloudworkstations.dev',
    'https://*.firebase.studio',
  ],
 serverActions: true,
};

export default nextConfig;
