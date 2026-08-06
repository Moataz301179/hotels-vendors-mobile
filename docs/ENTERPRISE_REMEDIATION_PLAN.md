# INVO Platform — Enterprise Remediation Program (L99)

> **Scope:** `hotels-vendors` (Next.js 16 backend) + `hotels-vendors-mobile` (Expo 57)
> **Standard:** L99 — production-grade financial software: zero known critical vulnerabilities, zero compile errors, gated CI, auditable money paths, tenant-isolated data, graceful failure everywhere.
> **Source:** 4-agent forensic/operational/quality/security audit (2026-08-05). 100+ findings consolidated.

---

## L99 Acceptance Criteria

| Gate | Standard |
|------|----------|
| **G-Sec** | 0 CRITICAL/HIGH security findings open; all money mutations have auth + RBAC + idempotency + audit; no secrets in VCS |
| **G-Build** | `tsc --noEmit` = 0 errors in both repos; no missing dependencies/peer deps |
| **G-Tenant** | Every query tenant-scoped; no service-key-only endpoints touching tenant data; no cross-tenant RLS bypass |
| **G-Money** | Payment/factoring/settlement flows: idempotent, audited, non-replayable; mock responses never reachable in prod |
| **G-Quality** | Tests run in CI and block merge; lint enforced; error boundaries at app root; no silent catch in user flows |
| **G-UX** | Loading + empty + error states on all data screens; accessibility labels on interactive elements; safe-area aware |

---

## PHASE 0 — Security Lockdown (money + auth paths)

### P0.1 CRITICAL-1: Unauthenticated factoring list (backend)
`app/api/v1/invo/factoring/route.ts:99` GET handler has no `authenticate()`.
→ Add `authenticate` + `requirePermission(auth, "invoice:factor")` + tenant scoping.

### P0.2 CRITICAL-2: Committed secrets (backend)
`.env`, `.env.local` contain SESSION_SECRET = HMAC secret (identical values).
→ Rotate secrets, split values, `.gitignore` `.env*`; document rotation runbook. **(Manual step — requires operator.)**

### P0.3 CRITICAL-3: Idempotency no-op (backend)
`lib/security/idempotency.ts` `validateIdempotencyKey()` always returns valid.
→ Wire to real Redis check-or-set; crypto-random key generation.

### P0.4 CRITICAL-5: Supabase service-role RLS bypass (backend)
`app/invo/invoices/page.tsx`, `app/invo/orders/page.tsx` use service key with no tenant filter.
→ Add `.eq("tenant_id", ...)` filter from session; long-term route via Prisma.

### P0.5 HIGH-7/8/9: Payment idempotency + audit gaps (backend)
- `payments/create-intent` — add `requireIdempotencyKey` (payment:create context).
- `payments/escrow` POST/PUT — add idempotency + `audit()` + `rateLimit: "financial"`.
- `invo/settlement` — add auth + tenant scoping + audit; gate mock behind `NODE_ENV !== "production"`.

### P0.6 HIGH-12: Password reset session revocation
`auth/reset-password` — clear `refreshTokenHash`; ensure `session:user-revoked` honored in fallback path.

### P0.7 MEDIUM-17/18/19: Data exposure
- `auth/send-otp` — never return `devCode` outside explicit non-prod guard.
- `products` GET — strip wholesale/supplier fields from public response (or require auth + tenant scope).
- `auth/me` — remove `taxId` and cross-user `approvals` from response.

---

## PHASE 1 — Build Stability (zero tsc errors)

### P1.1 Web: 12 tsc errors
| File | Fix |
|---|---|
| `supplier/catalog/import/route.ts:9,116` | `getTemplateBuffer` → `generateTemplateBuffer` |
| `supplier/catalog/import/route.ts:110`, `confirm/route.ts:155`, `status/[jobId]/route.ts:50` | `rateLimit: "standard"` → `"api"` |
| `supplier/catalog/import/confirm/route.ts:104` | `temperatureReq`: coerce boolean→string |
| `supplier/catalog/import/confirm/route.ts:113` | include `id` in tier-price createMany input |
| `lib/ai/pricing-advisor.ts:154,171` | narrow `tier.label` to string |

### P1.2 Mobile: type alignment
- `src/types/index.ts` — `UserRole`: `LOGISTICS` → `SHIPPING`; add `hotelId?: string | null` to `User`.
- `App.tsx` — wrap root in `SafeAreaProvider`; call `enableScreens()`.

### P1.3 Mobile: resilient session restore
`store/auth.ts` `restoreSession` — wrap in try/finally so `isLoading` always resets.

---

## PHASE 2 — Quality Infrastructure

### P2.1 Mobile tooling
- ESLint (expo preset) + Prettier configs; `lint`/`test` scripts.
- Jest + `@testing-library/react-native` smoke tests (auth store, cart store, format utils).
- Global `ErrorBoundary` wrapping root; env-driven `API_BASE` via `app.json` extra + `expo-constants`.

### P2.2 Web CI gates
- CI: add `npm run test:unit` as blocking step; make lint blocking (remove `continue-on-error`).
- Remove legacy `.eslintrc.json` (keep flat `eslint.config.mjs`).
- Scrub `console.log` PII in `contact/route.ts:63`, oliv webhook; route through logger.

### P2.3 Failure hygiene (both repos)
- Empty `catch {}` → capture + user-visible error or typed log (15 mobile sites, API routes).
- `catch (err: any)` → `unknown` + narrowing.
- Loading spinners on 8 mobile data screens; RefreshControl on InvoiceDetailScreen.

---

## PHASE 3 — Feature Completion (operational gaps)

### P3.1 Money UX
- `PaymentScreen` completion (Paymob intent → confirm → receipt) — InvoiceDetail "Pay Now" wired.
- Factoring marketplace + credit-lines browsing + inquire/fund flows (Finance stack).

### P3.2 Ops UX
- Push notifications (`expo-notifications` + notification center).
- AI assistant chat screen (`aiAPI.ask`, role-scoped).
- Supplier catalog: Import (document picker) + AI Upload (`/supplier/ai-upload`), product detail/edit.

### P3.3 Consistency
- Oliv routes → `apiRoute()` + `success()` wrapper parity; persist PDPL `consents` in onboard schema + audit.
- Add `termsAccepted` to mobile register payload + checkbox.

---

## PHASE 4 — Enterprise Elevation

- Accessibility pass: `accessibilityLabel`/`accessibilityRole` on all touchables.
- Order filtering/sorting; reject-reason dialog; supplier rating surfacing.
- Session fingerprint implementation (fortress stubs) or removal of dead layer.
- Observability: structured logger everywhere; Sentry DSN env-gated; audit-log completeness check on all money mutations.
- Deep linking + splash screen + dark/light toggle.

---

## Verification Protocol (every phase close)

1. `npx tsc --noEmit` — both repos, 0 errors.
2. `npm run lint` — web blocking; mobile once configured.
3. `npm run test:unit` — web (CI-blocking); mobile smoke.
4. Money-path audit table review: every payment/factoring/settlement route has auth+RBAC+idempotency+audit (4/4).
5. Findings ledger updated in `INVO_MOBILE_TODO.md` / this doc with FIXED stamps.

## Current Status Legend
- ✅ FIXED: login `accessToken` (CRITICAL-auth), `setRole` removed (CRITICAL-4), cashflow supplierId (HIGH-10), otp-login rate limit (HIGH-11), deposit permission (HIGH-6), 103 mobile tsc errors (react-native-svg), expo-image-picker, app.json permissions, catalog stubs, hotel home icons, product images, order/invoice detail navigation, KYC status screen.
- 🔵 THIS PROGRAM: everything below in Phases 0–4.
