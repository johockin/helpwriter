/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@uiw/react-md-editor', '@uiw/react-markdown-preview'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      
      config.module.rules.push({
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        include: [
          /node_modules\/@uiw\/react-md-editor/,
          /node_modules\/@uiw\/react-markdown-preview/
        ],
      });
    }
    return config;
  },
  compress: true,
  images: {
    unoptimized: true,
    domains: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ]
  },
  rewrites: async () => [],
  experimental: {}
};

module.exports = nextConfig;