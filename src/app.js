import { fetchData } from "./api.js";

const state = {
  rows: [],
  loading: true,
  error: null,
};

const tbody = document.getElementById("chainBody");

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
        `<tr><td>${row.call}</td><td>${row.strike}</td><td>${row.put}</td></tr>`,
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

  renderRows(state.rows);
}

async function load() {
  try {
    const snapshot = await fetchData();

    // For now we still render mock rows
    state.rows = [
      { call: "BTC-XXX-C", strike: "63000", put: "BTC-XXX-P" },
      { call: "BTC-XXX-C", strike: "64000", put: "BTC-XXX-P" },
      { call: "BTC-XXX-C", strike: "65000", put: "BTC-XXX-P" },
    ];

    state.loading = false;
  } catch (err) {
    state.error = err.message;
    state.loading = false;
  }

  render();
}

render();
load();
