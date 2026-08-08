/**
 * Oliv Finance integration config.
 *
 * Phase 1: Referral URL generation (hotel/supplier apply via Oliv web)
 * Phase 2: API factoring submission + status tracking (see olivAPI in @/api)
 * Deep links: oliv://kyc, oliv://payment, oliv://credit-line
 */
export const OLIV = {
  referralCode: "CHV000",
  applyUrl: "https://oliv.finance/apply",
  source: "hotelsvendors",
  /** Deep link scheme registered in app.config.js linking.prefixes */
  appScheme: "oliv",
  /** Oliv deep link path mappings */
  deepLinks: {
    kyc: "oliv://kyc",
    payment: "oliv://payment",
    creditLine: "oliv://credit-line",
  },
  prefillParams: {
    ref: "ref",
    phone: "phone",
    name: "name",
    email: "email",
  },
};

/** Generate an Oliv referral URL with supplier id prefill */
export function olivReferralUrl(supplierId: string, phone?: string): string {
  const params = new URLSearchParams({
    ref: OLIV.referralCode,
    source: OLIV.source,
  });
  if (phone) params.set(OLIV.prefillParams.phone, phone);
  return `${OLIV.applyUrl}?${params.toString()}`;
}