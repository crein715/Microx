import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Microx — Ride the trend. Post like a pro.',
  description:
    'AI-powered X/Twitter content tool. Find trending topics, rewrite them in your style, and pair with GIFs.',
  openGraph: {
    title: 'Microx',
    description: 'Ride the trend. Post like a pro.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
