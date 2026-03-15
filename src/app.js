import { fetchData } from "./api.js";
import { transformApiData } from "./dataProcessing.js";
import {
  formatPrice,
  formatStrike,
  formatExpiry,
  formatCountdown,
} from "./format.js";

const BASE_COIN = "BTC";
const COPY_MESSAGE_DISPLAY_IN_MS = 3000;
const INDEX_PRICE_FADE_DELAY_IN_MS = 180;
const EMPTY_TABLE_MESSAGE = "No active contracts for the current expiry";

const uiSettings = {
  refreshRateInMs: 10000,
  visibleRows: 0,
  hideDistance: false,
  hideSymbols: false,
};

const state = {
  apiData: null,
  appData: null,
  error: null,
  nextRefreshAt: 0,
};

let refreshTimer = null;
let clockTimer = null;
let copyTimeout = null;
let indexPriceFadeTimeout = null;

const elements = {
  app: document.querySelector(".app"),
  indexPrice: document.getElementById("indexPrice"),
  expiryDate: document.getElementById("expiryDate"),
  expiryCountdown: document.getElementById("expiryCountdown"),
  targetStrike: document.getElementById("targetStrike"),
  tableBody: document.getElementById("tableBody"),
  refreshRate: document.getElementById("refreshRate"),
  visibleRows: document.getElementById("visibleRows"),
  hideDistance: document.getElementById("hideDistance"),
  hideSymbols: document.getElementById("hideSymbols"),
  refreshCounter: document.getElementById("refreshCounter"),
  copyMessage: document.getElementById("copyMessage"),
};

function renderStatusRow(message) {
  elements.tableBody.innerHTML = `<tr><td colspan="3" class="empty">${message}</td></tr>`;
}

function renderLoading() {
  renderStatusRow("Loading...");
}

function renderError(message) {
  renderStatusRow(`Error: ${message}`);
}

function getVisibleRows(rows, atmStrike) {
  if (!uiSettings.visibleRows || rows.length <= uiSettings.visibleRows)
    return rows;

  const atmIndex = rows.findIndex((row) => row.strike === atmStrike);

  if (atmIndex === -1) return rows.slice(0, uiSettings.visibleRows);

  const half = Math.floor(uiSettings.visibleRows / 2);
  let start = Math.max(0, atmIndex - half);
  let end = start + uiSettings.visibleRows;

  if (end > rows.length) {
    end = rows.length;
    start = end - uiSettings.visibleRows;
  }

  return rows.slice(start, end);
}

function showCopyMessage(message) {
  if (!elements.copyMessage) return;

  elements.copyMessage.textContent = message;
  elements.copyMessage.classList.add("visible");

  if (copyTimeout) clearTimeout(copyTimeout);

  copyTimeout = setTimeout(() => {
    elements.copyMessage.classList.remove("visible");
  }, COPY_MESSAGE_DISPLAY_IN_MS);
}

function copyToClipboard(text) {
  if (!text) return;

  if (!navigator.clipboard?.writeText) {
    showCopyMessage("Clipboard unavailable");
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => showCopyMessage("Symbol copied to clipboard"))
    .catch(() => showCopyMessage("Failed to copy"));
}

function heatOpacity(strike, indexPrice) {
  if (!strike || !indexPrice) return 0;

  const dist = Math.abs(strike - indexPrice) / indexPrice;
  return Math.max(0, 0.22 - dist * 2.0);
}

function applyUiState() {
  if (!elements.app) return;

  elements.app.classList.toggle("hide-distance", uiSettings.hideDistance);
  elements.app.classList.toggle("hide-symbols", uiSettings.hideSymbols);
}

function formatDistance(distanceToPrice) {
  if (distanceToPrice == null || Number.isNaN(distanceToPrice)) return "-";

  const percentage = distanceToPrice * 100;

  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
}

function rowClass(row) {
  return row.isATM ? "atm" : "";
}

function tagHtml(option, showSymbols) {
  const tagClass = option.tag === "ITM" ? "itm" : "otm";
  const symbolHtml = showSymbols
    ? `<span class="symbol" title="Click to copy">${option.symbol}</span>`
    : "";

  return `
    <span class="tag ${tagClass}">${option.tag}</span>
    ${symbolHtml}
  `;
}

function sideCellClass(side, row) {
  const baseClass = side === "CALL" ? "call-cell" : "put-cell";
  const highlightClass =
    side === "CALL"
      ? row.isHighlightCall
        ? "highlight-call"
        : ""
      : row.isHighlightPut
        ? "highlight-put"
        : "";

  return [baseClass, highlightClass].filter(Boolean).join(" ");
}

function renderRow(row, indexPrice, showSymbols, showDistance) {
  const opacity = heatOpacity(row.strike, indexPrice);
  const dist = row.call?.distToPrice ?? row.put?.distToPrice;
  const distanceHtml = showDistance
    ? `<span class="distance">${
        dist != null ? formatDistance(dist) : '<span class="empty">-</span>'
      }</span>`
    : "";

  return `
    <tr class="chain-row ${rowClass(row)}" style="background-color: rgba(106, 167, 255, ${opacity});">
      <td class="${sideCellClass("CALL", row)}">${row.call ? tagHtml(row.call, showSymbols) : ""}</td>
      <td class="strike">
        <span class="strike-value">${formatStrike(row.strike)}</span>
        ${distanceHtml}
      </td>
      <td class="${sideCellClass("PUT", row)}">${row.put ? tagHtml(row.put, showSymbols) : ""}</td>
    </tr>
  `;
}

function renderRows(rows) {
  if (!rows.length) {
    renderStatusRow(EMPTY_TABLE_MESSAGE);
    return;
  }

  const indexPrice = state.apiData?.indexPrice ?? null;
  const showSymbols = !uiSettings.hideSymbols;
  const showDistance = !uiSettings.hideDistance;

  elements.tableBody.innerHTML = rows
    .map((row) => renderRow(row, indexPrice, showSymbols, showDistance))
    .join("");
}

function updateIndexPrice(indexPrice) {
  if (!elements.indexPrice) return;

  const nextValue = formatPrice(indexPrice);
  const currentValue = elements.indexPrice.textContent;

  if (!currentValue || currentValue === "-" || currentValue === nextValue) {
    elements.indexPrice.textContent = nextValue;
    return;
  }

  if (indexPriceFadeTimeout) clearTimeout(indexPriceFadeTimeout);

  elements.indexPrice.classList.add("fade-out");
  indexPriceFadeTimeout = setTimeout(() => {
    elements.indexPrice.textContent = nextValue;
    elements.indexPrice.classList.remove("fade-out");
    indexPriceFadeTimeout = null;
  }, INDEX_PRICE_FADE_DELAY_IN_MS);
}

function renderSummary(apiData, appData) {
  updateIndexPrice(apiData.indexPrice);
  elements.expiryDate.textContent = formatExpiry(appData.targetExpiry);
  elements.expiryCountdown.textContent = formatCountdown(appData.targetExpiry);
  elements.targetStrike.textContent = formatStrike(appData.atmStrike);
}

function renderRefreshCounter() {
  if (!elements.refreshCounter) return;

  if (uiSettings.refreshRateInMs <= 0) {
    elements.refreshCounter.textContent = "Auto-refresh off";
    return;
  }

  if (!state.nextRefreshAt) {
    elements.refreshCounter.textContent = "Next refresh: -";
    return;
  }

  const remainingSeconds = Math.max(
    0,
    Math.ceil((state.nextRefreshAt - Date.now()) / 1000),
  );

  elements.refreshCounter.textContent = `Next refresh: ${remainingSeconds}s`;
}

function render() {
  applyUiState();
  renderRefreshCounter();

  if (state.error) {
    renderError(state.error.message);
    return;
  }

  if (!state.apiData || !state.appData) {
    renderLoading();
    return;
  }

  renderSummary(state.apiData, state.appData);
  renderRows(getVisibleRows(state.appData.rows, state.appData.atmStrike));
}

async function refresh() {
  try {
    const apiData = await fetchData();
    const appData = transformApiData(
      apiData.symbols,
      BASE_COIN,
      apiData.indexPrice,
    );

    state.apiData = apiData;
    state.appData = appData;
    state.error = null;
  } catch (error) {
    state.error = error;
  }

  render();
}

function tick() {
  if (state.appData) {
    elements.expiryCountdown.textContent = formatCountdown(
      state.appData.targetExpiry,
    );
  }

  renderRefreshCounter();
}

function scheduleRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);

  if (uiSettings.refreshRateInMs > 0) {
    state.nextRefreshAt = Date.now() + uiSettings.refreshRateInMs;
    refreshTimer = setInterval(() => {
      state.nextRefreshAt = Date.now() + uiSettings.refreshRateInMs;
      refresh();
    }, uiSettings.refreshRateInMs);
  } else {
    state.nextRefreshAt = 0;
  }

  renderRefreshCounter();
}

function bindControls() {
  if (elements.refreshRate) {
    elements.refreshRate.addEventListener("change", (event) => {
      uiSettings.refreshRateInMs = Number(event.target.value);
      scheduleRefresh();
    });
  }

  if (elements.visibleRows) {
    elements.visibleRows.addEventListener("change", (event) => {
      uiSettings.visibleRows = Number(event.target.value);
      render();
    });
  }

  if (elements.hideDistance) {
    elements.hideDistance.addEventListener("change", (event) => {
      uiSettings.hideDistance = event.target.checked;
      applyUiState();
    });
  }

  if (elements.hideSymbols) {
    elements.hideSymbols.addEventListener("change", (event) => {
      uiSettings.hideSymbols = event.target.checked;
      applyUiState();
    });
  }
}

function bindSymbolCopy() {
  elements.tableBody.addEventListener("click", (event) => {
    const symbolElement = event.target.closest(".symbol");

    if (!symbolElement) return;

    copyToClipboard(symbolElement.textContent.trim());
  });
}

function startClock() {
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = setInterval(tick, 1000);
}

bindControls();
bindSymbolCopy();
render();
refresh();
scheduleRefresh();
startClock();
