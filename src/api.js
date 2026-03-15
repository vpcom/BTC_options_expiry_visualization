const API_BASE = "/api/binance";

async function getJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

export async function fetchData() {
  const underlyingAsset = "BTCUSDT";

  const [exchangeInfo, indexInfo] = await Promise.all([
    getJson(`${API_BASE}/eapi/v1/exchangeInfo`),
    getJson(
      `${API_BASE}/eapi/v1/index?underlying=${encodeURIComponent(underlyingAsset)}`,
    ),
  ]);

  return {
    fetchedAt: Date.now(),
    underlyingAsset,
    indexPrice: Number(indexInfo.indexPrice),
    symbols: exchangeInfo.optionSymbols || [],
  };
}
