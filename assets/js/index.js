const scriptURL = 'https://script.google.com/macros/s/AKfycbxB3kmOwFUfT4CZ-d9pbtFq3bbkajwEzzcW3vnj4dclFliMPv5FgmorusOpiqkmeLTJ/exec';
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let allRecords = [];

function formatTanggalIndo(tanggalString) {
  const date = new Date(tanggalString);
  if (isNaN(date)) return tanggalString;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${min}`;
}

function renderTablePage(records, page) {
  const tbody = document.getElementById("dataBody");
  tbody.innerHTML = "";
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageRecords = records.slice(start, end);

  pageRecords.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatTanggalIndo(row.tanggal)}</td>
      <td>${row.nama}</td>
      <td>${row.jenis}</td> <!-- Sudah langsung 'Menabung' dari server -->
      <td>Rp${row.nominal.toLocaleString("id-ID")}</td>
      <td>${row.catatan}</td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination(records.length, page);
}

function renderPagination(totalItems, currentPage) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  container.appendChild(createPaginationButton("<", Math.max(1, currentPage - 1)));

  const maxVisible = 3;
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    const span = document.createElement("span");
    span.className = "text-muted px-2 align-self-center";
    span.textContent = "...";
    container.appendChild(span);
  }

  for (let i = startPage; i <= endPage; i++) {
    container.appendChild(createPaginationButton(i, i, i === currentPage));
  }

  if (endPage < totalPages) {
    const span = document.createElement("span");
    span.className = "text-muted px-2 align-self-center";
    span.textContent = "...";
    container.appendChild(span);
  }

  container.appendChild(createPaginationButton(">", Math.min(totalPages, currentPage + 1)));
}

function createPaginationButton(text, page, isActive = false) {
  const btn = document.createElement("button");
  btn.innerText = text;
  btn.className = `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-secondary'}`;
  btn.onclick = () => {
    currentPage = page;
    renderTablePage(allRecords, currentPage);
  };
  return btn;
}

fetch(scriptURL)
  .then(res => res.json())
  .then(data => {
    const summaryTable = document.getElementById("summaryTable");
    const summary = {};
    allRecords = data.records.reverse(); // data terbaru di atas

    allRecords.forEach(row => {
      if (!summary[row.nama]) summary[row.nama] = { tabung: 0, cashout: 0 };
      if (row.jenis === "Menabung") summary[row.nama].tabung += row.nominal;
      if (row.jenis === "Cashout") summary[row.nama].cashout += row.nominal;
    });

    Object.entries(summary).forEach(([nama, val]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${nama}</td>
        <td class="text-success">Rp${val.tabung.toLocaleString("id-ID")}</td>
        <td class="text-danger">Rp${val.cashout.toLocaleString("id-ID")}</td>
        <td class="text-primary">Rp${(val.tabung - val.cashout).toLocaleString("id-ID")}</td>
      `;
      summaryTable.appendChild(tr);
    });

    renderTablePage(allRecords, currentPage);
  });

function openForm(jenis) {
  document.getElementById("formJenis").value = jenis;
  if (jenis === "Tabung") {
    const modal = new bootstrap.Modal(document.getElementById("transferModal"));
    modal.show();
  } else {
    document.getElementById("formTitle").innerText = "Cashout";
    const modal = new bootstrap.Modal(document.getElementById("popup"));
    modal.show();
  }
}

function lanjutSetelahTransfer() {
  const transferModal = bootstrap.Modal.getInstance(document.getElementById("transferModal"));
  transferModal.hide();
  document.getElementById("formTitle").innerText = "Menabung";
  const formModal = new bootstrap.Modal(document.getElementById("popup"));
  formModal.show();
}

document.getElementById("formData").addEventListener("submit", function (e) {
  e.preventDefault();
  document.getElementById("overlay").style.display = "block";
  document.getElementById("loadingSpinner").style.display = "block";
  const modal = bootstrap.Modal.getInstance(document.getElementById("popup"));
  modal.hide();

  const form = new FormData(this);
  fetch(scriptURL, { method: "POST", body: form })
    .then(res => res.text())
    .then(text => {
      document.getElementById("overlay").style.display = "none";
      document.getElementById("loadingSpinner").style.display = "none";
      alert("✅ " + text);
      location.reload();
    })
    .catch(() => {
      document.getElementById("overlay").style.display = "none";
      document.getElementById("loadingSpinner").style.display = "none";
      alert("❌ Gagal menyimpan data.");
    });
});
