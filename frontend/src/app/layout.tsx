import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Actovara — Know. Act. Prove.', template: '%s · Actovara' },
  description: 'Track property compliance certificates, renewals and remedial actions in one place.',
  icons: { icon: '/images/brand/actovara-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0F223D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
