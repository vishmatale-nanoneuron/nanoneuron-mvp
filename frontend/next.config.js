/** @type {import('next').NextConfig} */
module.exports = {
  output: "export",           // Static export for Cloudflare Pages
  trailingSlash: true,        // Cloudflare Pages clean URLs
  images: { unoptimized: true },
  // Security headers handled by Cloudflare Pages via public/_headers file
};
