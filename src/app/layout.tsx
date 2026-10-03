import type { Metadata, Viewport } from 'next';
import { DM_Sans, IBM_Plex_Mono, Inter } from 'next/font/google';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
import { MOTION_SCRIPT, Reveal } from '@/components/site/Reveal';
import { profile, site } from '@/content/profile';
import '@/components/buttons/buttons.css';
import './globals.css';
import './pages.css';

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', axes: ['opsz'], display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });
const button = Inter({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-button', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${profile.name} — AI, tools and interfaces`, template: `%s · ${profile.name}` },
  description: 'I build AI tools, agents and the interfaces around them. Portfolio, services and a public AI Lab with every model run, failures included.',
  openGraph: { type: 'website', siteName: profile.name, url: site.url },
};

export const viewport: Viewport = { themeColor: '#090a0c', colorScheme: 'dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${button.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      <body id="top">
        <Reveal />
        <Nav />
        <div className="grain" aria-hidden="true" />
        {children}
        <Footer />
      </body>
    </html>
  );
}
