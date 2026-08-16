import './globals.css';
import { Providers } from '@/components/providers';

export const metadata = {
  title: {
    default: 'Native - Infrastructure for autonomous fleets',
    template: '%s / Native',
  },
  description:
    'Native is the control plane for autonomous Minecraft fleets. Deploy, orchestrate and observe hundreds of bots from one obsessively designed dashboard.',
  keywords: ['bot hosting', 'automation', 'control panel', 'fleet orchestration'],
  openGraph: {
    title: 'Native - Infrastructure for autonomous fleets',
    description: 'Deploy, orchestrate and observe hundreds of bots from one control plane.',
    type: 'website',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport = {
  themeColor: '#f9f9f6',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
