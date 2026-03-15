import { fetchData } from "./api.js";
import { transformApiData } from "./dataProcessing.js";
import {
  formatPrice,
  formatStrike,
  formatExpiry,
  formatCountdown,
} from "./format.js";

const BASE_COIN = "BTC";
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

function renderRows(rows) {
  const showSymbols = !ui.hideSymbols;

  elements.tableBody.innerHTML = rows
    .map(
      (row) =>
        `<tr class="${row.isATM ? "atm" : ""}">
           <td class="${row.isHighlightCall ? "highlight-call" : ""}">${row.call && showSymbols ? row.call.symbol : ""}</td>
           <td>${formatStrike(row.strike)}</td>
           <td class="${row.isHighlightPut ? "highlight-put" : ""}">${row.put && showSymbols ? row.put.symbol : ""}</td>
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

function startCountdownTimer() {
  setInterval(countdown, 1000);
}

bindControls();
render();
refresh();
scheduleRefresh();
startCountdownTimer();
