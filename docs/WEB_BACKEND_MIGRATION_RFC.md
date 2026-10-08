# Native app / web backend migration RFC

**Status:** Decision required before auth or API code changes

## Evidence

The new web backend authenticates requests with Clerk via `getActor()` and exposes maintained operations under `/api/v2`. The native app currently stores custom `access_token` / `refresh_token` values and calls `/api/v1`.

These are two different security and contract systems. Changing the URL to `/api/v2` would not make the app compatible: the backend expects Clerk identity and tenant-derived authorization, while the app currently sends a legacy JWT.

## Recommended direction

Use Clerk's Expo/native integration in the mobile app. Send the Clerk session token as a bearer token to the shared web backend, then map native operations to the existing `/api/v2` routes. Remove the legacy refresh-token flow only after all native screens have been migrated and tested.

## Required gates

1. Add Clerk Expo configuration without committing secrets.
2. Verify the Clerk token is accepted by the web middleware and `getActor()`.
3. Create a route map for each native operation: `catalog`, `orders`, `demand`, `grn`, `marketplace`, `dashboard`, `onboarding`, `shipments`, and `me`.
4. Add request/response contract tests against a non-production environment.
5. Migrate screens incrementally and remove legacy `/api/v1` calls only after parity is proven.

## Not acceptable

- Pointing the app at `/api/v2` without changing authentication.
- Creating duplicate `/api/v1` routes solely to hide the mismatch.
- Deploying a native build before a real authenticated request succeeds against the new backend.
