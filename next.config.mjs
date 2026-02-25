// next.config.mjs
const repo = 'oozly'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },

  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
}

export default nextConfig
