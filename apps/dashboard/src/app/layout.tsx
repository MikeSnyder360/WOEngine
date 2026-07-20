import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WOEngine Dashboard',
  description: 'White-label fitness app dashboard - manage branding, programs, and builds',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
