let lastbLastId = null;
let proxyLastId = null;
let currentSorts = {
  lastbTable: null,
  proxyTable: null,
};

const dateCache = new Map();

// Global cumulative stores for the tables
let cumulativeLastbData = [];
let cumulativeProxyData = [];

// Caches parsed dates for performance
function getParsedDate(timestamp) {
  if (!dateCache.has(timestamp)) {
    // Directly parse ISO‑8601 timestamps and cache the millisecond value
    const date = new Date(timestamp);
    dateCache.set(timestamp, date.getTime());
  }
  return dateCache.get(timestamp);
}

function loadSortState() {
  const lastbSort = localStorage.getItem("lastbTableSortState");
  const proxySort = localStorage.getItem("proxyTableSortState");
  if (lastbSort) {
    currentSorts.lastbTable = JSON.parse(lastbSort);
  }
  if (proxySort) {
    currentSorts.proxyTable = JSON.parse(proxySort);
  }
}

function saveSortState(tableId, state) {
  localStorage.setItem(tableId + "SortState", JSON.stringify(state));
  currentSorts[tableId] = state;
}

function sortTable(table, column, direction) {
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const isLastbTable = table.id === "lastbTable";
  // For lastbTable, timestamp is at index 3; for proxyTable, at index 4
  const timestampColumn = isLastbTable ? 3 : 4;

  const compareFunction = (a, b) => {
    if (column === timestampColumn) {
      const aTimestamp = a.children[column].getAttribute("data-timestamp");
      const bTimestamp = b.children[column].getAttribute("data-timestamp");
      const aTime = getParsedDate(aTimestamp);
      const bTime = getParsedDate(bTimestamp);
      return direction === "asc" ? aTime - bTime : bTime - aTime;
    }

    const aCol = a.children[column].textContent.trim();
    const bCol = b.children[column].textContent.trim();

    // Check for numeric comparison
    if (!isNaN(aCol) && !isNaN(bCol)) {
      const aNum = Number(aCol);
      const bNum = Number(bCol);
      return direction === "asc" ? aNum - bNum : bNum - aNum;
    }

    return direction === "asc"
      ? aCol.localeCompare(bCol)
      : bCol.localeCompare(aCol);
  };

  const sortedRows = rows.sort(compareFunction);
  const fragment = document.createDocumentFragment();
  sortedRows.forEach((row) => fragment.appendChild(row));
  tbody.innerHTML = "";
  tbody.appendChild(fragment);
  
  // Re-apply translations after sorting
  if (typeof window.updateRTADTranslations === 'function') {
    setTimeout(window.updateRTADTranslations, 0);
  }
}

// Helper: Generate row HTML for a given item and table type
function generateRowHTML(item, type) {
  if (type === "lastb") {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString();
    return `
      <td>${item.ip_address}</td>
      <td>${item.country || window.t('N/A')}</td>
      <td>${item.city || window.t('N/A')}</td>
      <td data-timestamp="${item.timestamp}">${formattedDate}</td>
      <td>${item.user || ""}</td>
      <td>${item.failure_reason || ""}</td>
    `;
  } else if (type === "proxy") {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString();
    let errorClass = "";
    if (item.error_code >= 300 && item.error_code < 400) {
      errorClass = "status-yellow";
    } else if (item.error_code === 200) {
      errorClass = "status-green";
    } else if (item.error_code === 500) {
      errorClass = "status-blue";
    } else if (
      item.error_code === 404 ||
      item.error_code === 403 ||
      (item.error_code >= 400 && item.error_code < 500)
    ) {
      errorClass = "status-red";
    }
    return `
      <td>${item.domain || ""}</td>
      <td>${item.ip_address || ""}</td>
      <td>${item.country || window.t('N/A')}</td>
      <td>${item.city || window.t('N/A')}</td>
      <td data-timestamp="${item.timestamp}">${formattedDate}</td>
      <td>${item.proxy_type || ""}</td>
      <td class="${errorClass}">${item.error_code || ""}</td>
      <td>${item.url || ""}</td>
    `;
  }
  return "";
}

// Merge new diff data into the cumulative store without duplicates
function mergeDiffData(cumulativeData, newData, idKey = "id") {
  const existingIds = new Set(cumulativeData.map((item) => item[idKey]));
  newData.forEach((item) => {
    if (!existingIds.has(item[idKey])) {
      cumulativeData.push(item);
    }
  });
  const maxStoreSize = 1000;
  if (cumulativeData.length > maxStoreSize) {
    cumulativeData.splice(0, cumulativeData.length - maxStoreSize);
  }
  return cumulativeData;
}

// Re-render table based on the cumulative store
function updateTableFromStore(tbodySelector, cumulativeData, type) {
  const tbody = document.querySelector(tbodySelector);
  const fragment = document.createDocumentFragment();
  const maxRows = 200;
  const dataToRender = cumulativeData.length > maxRows ? cumulativeData.slice(-maxRows) : cumulativeData;
  dataToRender.forEach((item) => {
    const newRowHTML = generateRowHTML(item, type).trim();
    const row = document.createElement("tr");
    row.innerHTML = newRowHTML;
    fragment.appendChild(row);
  });
  tbody.innerHTML = "";
  tbody.appendChild(fragment);
}

function fetchRTADData() {
  // Fetch for lastb (failed login attempts)
  let lastbUrl = "/rtad/rtad_lastb";
  // Use the ID of the last record in the cumulative store, if available
  let lastbLastIdParam =
    cumulativeLastbData.length > 0
      ? cumulativeLastbData[cumulativeLastbData.length - 1].id
      : null;
  if (lastbLastIdParam !== null) {
    lastbUrl += "?last_id=" + lastbLastIdParam;
  }

  fetch(lastbUrl, { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0) return;
      cumulativeLastbData = mergeDiffData(cumulativeLastbData, data, "id");
      // Update the lastbLastId based on the latest cumulative data
      lastbLastId =
        cumulativeLastbData[cumulativeLastbData.length - 1].id || lastbLastId;
      updateTableFromStore("#lastbTable tbody", cumulativeLastbData, "lastb");
      if (currentSorts.lastbTable && currentSorts.lastbTable.column !== null) {
        requestAnimationFrame(() => {
          sortTable(
            document.querySelector("#lastbTable"),
            currentSorts.lastbTable.column,
            currentSorts.lastbTable.direction,
          );
        });
      }
    })
    .catch((error) => {
      console.error(window.t('Error fetching RTAD login attempts:'), error);
    });

  // Fetch for proxy logs (HTTP error events)
  let proxyUrl = "/rtad/rtad_proxy";
  let proxyLastIdParam =
    cumulativeProxyData.length > 0
      ? cumulativeProxyData[cumulativeProxyData.length - 1].id
      : null;
  if (proxyLastIdParam !== null) {
    proxyUrl += "?last_id=" + proxyLastIdParam;
  }

  fetch(proxyUrl, { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0) return;
      cumulativeProxyData = mergeDiffData(cumulativeProxyData, data, "id");
      proxyLastId =
        cumulativeProxyData[cumulativeProxyData.length - 1].id || proxyLastId;
      updateTableFromStore("#proxyTable tbody", cumulativeProxyData, "proxy");
      if (currentSorts.proxyTable && currentSorts.proxyTable.column !== null) {
        requestAnimationFrame(() => {
          sortTable(
            document.querySelector("#proxyTable"),
            currentSorts.proxyTable.column,
            currentSorts.proxyTable.direction,
          );
        });
      }
    })
    .catch((error) => {
      console.error(window.t('Error fetching RTAD proxy events:'), error);
    });
}

function refreshRTADData() {
  // Clear cumulative data and reset IDs for a full reload
  cumulativeLastbData = [];
  cumulativeProxyData = [];
  lastbLastId = null;
  proxyLastId = null;
  fetchRTADData();
}

function initializeSorting() {
  const tables = document.querySelectorAll("#lastbTable, #proxyTable");

  tables.forEach((table) => {
    const headers = table.querySelectorAll("th");
    headers.forEach((header, index) => {
      if (!header.dataset.originalText) {
        // Store the original text content as data attribute
        header.dataset.originalText = header.textContent;
      }
      header.classList.add("sortable");

      header.addEventListener("click", () => {
        headers.forEach((h) => {
          h.classList.remove("asc", "desc");
          // Just restore the text without the arrow indicator
          h.textContent = h.dataset.originalText;
        });

        let direction = "asc";
        const tableKey = table.id;
        if (
          currentSorts[tableKey] &&
          currentSorts[tableKey].column === index &&
          currentSorts[tableKey].direction === "asc"
        ) {
          direction = "desc";
        }

        header.classList.add(direction);
        // Use textContent instead of innerHTML and keep the original text intact
        header.textContent = `${header.dataset.originalText} ${
          direction === "asc" ? "↑" : "↓"
        }`;

        sortTable(table, index, direction);
        saveSortState(tableKey, { column: index, direction });
      });
    });
  });
}

// Initialize the RTAD functionality
document.addEventListener("DOMContentLoaded", () => {
  loadSortState();
  initializeSorting();
  fetchRTADData();
  // Refresh data every 30 seconds
  setInterval(fetchRTADData, 30000);
});
