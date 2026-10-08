import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Best Omotayo — Product Designer', template: '%s — Best Omotayo' },
  description: 'Best Omotayo is a product designer in Toronto designing intuitive, human-centric experiences.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
