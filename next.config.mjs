/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Postio rename: the engine moved from /app/carousel to /app/postio.
      // Keeps old links + Instagram OAuth callbacks (which reference the old
      // path) working. :path* preserves nested routes (/brands/:id, etc).
      {
        source: '/app/carousel',
        destination: '/app/postio',
        permanent: false,
      },
      {
        source: '/app/carousel/:path*',
        destination: '/app/postio/:path*',
        permanent: false,
      },
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
