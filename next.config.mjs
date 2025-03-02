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
};

export default nextConfig;
