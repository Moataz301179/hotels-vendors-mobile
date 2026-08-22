/**
 * HOVIN Mobile — Design Tokens (hotelsvendors.com/hotels/join palette)
 *
 * MOBILE IS DARK THEME (user-agreed), sourced from the live /hotels/join page:
 *   · Dark grey-black surfaces: bg #0B0F14 · raised #16161f · deep #15151e
 *   · GOLD #c8a86b (accent gold #8a6d3b) — headings, icons, accents
 *   · GREEN #314B43 — buttons, pills, brand surfaces
 *   · BEIGE #ABA294 — secondary accent / checkmarks
 *   · WHITE text on dark. Grey text: rgba(255,255,255,0.55-0.80)
 */

export const colors = {
  // Brand primaries (join-page palette)
  gold: "#c8a86b",
  goldDark: "#8a6d3b",
  green: "#314B43",
  greenDark: "#24382E",
  beige: "#ABA294",
  grey: "#646367",

  // Dark grey-black surfaces (join page)
  bgDeep: "#15151e",
  bg: "#0B0F14",           // dominant dark background
  bgRaised: "#16161f",     // card surface
  bgCard: "#16161f",
  bgCardHover: "#1e1e28",
  bgInput: "rgba(255,255,255,0.08)",
  bgModal: "rgba(11,15,20,0.98)",

  // Brand accent "primary" surface
  primary: "#c8a86b",
  primaryDark: "#8a6d3b",
  primaryMuted: "rgba(200,168,107,0.18)",

  accent: "#ABA294",
  accentLight: "#C7BFB1",
  accentMuted: "rgba(171,162,148,0.16)",

  // Light-mode inverse — used for root/chrome when light scheme is active
  bgLight: "#F3F1EC",
  textLight: "#24382E",

  // Borders (white-alpha so they read on dark)
  border: "rgba(255,255,255,0.14)",
  borderLight: "rgba(255,255,255,0.22)",

  // Text — WHITE on the dark background
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.80)",
  textMuted: "rgba(255,255,255,0.55)",

  // Heading text color
  head: "#F2F4F7",

  // Status (semantic only, never brand)
  success: "#059669",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#3B82F6",

  // Semantic
  approved: "#059669",
  pending: "#F59E0B",
  rejected: "#DC2626",
  disbursed: "#E2E4E9",

  // Tab bar
  tabBg: "rgba(11,15,20,0.96)",
  tabBorder: "rgba(255,255,255,0.12)",
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
  h1: { fontSize: 28, fontWeight: "600" as const, letterSpacing: -0.5, fontFamily: "PlusJakartaSans_600SemiBold" },
  h2: { fontSize: 22, fontWeight: "600" as const, letterSpacing: -0.3, fontFamily: "PlusJakartaSans_600SemiBold" },
  h3: { fontSize: 18, fontWeight: "600" as const, fontFamily: "PlusJakartaSans_600SemiBold" },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22, fontFamily: "PlusJakartaSans_400Regular" },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18, fontFamily: "PlusJakartaSans_400Regular" },
  label: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.5, fontFamily: "PlusJakartaSans_600SemiBold" },
  caption: { fontSize: 11, fontWeight: "400" as const, fontFamily: "PlusJakartaSans_400Regular" },
} as const;