import "./globals.css";
export const metadata = {
  title: "Nanoneuron CRM — Find Leads. Track Deals. Stay Compliant.",
  description: "Discover verified leads in 20+ countries. Auto-compliance for GDPR, CCPA, LGPD. Start free with 50 credits.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({ children }) {
  return <html lang="en"><head><meta name="theme-color" content="#06080D"/></head><body style={{margin:0}}>{children}</body></html>;
}
