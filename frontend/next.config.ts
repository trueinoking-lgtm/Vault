import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for optimized Docker deployment
  output: "standalone",

  // Allow remote origins for headless browser QA
  allowedDevOrigins: ['178.104.213.110', '127.0.0.1'],

  // Experimental features
  // Type assertion needed: proxyClientMaxBodySize is valid in Next.js 15 but types lag behind
  experimental: {
    // Increase proxy body size limit for file uploads (default is 10MB)
    // This allows larger files to be uploaded through the /api/* rewrite proxy to FastAPI
    proxyClientMaxBodySize: '100mb',
  } as NextConfig['experimental'],

  // API Rewrites: Proxy /api/* requests to FastAPI backend
  // This simplifies reverse proxy configuration - users only need to proxy to port 8502
  // Next.js handles internal routing to the API backend on port 5055
  async rewrites() {
    const internalApiUrl = process.env.INTERNAL_API_URL || 'http://localhost:5055'
    console.log(`[Next.js Rewrites] Proxying /api/* to ${internalApiUrl}/api/*`)
    return [
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/api/:path*`,
      },
    ]
  },

  // Redirects: preserve legacy admin/settings entry points while routing into the owner shell
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/owner',
        permanent: false,
      },
      {
        source: '/settings/api-keys',
        destination: '/owner/ai',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
