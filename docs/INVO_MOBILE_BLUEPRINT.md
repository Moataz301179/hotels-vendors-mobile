# INVO Mobile App — Blueprint

> **Scope:** `hotels-vendors-mobile` (Expo 57 / RN 0.86 / React Navigation 7 / Zustand 5)
> **Companion backend:** `hotels-vendors` (Next.js 16 / API at `https://www.hotelsvendors.com/api/v1`)
> **Status:** Comprehensive audit complete — screens, APIs, iOS/Android gaps, B2B business model alignment.

---

## 1. Current Feature Inventory

### Auth Flow (screens)
| Screen | File | Status |
|--------|------|--------|
| Login | `src/screens/auth/LoginScreen.tsx` | **PASS** — password + OTP toggle. Emoji-free, clean. |
| Register | `src/screens/auth/RegisterScreen.tsx` | **PASS** — role selector, PhoneInput, email optional, sends to OTP screen. |
| OTP Verify | `src/screens/auth/OtpScreen.tsx` | **PASS** — 6-digit input, resend timer, dual-mode (register/login). |
| OTP Login | `src/screens/auth/OtpLoginScreen.tsx` | **PASS** — phone entry → OTP screen. |

### Hotel Buyer Flow
| Screen | File | Status |
|--------|------|--------|
| Home | `src/screens/hotel/HotelHomeScreen.tsx` | **PARTIAL** — spend stats + quick actions. Uses emoji icons (🛒📦🧾) instead of lucide. No order detail tap handler. |
| Catalog | `src/screens/hotel/CatalogScreen.tsx` | **PARTIAL** — category chips, search, add-to-cart. No product images rendered (field exists in type). Emoji-free but zero icons. |
| Cart | `src/screens/hotel/CartScreen.tsx` | **MINIMAL** — qty adjust, remove, place order. No supplier grouping. No MOQ awareness. |
| Orders | `src/screens/hotel/OrdersScreen.tsx` | **MINIMAL** — list with status badges. **Tap does nothing** (no `onPress`). No filtering/sorting. |
| Invoices | `src/screens/hotel/InvoicesScreen.tsx` | **MINIMAL** — list only. No detail view. No ETA PDF download. No payment. |

### Supplier Flow
| Screen | File | Status |
|--------|------|--------|
| Dashboard | `src/screens/supplier/SupplierDashboardScreen.tsx` | **PASS** — KPIs with icons, recent orders, low stock, GRN list, quick actions. |
| Orders | `src/screens/supplier/SupplierOrdersScreen.tsx` | **PASS** — list + approve/reject buttons + icons. Hardcoded "Supplier rejection" reason. |
| Order Detail | `src/screens/supplier/OrderDetailScreen.tsx` | **PASS** — full detail: items, timeline, tracking, GRN, invoices. Icons throughout. |
| Catalog | `src/screens/supplier/SupplierCatalogScreen.tsx` | **PARTIAL** — category chips, low-stock filter, stock indicators, occupancy. "Import" and "AI Upload" are `console.log` stubs. |
| GRN | `src/screens/supplier/GrnScreen.tsx` | **PASS** — GRN list, vehicle/warehouse display, partial/rejected badges. |
| Profile | `src/screens/supplier/ProfileScreen.tsx` | **PASS** — account, company, notifications, security, logout. Icons throughout. |
| Oliv Activation | `src/screens/supplier/OlivActivationScreen.tsx` | **PASS** — 3-step KYC form, consents, referral code linking to Oliv app/web. |
| Invoice Upload | `src/screens/supplier/InvoiceUploadScreen.tsx` | **PARTIAL** — camera/file picker, ETA UUID input. Uses `require("expo-image-picker")` (NOT installed!). Preview fields are not auto-populated from OCR. |
| Credit Facility | `src/screens/supplier/CreditFacilityScreen.tsx` | **PASS** — utilization gauge, rates, payment schedule. |
| Factoring History | `src/screens/supplier/FactoringHistoryScreen.tsx` | **PASS** — transaction list with status badges. |

### Components
| Component | File | Status |
|-----------|------|--------|
| PhoneInput | `src/components/PhoneInput.tsx` | **PASS** — Egyptian mobile with +20 prefix. |
| AppNavigator | `src/navigation/AppNavigator.tsx` | **PASS** — role-based tabs + stack, lucide icons on all 10 tabs. |

---

## 2. Icon Audit

`lucide-react-native` was installed at session start. Screens were retrofitted:

| Screen | Before | After |
|--------|--------|-------|
| SupplierDashboard | emoji 📊📋📦 | lucide `LayoutDashboard`, `ClipboardList`, `Package`, etc. |
| SupplierOrders | emoji ⏳✅❌ | lucide `Clock`, `Check`, `X`, `User`, `Calendar` |
| SupplierCatalog | emoji 🏷️⚠️📤 | lucide `Tag`, `AlertTriangle`, `FileUp`, `Upload`, `RefreshCw` |
| OrderDetail | emoji 🚚📋📄 | lucide `Truck`, `ClipboardCheck`, `FileText`, `CheckCircle` |
| GrnScreen | emoji ✅📋📦 | lucide `ClipboardCheck`, `Calendar`, `MapPin`, `Package` |
| ProfileScreen | emoji 👤📱📧🏢 | lucide `User`, `Phone`, `Mail`, `Building` |
| AppNavigator | emoji (raw strings) | lucide imports in all 10 tab items |

**Still using emoji icons (gap):**
| Screen | Emoji Icons | Should Be |
|--------|------------|-----------|
| HotelHome | 🛒 📦 🧾 | `ShoppingBasket`, `ClipboardList`, `FileText` |
| LoginScreen | None — uses text links | None needed (links) |

---

## 3. Dependencies Audit

| Package | In package.json? | Used? | Notes |
|--------|-----------------|-------|-------|
| `lucide-react-native` | ✅ | ✅ | Installed at session start. |
| `expo-image-picker` | ❌ **MISSING** | ✅ | Used via `require()` in InvoiceUploadScreen. Will crash on both iOS and Android. |
| `expo-clipboard` | ✅ | ✅ | Used in OlivLinking. |
| `expo-secure-store` | ✅ | ✅ | Auth token storage. |
| `expo-notifications` | ❌ **MISSING** | ❌ | No push notification support anywhere. |
| `@react-native-async-storage/async-storage` | ✅ | ✅ | Used in onboarding.ts. |
| `expo-font` | ✅ | ✅ | PlusJakartaSans font loading. |
| `axios` | ✅ | ✅ | API client. |

---

## 4. iOS / Android Platform Gaps

| Gap | Platform | Severity | Detail |
|-----|----------|----------|--------|
| **Camera permission** | Android | BLOCKING | `InvoiceUploadScreen` calls `requestCameraPermissionsAsync()` but no `<uses-permission android:name="android.permission.CAMERA" />` in app.json. App will fail silently on Android. |
| **Photo library permission** | iOS | BLOCKING | `InvoiceUploadScreen` calls `launchImageLibraryAsync()` but no `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` in app.json iOS config. iOS 14+ will crash. |
| **Missing `expo-image-picker`** | Both | BLOCKING | Not in package.json. `require("expo-image-picker")` will throw at runtime. |
| **No splash screen** | Both | HIGH | `app.json` has no `splash` config. Users see white flash on launch. |
| **No dark mode toggle** | Both | MEDIUM | `userInterfaceStyle: "dark"` is hardcoded. No user preference toggle. |
| **`expo-notifications`** | Both | HIGH | No push notifications. Critical for order status, invoice approval, payment reminders. |
| **Deep linking** | Both | MEDIUM | No `linking` config in app.json. Can't handle deep links from email/SMS for order notifications. |
| **Predictive back gesture** | Android | LOW | `predictiveBackGestureEnabled: false` — should probably be `true` on Android 14+. |

---

## 5. API Coverage Map

### Mobile → Backend Mappings (from `src/api/index.ts`)

| Mobile Client | Backend Endpoint | Status |
|---------------|-----------------|--------|
| `authAPI.login(identifier, password)` | `/auth/login` (POST) | ✅ Backend detects `identifier` field → phone or email login. |
| `authAPI.register(data)` | `/auth/register` (POST) | ✅ Backend detects `phone + otpCode` → mobile registration path. |
| `authAPI.sendOtp(phone)` | `/auth/send-otp` (POST) | ✅ |
| `authAPI.verifyOtp(phone, code)` | `/auth/verify-otp` (POST) | ✅ |
| `authAPI.otpLogin(phone, code)` | `/auth/otp-login` (POST) | ✅ |
| `authAPI.me()` | `/auth/me` (GET) | ✅ |
| `authAPI.logout()` | `/auth/logout` (POST) | ✅ |
| `authAPI.refreshToken()` | `/auth/refresh` (POST) | ✅ |
| `hotelAPI.catalog(params)` | `/hotel/catalog` (GET) | ✅ |
| `hotelAPI.orders(params)` | `/hotel/orders` (GET) | ✅ |
| `hotelAPI.spend()` | `/hotel/spend` (GET) | ✅ |
| `supplierAPI.inventory(params)` | `/supplier/inventory` (GET) | ✅ |
| `supplierAPI.orders(params)` | `/supplier/orders` (GET) | ✅ |
| `supplierAPI.dashboard()` | `/supplier/dashboard` (GET) | ✅ |
| `supplierAPI.order(id)` | `/orders/{id}` (GET) | ⚠️ Backend has `/orders/[id]/route.ts` — shape must match `OrderDetail` interface in OrderDetailScreen. |
| `supplierAPI.grns(params)` | `/grn` (GET) | ✅ Backend has `/grn/route.ts`. |
| `supplierAPI.onboard(data)` | `/supplier/onboard` (POST) | ⚠️ Mobile calls this but `OlivActivationScreen` uses `olivAPI.onboardSupplier()` to `/oliv/onboard-supplier` instead. `supplierAPI.onboard` may be legacy/unused. |
| `productAPI.list(params)` | `/products` (GET) | ✅ |
| `productAPI.get(id)` | `/products/{id}` (GET) | ✅ |
| `orderAPI.create(data)` | `/orders` (POST) | ✅ |
| `orderAPI.get(id)` | `/orders/{id}` (GET) | ✅ |
| `orderAPI.list(params)` | `/orders` (GET) | ✅ |
| `orderAPI.approve(id)` | `/orders/{id}/approve` (POST) | ✅ |
| `orderAPI.reject(id, reason)` | `/orders/{id}/reject` (POST) | ✅ |
| `orderAPI.status(id)` | `/orders/{id}/status` (GET) | ✅ |
| `invoiceAPI.list(params)` | `/invoices` (GET) | ✅ |
| `invoiceAPI.get(id)` | `/invoices/{id}` (GET) | ✅ |
| `paymentAPI.createIntent(data)` | `/payments/create-intent` (POST) | ✅ But no payment UI exists. |
| `aiAPI.ask(message, role)` | `/ai/assistant` (POST) | ✅ But no AI assistant screen. |
| `olivAPI.onboardSupplier(data)` | `/oliv/onboard-supplier` (POST) | ✅ Used by OlivActivationScreen. |
| `olivAPI.initiateFactoring(data)` | `/oliv/initiate-factoring` (POST) | ✅ Used by InvoiceUploadScreen. |
| `fintechAPI.getCreditFacility()` | `/fintech/oliv-facility` (GET) | ✅ Used by CreditFacilityScreen. |
| `fintechAPI.getFactoringHistory()` | `/factoring/requests` (GET) | ✅ Fixed at session start. |
| `fintechAPI.getFactoringInvoices()` | `/factoring/invoices` (GET) | ❌ Not called from any screen. |
| `fintechAPI.getCreditLines()` | `/factoring/credit-lines` (GET) | ❌ Not called from any screen. |
| `fintechAPI.marketplaceOffers()` | `/factoring/marketplace` (GET) | ❌ Not called from any screen. |

### Backend Endpoints NOT Consumed by Mobile

| Backend Route | Purpose | Mobile Gap |
|--------------|---------|------------|
| `/api/v1/oliv/kyc-status` | Check Oliv KYC/activation status | No mobile screen to poll KYC status after onboarding. |
| `/api/v1/oliv/referral` | Referral tracking | Unused. |
| `/api/v1/oliv/webhook` | Oliv webhook receiver | Server-side only. OK. |
| `/api/v1/oliv/payout-callback` | Payout callback | Server-side only. OK. |
| `/api/v1/factoring/inquire` | Submit factoring inquiry | No UI. `fintechAPI.marketplaceOffers()` exists but no marketplace screen. |
| `/api/v1/factoring/fund` | Manual funding trigger | No UI. |
| `/api/v1/factoring/credit-lines` | Credit line offers | `fintechAPI.getCreditLines()` exists but no screen. |
| `/api/v1/payments/create-intent` | Payment intent | `paymentAPI.createIntent()` exists but no payment screen. |
| `/api/v1/payments/deposit` | Deposit for factoring | No UI. |
| `/api/v1/payments/escrow` | Escrow management | No UI. |
| `/api/v1/ai/assistant` | AI chat | `aiAPI.ask()` exists but no chat screen. |
| `/api/v1/supplier/rating` | Supplier performance rating | No rating screen. |
| `/api/v1/supplier/ai-upload` | AI inventory upload | SupplierCatalogScreen "AI Upload" is a `console.log` stub. |
| `/api/v1/supplier/catalog` | Supplier's product catalog | Mobile uses `/products` instead. Should use this for supplier-facing catalog management. |
| `/api/v1/orders/bulk` | Bulk order operations | No UI. |
| `/api/v1/invoices/[id]` | Invoice detail | `invoiceAPI.get(id)` exists but no detail screen. |

---

## 6. Business Model Alignment

The mobile app covers the core procurement flow:
```
Browse Catalog → Add to Cart → Place Order → Track Order → View Invoice
```

**Hotel Buyer (HOTEL role):**
- ✅ Catalog browsing with search and categories
- ✅ Cart with quantity management
- ✅ Order placement (submit for approval)
- ✅ Order list with status tracking
- ⚠️ **No order detail view** — OrdersScreen items are not tappable
- ⚠️ **No invoice detail or payment** — can only see list
- ⚠️ **No ETA-compliant invoice download/share**
- ❌ **No PO/requisition workflow** — hotels can't create POs before ordering
- ❌ **No supplier communication/chat**

**Supplier (SUPPLIER role):**
- ✅ Dashboard with KPIs and quick actions
- ✅ Order list with approve/reject
- ✅ Order detail with timeline, tracking, GRN, invoices
- ✅ Catalog with inventory management
- ✅ GRN list
- ✅ Oliv KYC onboarding
- ✅ Invoice upload for factoring
- ✅ Credit facility view
- ✅ Factoring history
- ⚠️ **No KYC status tracking** — after submission, no way to check status
- ⚠️ **No marketplace browsing** — can't see credit line offers or factoring marketplace
- ⚠️ **No payment/deposit screen** — can't receive payments or manage deposits
- ⚠️ **"Import" and "AI Upload"** in catalog are stubs
- ❌ **No AI assistant chat**
- ❌ **No notification center**
- ❌ **No supplier rating/review** visibility

**Business Model Revenue Stream Alignment:**
| Revenue Stream | Mobile Coverage | Gap |
|---------------|----------------|-----|
| Transaction fees (1.5–2.5%) | ✅ Visible in order totals | No fee disclosure to users |
| Supplier subscriptions | ❌ | No subscription UI |
| Sponsored listings | ❌ | No supplier marketing tools |
| Logistics markup | ✅ Implicit in shipping cost | No logistics tracking deep-link |
| Factoring spread | ✅ Invoice upload visible | No marketplace/inquire UI |
| ETA compliance SaaS | ✅ ETA UUID required | No ETA PDF generation/download in mobile |
| Data insights | ⚠️ Basic KPIs only | No analytics dashboard |

---

## 7. Code Quality & Best Practices

### Issues Found
| Issue | File(s) | Severity |
|-------|---------|----------|
| `require("expo-image-picker")` instead of import | `InvoiceUploadScreen.tsx` | HIGH — module not installed |
| `expo-image-picker` not in package.json | — | BLOCKING |
| `console.log("...")` stubs | `SupplierCatalogScreen.tsx` lines 195, 206-207, 208-210 | MEDIUM |
| Relative asset paths | `LoginScreen`, `RegisterScreen` | `require("../../../assets/...")` | MEDIUM |
| `useRoute<any>()` / `useNavigation<any>()` | `OtpScreen`, various | MEDIUM — loose typing |
| Hardcoded API base URL | `src/api/index.ts:9` | MEDIUM — no env var for staging |
| No `.eslintignore` or lint script | No ESLint in mobile package.json | LOW |
| No test framework | No tests anywhere | LOW |
| `Image` imported but unused | `CatalogScreen.tsx:7` | LOW |
| Hardcoded status strings in SupplierOrdersScreen | `canApprove` checks `"PENDING_APPROVAL"`, `"CONFIRMED"` | MEDIUM — should use constants |

### Best Practices Already Followed
- ✅ TypeScript strict mode enabled
- ✅ Zustand 5 for state management (not Redux)
- ✅ `expo-secure-store` for token storage
- ✅ JWT refresh token flow implemented
- ✅ API response wrapper pattern (`{ success, data, error }`)
- ✅ Theme tokens centralized in `src/theme/index.ts`
- ✅ Role-based navigation (auth store drives routing)
- ✅ `KeyboardAvoidingView` on auth forms
- ✅ `RefreshControl` on list screens
- ✅ `ActivityIndicator` loading states
- ✅ Error boundaries via try/catch + Alert

---

## 8. Gap Summary by Priority

### P0 — Blocking (app will crash or not function)
1. Install `expo-image-picker` (missing dependency)
2. Add Android camera + iOS photo library permissions to `app.json`
3. Remove `console.log` stubs and wire up real actions

### P1 — High (user-facing feature gaps)
4. Hotel Home: replace emoji quick action icons with lucide
5. Hotel Orders: add `onPress` handler → navigate to order detail
6. Hotel Invoices: add invoice detail view (tap to view, with ETA status and download)
7. Hotel Catalog: render product images
8. Add KYC status tracking screen for suppliers (poll `/api/v1/oliv/kyc-status`)
9. Add payment screen (hotel paying invoice / supplier receiving payout via `/payments/create-intent`)

### P2 — Medium (UX / completeness)
10. Add notification center + install `expo-notifications`
11. Add AI assistant chat screen (`aiAPI.ask`)
12. Wire up Supplier Catalog "Import" and "AI Upload" actions
13. Add supplier marketplace browsing (credit lines, factoring marketplace)
14. Add order filtering/sorting (hotel orders, supplier orders)
15. Add supplier rating/review visibility
16. Replace hardcoded approve/reject reason with input dialog

### P3 — Low (nice-to-have)
17. Add splash screen config to `app.json`
18. Add dark mode toggle (respect user preference)
19. Set up deep linking for push notification navigation
20. Enable Android predictive back gesture
21. Add offline data caching for catalogs/orders
22. Add bulk order operations (supplier)
23. Add analytics/insights dashboard

---

## 9. Recommended Todo List (Prioritized)

See `docs/INVO_MOBILE_TODO.md` for the interactive prioritized list.
