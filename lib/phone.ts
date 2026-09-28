export const BOLIVIA_DIAL_CODE = "591";

/**
 * Normalizes a phone number to international digits for wa.me links.
 * - "71234567", "7123-4567", "(591) 71234567", "+591 7 123 4567" -> "59171234567"
 * - "0059171234567" -> "59171234567"
 * - Foreign numbers typed with "+" and country code are kept as-is.
 * Returns null when the number cannot be a valid WhatsApp number.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  // Local Bolivian mobile (8 digits starting with 6 or 7) or landline (7-8 digits).
  if (digits.length === 8 || digits.length === 7) {
    return `${BOLIVIA_DIAL_CODE}${digits}`;
  }
  if (digits.startsWith(BOLIVIA_DIAL_CODE) && (digits.length === 11 || digits.length === 10)) {
    return digits;
  }
  // International number (E.164 allows up to 15 digits).
  if ((trimmed.startsWith("+") || trimmed.startsWith("00")) && digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  return null;
}

export function isValidPhone(input: string | null | undefined): boolean {
  return normalizePhone(input) !== null;
}

/** "+591 7123 4567" */
export function formatPhone(input: string | null | undefined): string {
  if (!input) return "—";
  const n = normalizePhone(input);
  if (!n) return input;
  if (n.startsWith(BOLIVIA_DIAL_CODE) && n.length === 11) {
    const local = n.slice(3);
    return `+591 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  return `+${n}`;
}
