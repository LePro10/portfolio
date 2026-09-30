import type { Metadata, Viewport } from 'next';
import { DM_Sans, IBM_Plex_Mono, Inter } from 'next/font/google';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
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

export const viewport: Viewport = { themeColor: '#080909', colorScheme: 'dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${button.variable}`}>
      <body id="top">
        <Nav />
        <div className="grain" aria-hidden="true" />
        <div className="frame" aria-hidden="true"><span className="corner top-left" /><span className="corner top-right" /><span className="corner bottom-left" /><span className="corner bottom-right" /></div>
        {children}
        <Footer />
      </body>
    </html>
  );
}
