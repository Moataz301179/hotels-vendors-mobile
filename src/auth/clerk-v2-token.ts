type ClerkTokenGetter = () => Promise<string | null>;

let activeTokenGetter: ClerkTokenGetter | null = null;

/**
 * The Clerk SDK owns session persistence. Keep only a live getter here so a
 * v2 request always uses a fresh session token rather than a copied token in
 * application storage.
 */
export function registerClerkTokenGetter(getter: ClerkTokenGetter | null) {
  activeTokenGetter = getter;
}

export async function getClerkV2Token() {
  return activeTokenGetter ? activeTokenGetter() : null;
}
