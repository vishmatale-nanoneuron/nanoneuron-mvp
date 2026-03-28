import "./globals.css";
export const metadata = {
  title: "Nanoneuron CRM — Find Leads. Track Deals. Stay Compliant.",
  description: "Discover verified leads in 50+ countries. Auto-compliance for GDPR, CCPA, LGPD. Start free.",
  icons: { icon: "/icon.svg" },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Nanoneuron" },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#4F8EF7"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Nanoneuron"/>
        <link rel="manifest" href="/manifest.json"/>
        <script dangerouslySetInnerHTML={{__html:`
          if('serviceWorker' in navigator){
            window.addEventListener('load',function(){
              navigator.serviceWorker.register('/sw.js').catch(function(){});
            });
          }
        `}}/>
      </head>
      <body style={{margin:0}}>{children}</body>
    </html>
  );
}
