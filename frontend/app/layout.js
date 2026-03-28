import "./globals.css";

const SITE_URL = "https://www.nanoneuron.ai";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata = {
  // ─── Core ────────────────────────────────────────────────────────
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nanoneuron — #1 Lead Discovery Engine | 188 Companies · 50+ Countries",
    template: "%s | Nanoneuron Lead Discovery",
  },
  description:
    "Find verified B2B leads with live intent signals. 188 real companies, 500+ decision-maker contacts, 50+ countries. AI lead scoring, personalized cold email writer, compliance checker. Best MVP Lead Discovery Engine — start free.",
  keywords: [
    "lead discovery engine",
    "b2b lead generation",
    "sales intelligence platform",
    "lead scoring software",
    "intent signals",
    "global b2b leads",
    "find leads 50 countries",
    "b2b prospecting tool",
    "sales prospecting software",
    "outbound sales tool",
    "crm lead discovery",
    "ai lead generation",
    "cold email tool",
    "zoominfo alternative",
    "apollo.io alternative",
    "nanoneuron",
    "nanoneuron.ai",
  ],
  authors: [{ name: "Nanoneuron", url: SITE_URL }],
  creator: "Nanoneuron",
  publisher: "Nanoneuron Services",
  category: "Business Software",
  classification: "B2B Sales Intelligence",

  // ─── Canonical & Robots ──────────────────────────────────────────
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ─── Open Graph (Facebook, LinkedIn, WhatsApp) ───────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Nanoneuron",
    title: "Nanoneuron — Best MVP Lead Discovery Engine in the World",
    description:
      "188 real companies · 500+ contacts · 50+ countries · 15 intent signals · AI email writer · Live scoring. Find your next B2B customer in seconds.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Nanoneuron Lead Discovery Engine — Global B2B Intelligence",
        type: "image/png",
      },
    ],
  },

  // ─── Twitter / X Card ────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@nanoneuron_ai",
    creator: "@nanoneuron_ai",
    title: "Nanoneuron — Best MVP Lead Discovery Engine",
    description:
      "188 companies · 50+ countries · AI scoring · Cold email writer · Free to start. Find B2B leads with live intent signals.",
    images: [OG_IMAGE],
  },

  // ─── Verification (add codes from Google Search Console) ─────────
  verification: {
    google: "add-your-google-search-console-verification-code-here",
    // yandex: "...",
    // bing: "...",
  },

  // ─── Icons ───────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
    shortcut: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nanoneuron",
  },
};

// ─── JSON-LD Structured Data ─────────────────────────────────────
const jsonLd = [
  // 1. SoftwareApplication — enables rich snippet with rating/price
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Nanoneuron",
    url: SITE_URL,
    description:
      "Best MVP Lead Discovery Engine — find verified B2B leads in 50+ countries with AI scoring, intent signals, and personalized email writer.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      description: "Free trial · Starter from $49/mo",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "188 real companies across 50+ countries",
      "500+ verified decision-maker contacts",
      "15 live intent signals (Series B, CISO Hired, Cloud Migration…)",
      "AI lead scoring 0–99",
      "Personalized cold email writer",
      "GDPR / CCPA / DPDPA compliance checker",
      "CSV export",
      "Deal pipeline CRM",
      "Market map heatmap",
      "Company bookmark & saved searches",
    ],
    screenshot: OG_IMAGE,
    author: {
      "@type": "Organization",
      name: "Nanoneuron Services",
      url: SITE_URL,
    },
  },

  // 2. Organization — company identity for Knowledge Panel
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nanoneuron",
    legalName: "Nanoneuron Services",
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description:
      "Nanoneuron builds the world's best B2B Lead Discovery Engine — AI-powered sales intelligence for 50+ countries.",
    foundingDate: "2024",
    foundingLocation: "Mumbai, India",
    contactPoint: {
      "@type": "ContactPoint",
      email: "service@nanoneuron.ai",
      contactType: "customer support",
      availableLanguage: ["English"],
    },
    sameAs: [
      "https://www.linkedin.com/company/nanoneuron",
      "https://twitter.com/nanoneuron_ai",
    ],
  },

  // 3. WebSite — enables Google Sitelinks Search Box
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nanoneuron",
    url: SITE_URL,
    description: "Best MVP Lead Discovery Engine — B2B Sales Intelligence Platform",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/dashboard/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },

  // 4. FAQPage — FAQ rich snippets in search results
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Nanoneuron?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nanoneuron is a B2B Lead Discovery Engine that helps sales teams find verified decision-maker contacts across 188 companies, 50+ countries, and 10 industries. It uses AI lead scoring, live intent signals, and an automated cold email writer.",
        },
      },
      {
        "@type": "Question",
        name: "How is Nanoneuron different from Apollo.io or ZoomInfo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nanoneuron focuses on quality over quantity: 188 curated global companies with deep intelligence (intent signals, tech stack, compliance notes, pitch angle), AI-generated cold emails per contact, and a built-in deal pipeline — all at a fraction of the cost.",
        },
      },
      {
        "@type": "Question",
        name: "What intent signals does Nanoneuron track?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "15 live intent signals: Series A/B Funded, Recent IPO, Hiring Engineers, Hiring Sales, Expanding Globally, New Product Launch, Acquisitions, Tech Refresh, Cloud Migration, Digital Transformation, CISO Hired, Compliance Audit, Entering New Market, Recent Rebrand.",
        },
      },
      {
        "@type": "Question",
        name: "Is Nanoneuron GDPR compliant?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Nanoneuron automatically surfaces the relevant compliance law for each contact's country (GDPR, UK GDPR, CCPA, DPDPA, LGPD, APPI, PDPA, POPIA, KVKK and 11 more) and shows an outreach risk level so you stay compliant.",
        },
      },
      {
        "@type": "Question",
        name: "How much does Nanoneuron cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nanoneuron offers a free trial with 10 lead unlocks. Paid plans start at $49/month (Starter: 100 unlocks), $199/month (Pro: 500 unlocks), and $499/month (Business: 2,500 unlocks + team features + API).",
        },
      },
    ],
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#4F8EF7" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nanoneuron" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={SITE_URL} />

        {/* JSON-LD Structured Data */}
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`,
          }}
        />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
