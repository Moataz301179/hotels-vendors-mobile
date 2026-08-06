/**
 * Invo Mobile — Design Tokens (Corporate Indigo)
 * Dark blue-black background, white text, indigo accent (#312E81).
 * Semantic status colors (green/amber/red) used for order states only.
 */

export const colors = {
  // Brand accent (deep indigo, AA on dark surfaces)
  primary: "#312E81",
  primaryDark: "#1E1B4B",
  primaryMuted: "rgba(49,46,129,0.14)",

  // Accent (royal blue)
  accent: "#6366F1",
  accentLight: "#818CF8",
  accentMuted: "rgba(99,102,241,0.14)",

  // Background layers (dark blue-black, slate-tinted)
  bg: "#0A0E1A",
  bgCard: "rgba(148,163,184,0.06)",
  bgCardHover: "rgba(148,163,184,0.10)",
  bgInput: "rgba(148,163,184,0.08)",
  bgModal: "rgba(10,14,26,0.95)",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",

  // Text
  text: "#F2F4F8",
  textSecondary: "rgba(242,244,248,0.72)",
  textMuted: "rgba(242,244,248,0.48)",

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
  tabBg: "rgba(10,14,26,0.9)",
  tabBorder: "rgba(148,163,184,0.08)",
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
