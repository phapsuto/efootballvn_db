import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/site-footer';

import './globals.css';

const inter = localFont({
  src: [
    {
      path: '../public/fonts/inter/inter-latin.woff2',
      weight: '100 900',
      style: 'normal'
    },
    {
      path: '../public/fonts/inter/inter-vietnamese.woff2',
      weight: '100 900',
      style: 'normal'
    }
  ],
  variable: '--font-body',
  display: 'swap',
  adjustFontFallback: 'Arial'
});

const spaceGrotesk = localFont({
  src: [
    {
      path: '../public/fonts/space-grotesk/space-grotesk-latin.woff2',
      weight: '300 700',
      style: 'normal'
    },
    {
      path: '../public/fonts/space-grotesk/space-grotesk-vietnamese.woff2',
      weight: '300 700',
      style: 'normal'
    }
  ],
  variable: '--font-headline',
  display: 'swap',
  adjustFontFallback: 'Arial'
});

export const metadata: Metadata = {
  title: 'eFootball Hub VN - Cơ sở dữ liệu & Công cụ chuyên sâu',
  description: 'Trải nghiệm eFootball Hub VN với dữ liệu cầu thủ, HLV, cẩm nang và công cụ so sánh, giả lập, tối ưu đội hình chuyên sâu cho cộng đồng Việt Nam.'
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen font-sans`}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
