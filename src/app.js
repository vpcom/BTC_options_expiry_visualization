import { fetchData } from "./api.js";
import { transformApiData } from "./dataProcessing.js";
import {
  formatPrice,
  formatStrike,
  formatExpiry,
  formatCountdown,
} from "./format.js";

const BASE_COIN = "BTC";

const state = {
  apiData: null,
  appData: null,
  error: null,
};

const elements = {
  indexPrice: document.getElementById("indexPrice"),
  expiryDate: document.getElementById("expiryDate"),
  expiryCountdown: document.getElementById("expiryCountdown"),
  targetStrike: document.getElementById("targetStrike"),
  tableBody: document.getElementById("tableBody"),
};

function renderLoading() {
  if (elements.tableBody) {
    elements.tableBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
  }
}

function renderError(message) {
  if (elements.tableBody) {
    elements.tableBody.innerHTML = `<tr><td colspan="3">Error: ${message}</td></tr>`;
  }
}

function renderRows(rows) {
  if (!elements.tableBody) return;

  elements.tableBody.innerHTML = rows
    .map(
      (row) =>
        `<tr class="${row.isATM ? "atm" : ""}">
           <td class="${row.isHighlightCall ? "highlight-call" : ""}">${row.call ? row.call.symbol : ""}</td>
           <td>${formatStrike(row.strike)}</td>
           <td class="${row.isHighlightPut ? "highlight-put" : ""}">${row.put ? row.put.symbol : ""}</td>
         </tr>`,
    )
    .join("");
}

function renderSummary(apiData, appData) {
  elements.indexPrice.textContent = formatPrice(apiData.indexPrice);
  elements.expiryDate.textContent = formatExpiry(appData.targetExpiry);
  elements.expiryCountdown.textContent = formatCountdown(appData.targetExpiry);
  if (elements.targetStrike) {
    elements.targetStrike.textContent = formatStrike(appData.targetStrike);
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
  renderRows(state.appData.rows);
}

async function load() {
  try {
    const apiData = await fetchData(BASE_COIN);

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

render();
load();
