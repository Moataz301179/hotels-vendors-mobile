/**
 * Oliv CTA linker — opens the Oliv app (when a scheme is configured) or the
 * Oliv web onboarding, pre-filled with the HotelsVendors referral code and
 * the user's phone. Always copies the referral code + phone to the clipboard
 * as a paste fallback for the Oliv onboarding form.
 */

import { Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import { OLIV } from "@/config/oliv";

export interface OlivPrefill {
  phone?: string;
  name?: string;
  email?: string;
}

export function buildOlivUrl(prefill: OlivPrefill): string {
  const params: string[] = [];
  const push = (key: string, value: string | undefined) => {
    if (value) params.push(`${key}=${encodeURIComponent(value)}`);
  };

  push(OLIV.prefillParams.ref, OLIV.referralCode);
  push("source", OLIV.source);
  push(OLIV.prefillParams.phone, prefill.phone);
  push(OLIV.prefillParams.name, prefill.name);
  push(OLIV.prefillParams.email, prefill.email);

  const query = params.join("&");
  if (OLIV.appScheme) {
    return `${OLIV.appScheme}://onboard${query ? `?${query}` : ""}`;
  }
  return `${OLIV.applyUrl}${query ? `?${query}` : ""}`;
}

export async function openOlivOnboarding(prefill: OlivPrefill): Promise<void> {
  const clipboardText = [
    `Referral code: ${OLIV.referralCode}`,
    prefill.phone ? `Phone number: ${prefill.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await Clipboard.setStringAsync(clipboardText);
  } catch {}

  const url = buildOlivUrl(prefill);

  if (OLIV.appScheme) {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {}
  }

  await Linking.openURL(url);
}
