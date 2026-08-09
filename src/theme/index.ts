/**
 * HOVIN Mobile — Design Tokens (Brand Green / Beige)
 *
 * PROFESSIONAL BRAND ALLOCATION (full palette, not dark-only):
 *   - GREEN #314B43 is the brand background surface. All text on it is WHITE.
 *   - dark green #24382E used for depth / pressed states / deep surfaces.
 *   - BEIGE #ABA294 is the accent — CTA fills, links, active states, and
 *     secondary accent surfaces (it pops against the green background).
 *   - grey #646367 reserved for neutral fills / disabled / wireframe tones.
 *   - Semantic status colors (green/amber/red/blue) stay for order states ONLY.
 *
 * Rationale for the mapping: the `colors.bg` token is overloaded app-wide as
 * both the screen background AND the "contrast text on a colored fill" (e.g.
 * `buttonText: { color: colors.bg }` on `backgroundColor: colors.primary`
 * buttons). To make GREEN #314B43 the background while keeping CTA fills
 * visible and readable, `colors.primary` becomes the BEIGE accent. This yields
 * beige buttons/links on a green background with no per-screen churn.
 */

export const colors = {
  // Brand primaries (explicit green/beige/grey for direct use)
  green: "#314B43",
  greenDark: "#24382E",
  beige: "#ABA294",
  grey: "#646367",

  // Brand accent "primary" surface = BEIGE (CTA fills, links, active tabs,
  // avatars, bubbles). Reads clearly on the green background.
  primary: "#ABA294",
  primaryDark: "#24382E",
  primaryMuted: "rgba(171,162,148,0.18)",

  // Accent (beige secondary)
  accent: "#ABA294",
  accentLight: "#C7BFB1",
  accentMuted: "rgba(171,162,148,0.16)",

  // Background layers — GREEN #314B43 is the dominant brand surface.
  bg: "#314B43",
  bgCard: "rgba(255,255,255,0.07)",
  bgCardHover: "rgba(255,255,255,0.12)",
  bgInput: "rgba(255,255,255,0.10)",
  bgModal: "rgba(36,56,46,0.97)",

  // Light-mode inverse — used for root/chrome when light scheme is active
  bgLight: "#F3F1EC",
  textLight: "#24382E",

  // Borders (white-alpha so they read on green)
  border: "rgba(255,255,255,0.14)",
  borderLight: "rgba(255,255,255,0.22)",

  // Text — WHITE on the green background
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.80)",
  textMuted: "rgba(255,255,255,0.55)",

  // Heading text color (brand dark neutral) — text over light/glass surfaces
  head: "#4D4A46",

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
  tabBg: "rgba(36,56,46,0.96)",
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