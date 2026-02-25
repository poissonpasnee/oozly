// next.config.mjs
const repo = 'poissonpasnee' // ✅ remplace par le NOM EXACT de ton repo GitHub si différent

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // ✅ remplace "next export"
  trailingSlash: true,       // ✅ évite des 404 sur GitHub Pages
  images: { unoptimized: true },

  // ✅ indispensable si ton site est sur https://USERNAME.github.io/REPO/
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
}

export default nextConfig
