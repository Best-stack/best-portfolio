const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true } as const

export const ArrowUpRight = () => (
  <svg className="icon-arrow" viewBox="0 0 14 14" {...base}>
    <path d="M3 11 11 3M5 3h6v6" />
  </svg>
)

export const ArrowLeft = () => (
  <svg className="icon-arrow" viewBox="0 0 14 14" {...base}>
    <path d="M11 7H3M6 4 3 7l3 3" />
  </svg>
)

export const LinkedInIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" />
  </svg>
)

export const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

export const DocIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
)
