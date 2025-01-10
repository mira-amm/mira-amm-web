/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  output: "export",
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
