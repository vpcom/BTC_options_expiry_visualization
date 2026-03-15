function toNumber(value) {
  if (value == null || value === "") return null;

  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function makeCallAndPutTags(side, strike, indexPrice) {
  if (side === "CALL") return strike < indexPrice ? "ITM" : "OTM";
  if (side === "PUT") return strike > indexPrice ? "ITM" : "OTM";
  return "";
}

const TARGET_NEXT_FRIDAY_UTC = Date.UTC(2026, 2, 20, 8, 0, 0, 0);

// Create rows objects, values, flags and summary info.
export function transformApiData(rawSymbols, baseCoin, indexPrice) {
  const symbols = rawSymbols.filter(
    (s) => s.underlying === `${baseCoin}USDT` && s.status === "TRADING",
  );

  if (!symbols.length) {
    return {
      targetExpiry: null,
      atmStrike: null,
      rows: [],
    };
  }

  const targetExpiry = symbols.some(
    (symbol) => toNumber(symbol.expiryDate) === TARGET_NEXT_FRIDAY_UTC,
  )
    ? TARGET_NEXT_FRIDAY_UTC
    : null;

  if (!targetExpiry) {
    return {
      targetExpiry: null,
      atmStrike: null,
      rows: [],
    };
  }

  const rowsMap = new Map();

  for (const raw of symbols) {
    const strike = toNumber(raw.strikePrice);
    const expiry = toNumber(raw.expiryDate);
    if (expiry !== targetExpiry) continue;
    const option = {
      symbol: raw.symbol,
      side: raw.side,
      strike,
      distToPrice: indexPrice ? (strike - indexPrice) / indexPrice : null,
      tag: makeCallAndPutTags(raw.side, strike, indexPrice),
      bid: null,
      bidQty: null,
      ask: null,
      askQty: null,
    };
    if (!rowsMap.has(strike)) {
      rowsMap.set(strike, {
        strike,
        call: null,
        put: null,
      });
    }
    const row = rowsMap.get(strike);
    if (raw.side === "CALL") {
      row.call = option;
    }
    if (raw.side === "PUT") {
      row.put = option;
    }
  }

  // sort rows from lowest on top to highest strike at bottom
  const rows = [...rowsMap.values()].sort((a, b) => a.strike - b.strike);

  // finding ATM strike
  let atmStrike = null;
  let bestDiff = Infinity;

  // The row with smallest difference to index price is ATM.
  for (const row of rows) {
    const diff = Math.abs(row.strike - indexPrice);

    if (diff < bestDiff) {
      bestDiff = diff;
      atmStrike = row.strike;
    }
  }

  // Marking ATM option row
  for (const row of rows) {
    row.isATM = row.strike === atmStrike;
  }

  return {
    targetExpiry,
    atmStrike,
    rows,
  };
}
