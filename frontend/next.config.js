/** @type {import('next').NextConfig} */
module.exports = {
  output: "export",           // Static export for Cloudflare Pages
  trailingSlash: true,        // Cloudflare Pages clean URLs
  images: { unoptimized: true },
  // No rewrites in static export — frontend calls NEXT_PUBLIC_API_URL directly
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ]}];
  },
};
