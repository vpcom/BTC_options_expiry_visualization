export function formatPrice(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return "-";

  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatStrike(value) {
  if (value == null || Number.isNaN(value)) return "-";

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}
