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
        source: "/blocked",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
