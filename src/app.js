import { fetchData } from "./api.js";
import { formatPrice, formatStrike } from "./format.js";
import { buildRows } from "./dataProcessing.js";

const state = {
  rows: [],
  loading: true,
  error: null,
  indexPrice: null,
};

const tbody = document.getElementById("chainBody");
const indexPriceElement = document.querySelector(".stat .value");

function renderLoading() {
  tbody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;
}

function renderError(message) {
  tbody.innerHTML = `<tr><td colspan="3">Error: ${message}</td></tr>`;
}

function renderRows(rows) {
  tbody.innerHTML = rows
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

function render() {
  if (state.loading) {
    renderLoading();
    return;
  }

  if (state.error) {
    renderError(state.error);
    return;
  }
  const { rows } = state.chain;

  renderRows(rows);
}

async function load() {
  try {
    const apiData = await fetchData();

    console.log("Fetched data:", apiData);

    state.chain = buildRows(apiData.symbols, "BTC", apiData.indexPrice);
    indexPriceElement.textContent = formatPrice(apiData.indexPrice);
    console.log("Built rows:", state.chain);

    state.loading = false;
  } catch (err) {
    state.error = err.message;
    state.loading = false;
  }

  render();
}

render();
load();
