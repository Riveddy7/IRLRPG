
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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// Configuration for next-pwa
// Important: Make sure to require next-pwa correctly based on your module system.
// If using ES Modules and "type": "module" in package.json, you might need dynamic import or other adjustments.
// For typical Next.js projects (CommonJS by default for config), require should work.
const withPWA = require('next-pwa')({
  dest: 'public', // Destination directory for PWA files
  register: true, // Register the service worker
  skipWaiting: true, // Install new service worker without waiting
  clientsClaim: true, // Service worker takes control of clients immediately
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
  // You can add more caching strategies for runtimeCaching if needed
  // runtimeCaching: [
  //   {
  //     urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
  //     handler: 'CacheFirst',
  //     options: {
  //       cacheName: 'google-fonts',
  //       expiration: {
  //         maxEntries: 4,
  //         maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
  //       }
  //     }
  //   },
  // ]
});

export default withPWA(nextConfig);
