/**
 * HOVIN Mobile — Design Tokens (hotelsvendors.com/hotels/join palette)
 *
 * APPLE-STYLE LIGHT THEME: white, grey, light blue and black.
 * The mobile app shares the web shell palette; dark theme values are not
 * part of the current product direction.
 */

export const colors = {
  // Brand primaries
  gold: "#1d1d1f",
  goldDark: "#6e6e73",
  green: "#8fc4f2",
  greenDark: "#6fa7e6",
  beige: "#6e6e73",
  grey: "#6e6e73",

  // Dark grey-black surfaces (join page)
  bgDeep: "#f2f2f7",
  bg: "#ffffff",
  bgRaised: "#f5f5f7",
  bgCard: "#ffffff",
  bgCardHover: "#eef6ff",
  bgInput: "#ffffff",
  bgModal: "rgba(255,255,255,0.98)",

  // Brand accent "primary" surface
  primary: "#9dc5ff",
  primaryDark: "#6fa7e6",
  primaryMuted: "#e5f1ff",

  accent: "#d1d1d6",
  accentLight: "#f2f2f7",
  accentMuted: "#eef6ff",

  // Light-mode inverse — used for root/chrome when light scheme is active
  bgLight: "#ffffff",
  textLight: "#1d1d1f",

  // Borders (white-alpha so they read on dark)
  border: "#d1d1d6",
  borderLight: "#b8c9d9",

  // Text — WHITE on the dark background
  text: "#1d1d1f",
  textSecondary: "#3c3c43",
  textMuted: "#6e6e73",

  // Heading text color
  head: "#1d1d1f",

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
  tabBg: "#f2f2f7",
  tabBorder: "#d1d1d6",
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
