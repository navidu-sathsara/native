import './globals.css';
import { Inter, JetBrains_Mono, Bricolage_Grotesque, IBM_Plex_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
});

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
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${bricolage.variable} ${plex.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
