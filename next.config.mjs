/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,

  // GitHub Pages ne supporte pas l'optimisation d'images Next côté serveur
  images: { unoptimized: true },

  // Important pour que le build sorte bien un dossier /out
  reactStrictMode: true,
}

export default nextConfig
