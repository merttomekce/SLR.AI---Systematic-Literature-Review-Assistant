/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      // pdfjs-dist optionally requires 'canvas' in Node.js environments. 
      // We resolve it to an empty module since we only use PDF.js in the browser.
      canvas: './empty-module.js',
    },
  },
}

export default nextConfig
