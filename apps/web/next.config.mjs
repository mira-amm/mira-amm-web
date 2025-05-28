/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript:{
    ignoreBuildErrors: true
  },
  trailingSlash: true,
  // output: "export",
  async redirects() {
    return [
      {
        source: "/swap",
        destination: "/",
        permanent: false,
      },
    ];
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(mp3)$/,
      use: {
        loader: "file-loader",
      },
    });
    return config;
  },
};

export default nextConfig
