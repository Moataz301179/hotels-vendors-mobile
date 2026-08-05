/**
 * Invo Mobile — Design Tokens (Variant A: dark institutional glassmorphism)
 * Approved 2026-08-04 (docs/planning/UI_DESIGN_TOKENS_UNIFIED.md)
 * Base: dark grey #0B0D12 + text #F2F4F8. Single restrained accent #4F6BFF (≤5% of UI).
 */

export const colors = {
  // Brand
  primary: "#4F6BFF",
  primaryDark: "#3D5BE0",
  primaryMuted: "rgba(79,107,255,0.12)",

  // Background layers
  bg: "#0B0D12",
  bgCard: "rgba(255,255,255,0.04)",
  bgCardHover: "rgba(255,255,255,0.08)",
  bgInput: "rgba(255,255,255,0.06)",
  bgModal: "rgba(11,13,18,0.95)",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.12)",

  // Text
  text: "#F2F4F8",
  textSecondary: "rgba(242,244,248,0.6)",
  textMuted: "rgba(242,244,248,0.4)",

  // Status
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#4F6BFF",

  // Semantic
  approved: "#22C55E",
  pending: "#F59E0B",
  rejected: "#EF4444",
  disbursed: "#A855F7",

  // Tab bar
  tabBg: "rgba(11,13,18,0.9)",
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
