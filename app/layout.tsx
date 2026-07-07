import type { Metadata, Viewport } from 'next';
import { Nunito, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { TopNav } from '@/components/nav/TopNav';
import { AudioIndicator } from '@/components/common/AudioIndicator';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SpellStar ⭐',
  description: 'Phonics-first spelling practice for kids — learn by sound, then play.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${nunitoSans.variable}`}>
      <body>
        <SettingsProvider>
          <TopNav />
          <main className="main">{children}</main>
          <AudioIndicator />
        </SettingsProvider>
      </body>
    </html>
  );
}
