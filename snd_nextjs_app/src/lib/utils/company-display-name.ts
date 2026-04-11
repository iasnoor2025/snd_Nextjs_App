/** Default max length for compact company/party labels in tables and reports */
const DEFAULT_MAX = 40;

/** Tighter cap for dense report columns (reduces overflow with bilingual names) */
export const COMPANY_SHORT_REPORT_MAX = 28;

/**
 * Short label for bilingual or long company names: use the segment before
 * `-`, en-dash, em-dash, or `|` (typically English before Arabic), then trim length.
 */
export function shortCompanyOrPartyName(
  name: string | null | undefined,
  maxLen: number = DEFAULT_MAX
): string {
  if (name == null) return '';
  const trimmed = String(name).trim();
  if (!trimmed) return '';

  const segments = trimmed.split(/[-–—|]/);
  const primary = (segments[0] ?? trimmed).trim();
  if (!primary) return '';

  if (primary.length <= maxLen) return primary;
  return `${primary.slice(0, maxLen - 3).trim()}...`;
}
