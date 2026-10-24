import { useEffect, type ReactNode } from "react";
import { useAuth } from "@clerk/expo";

import { registerClerkTokenGetter } from "@/auth/clerk-v2-token";

/** Keeps the v2 API client tied to Clerk's live, refreshable device session. */
export function ClerkSessionBridge({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      registerClerkTokenGetter(null);
      return () => registerClerkTokenGetter(null);
    }

    registerClerkTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
    return () => registerClerkTokenGetter(null);
  }, [getToken, isLoaded, isSignedIn]);

  return <>{children}</>;
}
