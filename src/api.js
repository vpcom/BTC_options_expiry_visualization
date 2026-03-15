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

export async function fetchQuoteDepths(symbols) {
  const uniqueSymbols = [...new Set(symbols.filter(Boolean))];

  const results = await Promise.allSettled(
    uniqueSymbols.map(async (symbol) => {
      const depth = await getJson(
        `${API_BASE}/eapi/v1/depth?symbol=${encodeURIComponent(symbol)}&limit=10`,
      );
      const [bid, bidQty] = depth.bids?.[0] ?? [null, null];
      const [ask, askQty] = depth.asks?.[0] ?? [null, null];

      return [
        symbol,
        {
          bid: bid == null ? null : Number(bid),
          bidQty: bidQty == null ? null : Number(bidQty),
          ask: ask == null ? null : Number(ask),
          askQty: askQty == null ? null : Number(askQty),
        },
      ];
    }),
  );

  const quotesBySymbol = new Map();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;

    const [symbol, quote] = result.value;
    quotesBySymbol.set(symbol, quote);
  }

  return quotesBySymbol;
}
