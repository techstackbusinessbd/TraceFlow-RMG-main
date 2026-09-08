/**
 * Formats phone numbers (BD mobile, IP telephony, Landline, or International) into a readable format.
 * Examples:
 *  - "+8809666778833" -> "+880 9666-778833"
 *  - "+8801712345678" -> "+880 1712-345678"
 *  - "01712345678"    -> "01712-345678"
 *  - "09666778833"    -> "09666-778833"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";

  const trimmed = phone.trim();

  // Pattern 1: +880 IP Telephony e.g. +8809666778833 -> +880 9666-778833
  const bdIpRegex = /^(\+880)(9\d{3})(\d{6})$/;
  if (bdIpRegex.test(trimmed)) {
    return trimmed.replace(bdIpRegex, "$1 $2-$3");
  }

  // Pattern 2: +880 Mobile e.g. +8801712345678 -> +880 1712-345678
  const bdMobileRegex = /^(\+880)(1\d{3})(\d{6})$/;
  if (bdMobileRegex.test(trimmed)) {
    return trimmed.replace(bdMobileRegex, "$1 $2-$3");
  }

  // Pattern 3: Local Mobile e.g. 01712345678 -> 01712-345678
  const localMobileRegex = /^(01\d{3})(\d{6})$/;
  if (localMobileRegex.test(trimmed)) {
    return trimmed.replace(localMobileRegex, "$1-$2");
  }

  // Pattern 4: Local IP e.g. 09666778833 -> 09666-778833
  const localIpRegex = /^(09\d{3})(\d{6})$/;
  if (localIpRegex.test(trimmed)) {
    return trimmed.replace(localIpRegex, "$1-$2");
  }

  // Pattern 5: +880 Landline e.g. +88029876543 -> +880 2-9876543
  const bdLandlineRegex = /^(\+880)(2)(\d{7,8})$/;
  if (bdLandlineRegex.test(trimmed)) {
    return trimmed.replace(bdLandlineRegex, "$1 $2-$3");
  }

  return trimmed;
}
