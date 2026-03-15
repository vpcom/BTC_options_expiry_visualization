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
const ui = {
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
let copyTimeout = null;

const elements = {
  indexPrice: document.getElementById("indexPrice"),
  expiryDate: document.getElementById("expiryDate"),
  expiryCountdown: document.getElementById("expiryCountdown"),
  targetStrike: document.getElementById("targetStrike"),
  tableBody: document.getElementById("tableBody"),
  refreshRate: document.getElementById("refreshRate"),
  visibleRows: document.getElementById("visibleRows"),
  hideDistance: document.getElementById("hideDistance"),
  hideSymbols: document.getElementById("hideSymbols"),
  copyMessage: document.getElementById("copyMessage"),
};

function renderLoading() {
  elements.tableBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
}

function renderError(message) {
  elements.tableBody.innerHTML = `<tr><td colspan="3">Error: ${message}</td></tr>`;
}

function getVisibleRows(rows, atmStrike) {
  if (!ui.visibleRows || rows.length <= ui.visibleRows) return rows;

  const atmIndex = rows.findIndex((row) => row.strike === atmStrike);

  if (atmIndex === -1) return rows.slice(0, ui.visibleRows);

  const half = Math.floor(ui.visibleRows / 2);
  let start = Math.max(0, atmIndex - half);
  let end = start + ui.visibleRows;

  if (end > rows.length) {
    end = rows.length;
    start = end - ui.visibleRows;
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

  navigator.clipboard
    .writeText(text)
    .then(() => showCopyMessage("Symbol copied to clipboard"))
    .catch(() => showCopyMessage("Failed to copy"));
}

function renderRows(rows) {
  const showSymbols = !ui.hideSymbols;

  elements.tableBody.innerHTML = rows
    .map(
      (row) =>
        `<tr class="${row.isATM ? "atm" : ""}">
           <td class="${row.isHighlightCall ? "highlight-call" : ""}">${row.call && showSymbols ? `<span class="symbol">${row.call.symbol}</span>` : ""}</td>
           <td>${formatStrike(row.strike)}</td>
           <td class="${row.isHighlightPut ? "highlight-put" : ""}">${row.put && showSymbols ? `<span class="symbol">${row.put.symbol}</span>` : ""}</td>
         </tr>`,
    )
    .join("");
}

function renderSummary(apiData, appData) {
  elements.indexPrice.textContent = formatPrice(apiData.indexPrice);
  elements.expiryDate.textContent = formatExpiry(appData.targetExpiry);
  elements.expiryCountdown.textContent = formatCountdown(appData.targetExpiry);
  if (elements.targetStrike) {
    elements.targetStrike.textContent = formatStrike(appData.atmStrike);
  }
}

function render() {
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

  state.nextRefreshAt = Date.now() + ui.refreshRateInMs;
  render();
}

function countdown() {
  if (!state.appData) return;

  elements.expiryCountdown.textContent = formatCountdown(
    state.appData.targetExpiry,
  );
}

function scheduleRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);

  if (ui.refreshRateInMs > 0) {
    refreshTimer = setInterval(refresh, ui.refreshRateInMs);
  }
}

function bindControls() {
  if (elements.refreshRate) {
    elements.refreshRate.addEventListener("change", (event) => {
      ui.refreshRateInMs = Number(event.target.value);
      scheduleRefresh();
    });
  }

  if (elements.visibleRows) {
    elements.visibleRows.addEventListener("change", (event) => {
      ui.visibleRows = Number(event.target.value);
      render();
    });
  }

  if (elements.hideDistance) {
    elements.hideDistance.addEventListener("change", (event) => {
      ui.hideDistance = event.target.checked;
      render();
    });
  }

  if (elements.hideSymbols) {
    elements.hideSymbols.addEventListener("change", (event) => {
      ui.hideSymbols = event.target.checked;
      render();
    });
  }
}

// For copying feature symbol to clipboard
function bindSymbolCopy() {
  elements.tableBody.addEventListener("click", (event) => {
    const symbolElement = event.target.closest(".symbol");

    if (!symbolElement) return;

    copyToClipboard(symbolElement.textContent.trim());
  });
}

function startCountdownTimer() {
  setInterval(countdown, 1000);
}

bindControls();
bindSymbolCopy();
render();
refresh();
scheduleRefresh();
startCountdownTimer();
