/**
 * HotelsVendors Mobile — Design Tokens
 * Dark Mode Glassmorphism (matches web dashboard)
 */

export const colors = {
  // Brand
  primary: "#39FF7E",
  primaryDark: "#2BD668",
  primaryMuted: "rgba(57,255,126,0.12)",

  // Background layers
  bg: "#07090F",
  bgCard: "rgba(255,255,255,0.04)",
  bgCardHover: "rgba(255,255,255,0.08)",
  bgInput: "rgba(255,255,255,0.06)",
  bgModal: "rgba(7,9,15,0.95)",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",

  // Text
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.6)",
  textMuted: "rgba(255,255,255,0.4)",

  // Status
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Semantic
  approved: "#22C55E",
  pending: "#F59E0B",
  rejected: "#EF4444",
  disbursed: "#A855F7",

  // Tab bar
  tabBg: "rgba(7,9,15,0.9)",
  tabBorder: "rgba(255,255,255,0.06)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: "400" as const },
} as const;
