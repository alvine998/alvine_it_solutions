// Keep only digits — these inputs are whole numbers (IDR amounts, quantities,
// percentages), so no decimal point or minus sign is ever allowed.
export function stripNonNumeric(value: string): string {
  return value.replace(/[^\d]/g, "");
}

// Display value for a number input: insert thousands separators (id-ID grouping).
export function formatNumberInput(value: number | string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const negative = raw.startsWith("-");
  const digits = raw.replace(/[^\d]/g, "");
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (negative ? "-" : "") + grouped;
}

// Parse a formatted display value back into a number.
export function parseNumberInput(value: string): number {
  const normalized = value.replace(/\./g, "");
  return Number(normalized);
}
