type ClerkTokenGetter = () => Promise<string | null>;

let tokenGetter: ClerkTokenGetter | null = null;

export function setClerkTokenGetter(getter: ClerkTokenGetter | null) {
  tokenGetter = getter;
}

export async function getClerkToken() {
  return tokenGetter ? tokenGetter() : null;
}
