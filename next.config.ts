import type { NextConfig } from 'next'

const caseStudies = ['falcon', 'elysium', 'lura', 'fcmb', 'heirs-life', 'aladdin', 'fern', 'figma']

const nextConfig: NextConfig = {
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
