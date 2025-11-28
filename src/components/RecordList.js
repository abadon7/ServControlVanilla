import { subscribeToPath, writeData } from "../firebase.js";
import { openEditDialog } from "./EditDialog.js";
import { openAddDialog } from "./AddDialog.js";
import { createSummary } from "./Summary.js";
import { showNotification } from "./Notification.js";

export function createRecordList(target, initialPath, userName) {
  const container = document.createElement("div");
  container.className = "w-full max-w-6xl mx-auto space-y-8";
  container.innerHTML = `
      <div id="totals"></div>
      
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div id="selectors" class="flex items-center gap-3"></div>
          <button id="add-record-btn" class="flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-xl hover:bg-pink-700 transition-colors shadow-sm shadow-pink-200 cursor-pointer">
            <span class="material-symbols-outlined text-lg">add</span>
            Add Record
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                <th class="px-4 py-4">Day</th>
                <th class="px-4 py-4">Hours</th>
                <th class="px-4 py-4">Studies</th>
                <th class="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="items" class="divide-y divide-gray-100 text-sm text-gray-700"></tbody>
          </table>
        </div>
        <div id="empty-state" class="hidden p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <span class="material-symbols-outlined text-3xl text-gray-400">calendar_today</span>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-1">No records found</h3>
            <p class="text-gray-500">Get started by adding a new record for this month.</p>
        </div>
      </div>
  `;
  target.appendChild(container);

  const selectorsEl = container.querySelector("#selectors");
  const totalsEl = container.querySelector("#totals");
  const itemsEl = container.querySelector("#items");
  const emptyStateEl = container.querySelector("#empty-state");
  const addRecordBtn = container.querySelector("#add-record-btn");

  let currentPath = initialPath;
  let unsubscribe = null;
  const itemsCache = {};

  function renderList(data) {
    itemsEl.innerHTML = "";
    totalsEl.innerHTML = "";

    // Calculate sums
    let totalHoras = 0;
    let totalEst = 0;
    if (data) {
      Object.values(data).forEach((value) => {
        totalHoras += parseFloat(value && value.horas ? value.horas : 0) || 0;
        totalEst += Number(value && value.est ? value.est : 0);
      });
    }

    // Render Summary
    createSummary(totalsEl, totalHoras, totalEst);

    // Selectors
    if (!selectorsEl.hasChildNodes()) {
      const pathParts = currentPath.split("/");
      const currentYear = pathParts[3];
      const currentMonth = pathParts[4];

      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      const startYear = 2020;
      const endYear = 2030;

      let yearOptions = "";
      for (let y = startYear; y <= endYear; y++) {
        yearOptions += `<option value="${y}" ${y == currentYear ? "selected" : ""}>${y}</option>`;
      }

      let monthOptions = "";
      months.forEach((monthName, idx) => {
        monthOptions += `<option value="${idx}" ${idx == currentMonth ? "selected" : ""}>${monthName}</option>`;
      });

      selectorsEl.innerHTML = `
          <div class="relative">
            <select id="month-selector" class="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium cursor-pointer">
              ${monthOptions}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <span class="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
          <div class="relative">
            <select id="year-selector" class="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium cursor-pointer">
              ${yearOptions}
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <span class="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
        `;

      const yearSelector = selectorsEl.querySelector("#year-selector");
      const monthSelector = selectorsEl.querySelector("#month-selector");

      const updatePath = () => {
        const selectedYear = yearSelector.value;
        const selectedMonth = monthSelector.value;
        currentPath = `/control/${userName}/${selectedYear}/${selectedMonth}`;
        if (unsubscribe) unsubscribe();
        unsubscribe = subscribeToPath(currentPath, (val) => renderList(val));
      };

      yearSelector.addEventListener("change", updatePath);
      monthSelector.addEventListener("change", updatePath);
    }

    // Add Button Handler
    // We remove old listeners by cloning or just re-adding carefully. 
    // Since renderList is called often, we should attach this outside or check.
    // Actually, addRecordBtn is static in the container, so we can attach once outside renderList logic if we want, 
    // but we need currentPath. Let's just update the onclick handler wrapper.
    addRecordBtn.onclick = () => openAddDialog(currentPath);


    // Reset cache
    Object.keys(itemsCache).forEach((k) => delete itemsCache[k]);

    if (!data) {
      emptyStateEl.classList.remove("hidden");
      itemsEl.parentElement.classList.add("hidden"); // Hide table
      return;
    } else {
      emptyStateEl.classList.add("hidden");
      itemsEl.parentElement.classList.remove("hidden");
    }

    Object.entries(data).forEach(([key, value]) => {
      itemsCache[key] = value || {};
      const tr = document.createElement("tr");
      tr.className = "group hover:bg-pink-50/30 transition-colors";

      const day = value?.date?.split("-")[2] || "0";
      const horas = value?.horas || "0";
      const est = value?.est || "0";

      tr.innerHTML = `
        <td class="px-4 py-4 font-medium text-gray-900">${escapeHtml(day)}</td>
        <td class="px-4 py-4 text-gray-600">${escapeHtml(horas)}</td>
        <td class="px-4 py-4 text-gray-600">${escapeHtml(est)}</td>
        <td class="px-4 py-4 text-right">
          <div class="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button data-key="${key}" class="edit-btn p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors" title="Edit">
              <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button data-key="${key}" class="remove-btn p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </td>
      `;
      itemsEl.appendChild(tr);
    });

    // Attach handlers
    itemsEl.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-key");
        if (!key) return;
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
          await writeData(`${currentPath}/${key}`, null);
          showNotification("Record deleted successfully");
        } catch (err) {
          console.error("remove failed", err);
          showNotification("Failed to delete record", "error");
        }
      });
    });

    itemsEl.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-key");
        if (!key) return;
        openEditDialog(key, itemsCache[key] || {}, currentPath);
      });
    });
  }

  // Initial subscription
  unsubscribe = subscribeToPath(currentPath, (val) => {
    renderList(val);
  });

  return unsubscribe;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
