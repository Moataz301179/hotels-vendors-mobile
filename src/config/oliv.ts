/**
 * Oliv integration config.
 *
 * When Oliv ships the native app deep link, set `appScheme` (e.g. "oliv")
 * and any custom prefill param names — no other code changes needed.
 */
export const OLIV = {
  referralCode: "CHV000",
  applyUrl: "https://oliv.finance/apply",
  source: "hotelsvendors",
  appScheme: "",
  prefillParams: {
    ref: "ref",
    phone: "phone",
    name: "name",
    email: "email",
  },
};
