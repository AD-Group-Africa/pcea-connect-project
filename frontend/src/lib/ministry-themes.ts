/**
 * Reusable theme descriptor for a PCEA ministry. Each ministry gets its own
 * visual personality without duplicating 200 lines of React between pages.
 * The global PCEA branding stays constant — only the accent + tone changes.
 */
export interface MinistryTheme {
  /** Primary accent color (hex) */
  accent: string
  /** Lighter accent for gradients */
  accentLight: string
  /** Subtle background tint (rgba with low opacity) */
  accentBg: string
  /** Human-readable personality label */
  personality: string
  /** Tagline shown in the hero */
  tagline: string
}

/** Ministry themes — one per ministry type, all clearly PCEA. */
export const MINISTRY_THEMES: Record<string, MinistryTheme> = {
  PCMF: {
    accent: "#7B1E3A",
    accentLight: "#9B3355",
    accentBg: "rgba(123, 30, 58, 0.12)",
    personality: "Brotherhood • Leadership • Professional Networking",
    tagline: "PCEA Men's Christian Fellowship",
  },
  YPCMF: {
    accent: "#1E90D6",
    accentLight: "#3DAEF0",
    accentBg: "rgba(30, 144, 214, 0.12)",
    personality: "Faith • Career • Network • Entrepreneurship • Service",
    tagline: "Young Professionals Fellowship",
  },
  WOMANS_GUILD: {
    accent: "#A66B9E",
    accentLight: "#C288BA",
    accentBg: "rgba(166, 107, 158, 0.12)",
    personality: "Faith • Fellowship • Service",
    tagline: "Woman's Guild",
  },
  YOUTH_FELLOWSHIP: {
    accent: "#2D8B5F",
    accentLight: "#45B37C",
    accentBg: "rgba(45, 139, 95, 0.12)",
    personality: "Energetic • Event-Driven • Community",
    tagline: "Youth Fellowship",
  },
  CHURCH_SCHOOL: {
    accent: "#E8943C",
    accentLight: "#F5B461",
    accentBg: "rgba(232, 148, 60, 0.12)",
    personality: "Warm • Friendly • Simple",
    tagline: "Sunday School",
  },
  CHOIR: {
    accent: "#6B5BA6",
    accentLight: "#8674B8",
    accentBg: "rgba(107, 91, 166, 0.12)",
    personality: "Worship • Music • Excellence",
    tagline: "Choir Ministry",
  },
  MISSION_EVANGELISM: {
    accent: "#2D7A6C",
    accentLight: "#3E9E89",
    accentBg: "rgba(45, 122, 108, 0.12)",
    personality: "Outreach • Evangelism • Service",
    tagline: "Mission & Evangelism",
  },
}

export function getTheme(type: string): MinistryTheme {
  return MINISTRY_THEMES[type] || {
    accent: "#1A3C8F",
    accentLight: "#2D54B8",
    accentBg: "rgba(26, 60, 143, 0.12)",
    personality: "Fellowship • Service",
    tagline: "PCEA Ministry",
  }
}
