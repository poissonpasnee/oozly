/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // C'est ça qui manquait ! Remplacez 'oozly-app' par le nom de votre repo
  basePath: '/oozly',
  assetPrefix: '/oozly',
};

export default nextConfig;
