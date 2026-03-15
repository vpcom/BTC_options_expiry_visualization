const state = {
  rows: [
    { call: "BTC-XXX-C", strike: "63,000", put: "BTC-XXX-P" },
    { call: "BTC-XXX-C", strike: "64,000", put: "BTC-XXX-P" },
    { call: "BTC-XXX-C", strike: "65,000", put: "BTC-XXX-P" },
  ],
  loading: false,
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

// Initial render
render();
