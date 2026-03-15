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

export function formatExpiry(timeStamp) {
  if (!timeStamp) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timeStamp));
}

export function formatCountdown(expiryTimestamp) {
  if (!expiryTimestamp) return "-";

  const diff = expiryTimestamp - Date.now();

  if (diff <= 0) return "Expired";

  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;

  return `${mins}m ${secs}s`;
}

export function formatQty(value) {
  if (value == null || Number.isNaN(value)) return "-";

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

export function formatOptionPrice(value) {
  if (value == null || Number.isNaN(value)) return "-";

  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
