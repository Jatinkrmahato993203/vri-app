// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Venue Risk Intelligence — Real-Time Safety Observability',
  description:
    'VRI fuses crowd-density, heat-exposure, and egress-capacity signals into a single plain-language risk narrative for venue operators, compliance officers, and insurers.',
  keywords: ['venue safety', 'crowd risk', 'heat monitoring', 'egress capacity', 'risk intelligence'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
