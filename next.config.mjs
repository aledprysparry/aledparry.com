/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/app/S4C/CwisBobDydd',
        destination: 'https://cwis-creator-hub.vercel.app',
        permanent: false,
      },
      {
        source: '/app/S4C/CwisBobDydd/:path*',
        destination: 'https://cwis-creator-hub.vercel.app/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
