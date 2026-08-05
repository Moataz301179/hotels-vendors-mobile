/**
 * Phone helpers — Egyptian mobile numbers
 */

export function normalizePhone(input: string): string {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  if (digits.startsWith("01") && !digits.startsWith("+")) digits = "+20" + digits.slice(1);
  if (/^(10|11|12|15)/.test(digits)) digits = "+20" + digits;
  if (digits.startsWith("20") && !digits.startsWith("+")) digits = "+" + digits;
  return digits;
}

export function isValidEgyptianPhone(input: string): boolean {
  return /^\+20(10|11|12|15)\d{8}$/.test(normalizePhone(input));
}
