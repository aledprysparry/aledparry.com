/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Postio is now its own standalone app. Bounce the in-site paths to the
      // standalone deployment (both the current /app/postio and the older
      // /app/carousel path). Temporary (permanent: false) so it can be
      // repointed to a custom domain later. :path* preserves nested routes.
      {
        source: '/app/postio',
        destination: 'https://postio-kappa.vercel.app',
        permanent: false,
      },
      {
        source: '/app/postio/:path*',
        destination: 'https://postio-kappa.vercel.app/:path*',
        permanent: false,
      },
      {
        source: '/app/carousel',
        destination: 'https://postio-kappa.vercel.app',
        permanent: false,
      },
      {
        source: '/app/carousel/:path*',
        destination: 'https://postio-kappa.vercel.app/:path*',
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
      // Buan moved to its own standalone app. Bounce the marketing landing
      // to the standalone deployment. Temporary (permanent: false) so it can
      // be repointed to buan.co once that domain is live. Only /buan exactly
      // is redirected – sub-routes stay on the app/buan/* tree for now.
      {
        source: '/buan',
        // Public production URL of the standalone Buan project. The previous
        // team-alias (buan-aled-parrys-projects.vercel.app) is gated by Vercel
        // Deployment Protection (403 for every visitor), which broke /buan.
        destination: 'https://buan-snowy.vercel.app',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
