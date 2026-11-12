import './globals.css';

export const metadata = {
  title: 'NexAris Odyssey',
  description: 'Explore NASA SPHEREx infrared skies: Aladin Lite sky view with FITS support, an AI space guide and a planet-discovery race.',
  authors: [{ name: 'Tasneem Hosny' }],
  icons: { icon: '/logo.jpg' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#04050d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded as a stylesheet (not next/font) so canvas drawing can use the plain family names. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700;800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
