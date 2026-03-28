const SITE_URL = "https://www.nanoneuron.ai";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/dashboard/", "/login/"],
        disallow: ["/api/", "/f0under/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
