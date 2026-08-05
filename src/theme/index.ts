/**
 * Invo Mobile — Design Tokens (Variant B: dark blue-black + muted gold)
 * Approved 2026-08-04 (skill-generated design-system/invo/MASTER.md)
 * Dark blue-black background, white text, light/dark grey hierarchy,
 * muted champagne gold accent (#D4AF37). Title weights capped at 600.
 * Semantic status colors (green/amber/red) used for order states only.
 */

export const colors = {
  // Brand accent (muted champagne gold, AA on dark surfaces ~9.2:1)
  primary: "#D4AF37",
  primaryDark: "#B8962E",
  primaryMuted: "rgba(212,175,55,0.14)",

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
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#F2F4F8",

  // Semantic
  approved: "#22C55E",
  pending: "#F59E0B",
  rejected: "#EF4444",
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
