# HOVIN controlled receiving: release gates

**Status:** feature-branch implementation only; no production, App Store, or Google Play release.

## Source selection

The working candidate is the standalone `Moataz301179/hotels-vendors-mobile` Expo/EAS repository. The duplicate `mobile/` app in platform PR #46 is unverified and has not been deleted or published. Canonical-source selection remains pending Grok/product reconciliation; this branch is not authority to retire either source.

The current mobile repository head when this work began was `e7345f8f928f749301a0d4be455b6a9b62dbcbb0` (2026-10-24). This feature branch was created from that commit. No `AGENTS.md` was present at the repository root or in the source directories checked.

## Implemented on this branch

- Clerk-authenticated GET of the server-filtered receipt context from `/api/v2/mobile/receipts/[orderId]`.
- The hotel Orders screen can open a controlled receipt draft for in-transit or partially delivered orders. The server remains authoritative for role, permission, tenant, payment-guarantee, and status checks.
- The receipt screen only displays the PO number, product identity, unit, and quantities. It does not display supplier, price, invoice, or financing data.
- Client validation covers the current receipt contract: every PO line exactly once, integer quantities, no over-receipt, accepted quantity no greater than received, a reason for damaged/rejected items, and a positive total received quantity.
- Quantities and photo URI references can be saved as an account-and-order scoped local draft in SecureStore. A draft is visibly labelled local and never presented as a submitted receipt or GRN.
- A small Node built-in test suite covers the pure draft validation and variance logic.

## Integration remains blocked

The current screen intentionally has no receipt POST or automatic retry. The receiving POST endpoint currently lacks server-side idempotency and photo-upload storage. Evidence URLs are accepted only after upload, but no upload endpoint/client contract is available. A web feature branch has staged an idempotency proposal, but it is unmerged and unverified; it does not unblock this client.

Photo URIs are local ImagePicker cache references. SecureStore persists the references, not the image bytes; operating-system cache cleanup can remove the photos. Do not describe this as durable evidence or sync-ready offline receiving. Before sync is implemented, define and verify an app-private durable media store, upload endpoint, allowed file types/size, authorization, retention, and cleanup behavior.

The existing receipt context GET response shape is:

```ts
{
  order: {
    id, orderNumber, status, paymentGuaranteed, estimatedDelivery, currency,
    canRecordReceipt,
    items: [{
      id, quantity, receivedQuantity, remainingQuantity,
      product: { id, name, sku, unitOfMeasure }
    }]
  },
  receiptEndpoint: "/api/v2/grn"
}
```

The known POST body contract is `{ orderId, lines, evidenceUrls? }`, with one line per PO item and `{ orderItemId, receivedQuantity, acceptedQuantity, rejectionReason?, batchNumber?, expiryDate?, conditionNotes? }`. Require an explicit stable idempotency-key contract and reuse it for retries only after a server implementation is merged, tested, and available to the intended environment. Reconcile the final acceptance/ETA clearance path before enabling final delivery sync.

## Android and iOS gates

Both platforms must pass authenticated role/tenant tests; verify that unauthorized users cannot fetch the PO context; preserve price/financing exclusion; test all quantity and variance boundaries; prove offline draft recovery without claiming server acceptance; and verify replay-safe sync, evidence upload, audit attribution, and discrepancy approval against the real backend.

- **Android:** build a signed AAB on the intended release commit; verify package identity, monotonically increasing store version, existing signing continuity, runtime camera/photo permissions, and receiving workflow on emulator and physical device.
- **iOS:** build and sign the intended bundle; verify provisioning/bundle identity, camera/photo permission prompts, and receiving workflow on simulator and physical device. Complete TestFlight acceptance before any App Store submission.
- Record build IDs, commit SHA, device/OS, test results, and store state. Do not claim store publication without actual Play Console/App Store evidence.

## Credential hygiene gate

A tracked QA report in the repository contains signing material. Treat it as exposed. Redact the credential from the tracked report/history as appropriate and have the signing owner assess rotation before any release. This feature branch does not reproduce that material, remove or replace signing keys, or change signing configuration.
