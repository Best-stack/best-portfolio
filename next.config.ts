import type { NextConfig } from 'next'

const caseStudies = ['falcon', 'elysium', 'lura', 'fcmb', 'heirs-life', 'aladdin', 'fern', 'figma']

const nextConfig: NextConfig = {
  images: {
    // Lets the hero load its portrait through /_next/image (same origin), so WebGL can read it
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'framerusercontent.com' },
    ],
  },
  // Keep old Framer URLs working (links on LinkedIn, Behance, your resume…)
  async redirects() {
    return [
      { source: '/case-studies', destination: '/work', permanent: true },
      { source: '/contact', destination: '/about#contact', permanent: true },
      ...caseStudies.map((slug) => ({ source: `/${slug}`, destination: `/work/${slug}`, permanent: true })),
    ]
  },
}

export default nextConfig
