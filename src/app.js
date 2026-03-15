const rows = [
  {
    call: "BTC-XXX-C",
    strike: "63,000",
    put: "BTC-XXX-P",
  },
  {
    call: "BTC-XXX-C",
    strike: "64,000",
    put: "BTC-XXX-P",
  },
  {
    call: "BTC-XXX-C",
    strike: "65,000",
    put: "BTC-XXX-P",
  },
];

const tbody = document.getElementById("chainBody");

rows.forEach((row) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `     <td>${row.call}</td>     <td>${row.strike}</td>     <td>${row.put}</td>
  `;

  tbody.appendChild(tr);
});
