# INVO Mobile App — Prioritized Todo List

> Source: `docs/INVO_MOBILE_BLUEPRINT.md` — audit complete.
> Priority legend: **P0** Blocking • **P1** High • **P2** Medium • **P3** Low

---

## P0 — Blocking (app will crash or not function)

### P0-1. Install `expo-image-picker`

**Problem:** `InvoiceUploadScreen.tsx` calls `require("expo-image-picker")` at runtime. The package is NOT in `package.json`. The app will crash on both iOS and Android when the user taps "Upload File" or "Take Photo".

**Action:**
```bash
cd hotels-vendors-mobile
npx expo install expo-image-picker
```
Then update `InvoiceUploadScreen.tsx` to use a proper import instead of `require()`.

**File:** `src/screens/supplier/InvoiceUploadScreen.tsx:27,44`

---

### P0-2. Add camera and photo library permissions to `app.json`

**Problem:** `InvoiceUploadScreen` calls `ImagePicker.requestCameraPermissionsAsync()` and `ImagePicker.launchImageLibraryAsync()`. iOS will crash without `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription`. Android will fail silently without `<uses-permission android:name="android.permission.CAMERA" />` and `<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />`.

**Action:** Add to `app.json`:
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.hotelsvendors.invo",
  "infoPlist": {
    "NSCameraUsageDescription": "INVO needs camera access to photograph invoices for financing.",
    "NSPhotoLibraryUsageDescription": "INVO needs photo library access to select invoice images."
  }
},
"android": {
  "package": "com.hotelsvendors.invo",
  "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
}
```

**File:** `app.json`

---

### P0-3. Remove `console.log` stubs and wire up real actions in SupplierCatalogScreen

**Problem:** Three actions in the catalog action bar / empty state are `console.log` stubs:
- Line 195: `console.log("Catalog import not yet implemented")`
- Lines 206–207: `console.log("AI upload not implemented")`

**Action:**
- Replace `console.log` with `Alert.alert` messages indicating "Coming soon"
- OR wire up to backend `/api/v1/supplier/ai-upload` for AI upload
- OR navigate to a dedicated import screen

**File:** `src/screens/supplier/SupplierCatalogScreen.tsx:195,207,214-215`

---

## P1 — High (user-facing feature gaps)

### P1-1. Replace emoji icons in HotelHomeScreen with lucide-react-native

**Done:** ✅ Completed — emoji icons replaced with `ShoppingBasket`, `ClipboardList`, `FileText`.

**File:** `src/screens/hotel/HotelHomeScreen.tsx`

---

### P1-2. Add order detail navigation from HotelOrdersScreen

**Done:** ✅ Completed — order cards now navigate to `OrderDetail` with the order ID.

**Files:** `src/screens/hotel/OrdersScreen.tsx`, `src/navigation/AppNavigator.tsx`

---

### P1-3. Add invoice detail view for Hotel buyer

**Done:** ✅ Completed — `InvoiceDetailScreen` created with invoice details, line items, ETA status, VAT, Pay Now button (navigates to PaymentScreen), and Download ETA PDF. Added to navigator.

**Files:** `src/screens/hotel/InvoiceDetailScreen.tsx`, `src/navigation/AppNavigator.tsx`

---

### P1-4. Render product images in Hotel CatalogScreen

**Done:** ✅ Completed — product images rendered with `<Image>` + placeholder fallback.

**File:** `src/screens/hotel/CatalogScreen.tsx`

---

### P1-5. Add KYC status tracking screen for Oliv onboarding

**Done:** ✅ Completed — `OlivKycStatusScreen` created showing KYC progress steps, facility info, tenant-gated. `olivAPI.getKycStatus()` added. Added to FinanceStack.

**Files:** `src/api/index.ts`, `src/screens/supplier/OlivKycStatusScreen.tsx`, `src/navigation/AppNavigator.tsx`

---

### P1-6. Add payment screen for hotel invoice payment

**Backend:** `/api/v1/payments/create-intent` endpoint exists. `paymentAPI.createIntent()` exists in API client.

**Done:** ✅ `PaymentScreen` created — calls `paymentAPI.createIntent` with Paymob-compatible payload (firstName, lastName, email, phone, referenceType, referenceId), opens Paymob iframe via `expo-web-browser`, handles `invo://payment-success` / `invo://payment-cancel` deep-link callbacks. Added `PaymentIntentRequest` type to API client. `InvoiceDetailScreen` "Pay Now" now navigates to `PaymentScreen` with `{ invoiceId, amount, currency, invoiceNumber }`.

**Files:** `src/screens/hotel/PaymentScreen.tsx` (NEW), `src/api/index.ts` (updated), `src/screens/hotel/InvoiceDetailScreen.tsx` (updated), `src/navigation/AppNavigator.tsx` (updated)

---

## P2 — Medium (UX & completeness)

### P2-1. Install `expo-notifications` and add notification center

**Done:** ✅ Completed — `expo-notifications` + `expo-device` installed, `NotificationService` created (permission request, push token registration, deep-link callback handling), `useNotificationStore` Zustand store for in-app notifications, `NotificationCenterScreen` with mark-read/clear-all, notification permissions added to `app.json`. Initialized in `App.tsx`. Added `NotificationCenter` to both Hotel and Supplier stacks.

**Files:** `app.json`, `src/services/notifications.ts` (NEW), `src/store/notifications.ts` (NEW), `src/screens/NotificationCenterScreen.tsx` (NEW), `src/navigation/AppNavigator.tsx`, `App.tsx`

---

### P2-2. Add AI assistant chat screen

**Done:** ✅ Completed — `AiAssistantScreen` created with chat UI, SSE streaming response parsing, role-specific prompts (from auth store role), message history. Added to both Hotel and Supplier tab bars as "Assistant" tab. `aiAPI.ask()` updated to send streaming-compatible payload.

**Files:** `src/screens/AiAssistantScreen.tsx` (NEW), `src/api/index.ts`, `src/navigation/AppNavigator.tsx`

---

### P2-3. Wire up Supplier Catalog "Import" and "AI Upload" actions

**Done:** ✅ Completed — "Import" now uses `expo-document-picker` to pick Excel/CSV files and calls `supplierAPI.catalogImport()` which calls `/api/v1/supplier/catalog/import`. "AI Upload" uses `expo-document-picker` to pick images and calls `supplierAPI.aiUpload()` which calls `/api/v1/supplier/ai-upload`. Added "Download Template" button to fetch the Excel template. Product detail now shows an alert with SKU/price/stock. Installed `expo-document-picker`.

**Files:** `src/screens/supplier/SupplierCatalogScreen.tsx`, `src/api/index.ts`

---

### P2-4. Add supplier marketplace / credit lines browsing

**Done:** ✅ Completed — `MarketplaceScreen` created with tabbed view (Marketplace / Credit Lines), showing factoring invoices available for advance and credit line applications. `FactoringOfferDetailScreen` shows best offer + all offers with terms, "Accept & Fund" button calls `/factoring/fund`. Updated `fintechAPI` with `inquireFactoring`, `triggerFunding`. Added to Finance stack.

**Files:** `src/screens/supplier/MarketplaceScreen.tsx` (NEW), `src/screens/supplier/FactoringOfferDetailScreen.tsx` (NEW), `src/api/index.ts`, `src/navigation/AppNavigator.tsx`

---

### P2-5. Add order filtering and sorting

**Problem:** Order lists (HotelOrders, SupplierOrders) have no filter/sort options.

**Action:**
1. Add filter bar (by status: All / Pending / Approved / In Transit / Delivered)
2. Add sort options (date desc, amount desc)
3. Apply to both HotelOrders and SupplierOrders

**Files:** `src/screens/hotel/OrdersScreen.tsx`, `src/screens/supplier/SupplierOrdersScreen.tsx`

---

### P2-6. Replace hardcoded approve/reject reason with input dialog

**Problem:** `SupplierOrdersScreen` calls `orderAPI.reject(orderId, "Supplier rejection")` with a hardcoded reason.

**Action:** Before calling reject, show an `Alert.prompt` or modal for the supplier to enter a reason.

**File:** `src/screens/supplier/SupplierOrdersScreen.tsx:54-57`

---

### P2-7. Add supplier rating/review visibility

**Backend:** `/api/v1/supplier/rating` endpoint exists.

**Problem:** No mobile UI for supplier ratings.

**Action:**
1. Add `getRating` to `supplierAPI` in `src/api/index.ts`
2. Display average rating and review count on supplier dashboard and profile

**Files:** `src/api/index.ts`, `src/screens/supplier/SupplierDashboardScreen.tsx`, `src/screens/supplier/ProfileScreen.tsx`

---

## P3 — Low (polish & infrastructure)

### P3-1. Add splash screen to app.json
```json
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#0A0E1A"
}
```

---

### P3-2. Add dark mode / light mode toggle
Respect `useWindowDimensions` or system preference instead of hardcoding `userInterfaceStyle: "dark"`.

---

### P3-3. Configure deep linking
Add `linking` config to `app.json` so push notifications and emails can navigate to specific orders/invoices.

---

### P3-4. Enable Android predictive back gesture
Set `"predictiveBackGestureEnabled": true` (Android 14+).

---

### P3-5. Add offline data caching
Cache catalog and order data locally using `@react-native-async-storage/async-storage` so the app shows data before the API call completes.

---

### P3-6. Add bulk order operations for suppliers
Backend has `/orders/bulk` — add bulk approve/reject to SupplierOrdersScreen.

---

### P3-7. Add analytics/insights dashboard
Beyond basic KPI cards, add a chart view showing revenue trends, order volume, and supplier performance metrics.

---

### P3-8. Add supplier catalog product detail/edit view
Currently `SupplierCatalogScreen` only navigates to `console.log("Product detail: ...")`. Add a proper product detail screen with edit capability.

---

## Execution Order Recommendation

1. **P0-1, P0-2, P0-3** — Fix crashes and stubs (2–3 hours)
2. **P1-1, P1-4** — Quick visual polish (1 hour)
3. **P1-2, P1-3** — Core feature gaps: order detail + invoice detail (4–6 hours)
4. **P1-5, P1-6** — Financing + payment flows (4–6 hours)
5. **P2-2, P2-3** — AI assistant + catalog actions (4–5 hours)
6. **P2-1, P2-4, P2-5, P2-6, P2-7** — Notifications, marketplace, filters (6–8 hours)
7. **P3-1…P3-8** — Polish and infrastructure (ongoing, background)
