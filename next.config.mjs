/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // ffmpeg.wasm needs these headers for SharedArrayBuffer
        source: '/app/cpshomes/socialeditor',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
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
