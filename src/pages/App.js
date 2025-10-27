import { signOutUser } from "../firebase.js";
import {
  subscribeToPath,
  pushData,
  writeData,
  getData,
  updateData,
  auth,
} from "../firebase.js";
//import { getAuth } from "firebase/auth";
// cache current items for quick access when editing
const itemsCache = {};
let currentPath = "Henry";
//let currentPath = "/control/Henry/2023/0";
//const auth = getAuth();

export function mountApp(target = "#app") {
  //const getAuth = () => auth;
  const userP = auth.currentUser;
  console.log("Current user:", userP);
  const firstName = userP?.displayName?.split(" ")[0]?.trim();
  const userName =
    firstName && firstName.toLowerCase() === "carito"
      ? "Carolina"
      : firstName || userP?.email?.split("@")[0] || "Henry";
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  currentPath = `/control/${userName}/${currentYear}/${currentMonth}`;
  console.log("Initial currentPath:", currentPath);
  const root = document.querySelector(target);
  if (!root) return;

  root.innerHTML = `
    <header class="w-full bg-white sticky top-0 z-40 border-b border-solid border-gray-200 dark:border-gray-700 px-4 py-3 bg-white">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold">ServControl</h1>
        </div>
        <div class="flex items-center gap-2">          
          <button id="sign-out-btn" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition cursor-pointer">Sign out</button>
        </div>
      </div>
    </header>
    <div class="flex items-center gap-2 text-gray-900 dark:text-white"></div>

    <main class="w-full  mx-auto p-4 items-center justify-center flex">
      <div id="db-ui" class="space-y-4 w-full max-w-2xl">
      <div id="selectors" class="rounded-full"></div>
      <div id="totals" class="rounded-lg border border-gray-200 bg-white p-4"></div>
      <ul id="items" class="space-y-2 rounded-lg border border-gray-200 "></ul>
      </div>
    </main>
  `;

  // create edit dialog (hidden initially)
  createEditDialog();
  // create add dialog (hidden initially)
  createAddDialog();

  const btn = document.getElementById("sign-out-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        await signOutUser();
      } catch (err) {
        console.error("Sign out failed", err);
      }
    });
  }

  // simple realtime list under path "/control/Henry/2023/0"
  const selectorsEl = document.getElementById("selectors");
  const totalsEl = document.getElementById("totals");
  const itemsEl = document.getElementById("items");
  const refreshBtn = document.getElementById("refresh-btn");

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

    // Add month and year selectors above the summary, aligned to the left
    let selectorRow = document.getElementById("selector-row");
    if (!selectorRow) {
      selectorRow = document.createElement("div");
      selectorRow.id = "selector-row";
      selectorRow.className =
        "flex gap-4 items-center  mb-4 p-2 bg-white"; // justify-start for left alignment
      selectorsEl.appendChild(selectorRow);
    }

    // Extract current month and year from the path
    const path = currentPath;
    const pathParts = path.split("/");
    const currentYear = pathParts[3];
    const currentMonth = pathParts[4];

    // Month names
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Build year and month selectors
    // Generate year options (e.g., 2020-2030)
    const startYear = 2020;
    const endYear = 2030;
    let yearOptions = "";

    for (let y = startYear; y <= endYear; y++) {
      yearOptions += `<option value="${y}" ${
        y == currentYear ? "selected" : ""
      }>${y}</option>`;
    }

    // Generate month options
    let monthOptions = "";
    months.forEach((monthName, idx) => {
      monthOptions += `<option value="${idx}" ${
        idx == currentMonth ? "selected" : ""
      }>${monthName}</option>`;
    });

    selectorRow.innerHTML = `
    <div class="flex-1">
      <label class="font-semibold text-[#023e8a] text-sm">
      
      <select id="year-selector" class="mt-1 px-2 py-2 rounded border border-gray-200 w-full bg-white focus:outline-none focus:ring-2 focus:ring-[#90e0ef]">
        ${yearOptions}
      </select>
      </label>
    </div>
    <div class="flex-1">
      <label class="font-semibold text-[#023e8a] text-sm">
      
      <select id="month-selector" class="mt-1 px-2 py-2 rounded border border-gray-200 w-full bg-white focus:outline-none focus:ring-2 focus:ring-[#90e0ef]">
        ${monthOptions}
      </select>
      </label>
    </div>
    <div class="flex items-center">
      <button id="add-record-btn" aria-label="Add record" title="Add record" class="w-10 h-10 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-[#0077b6] shadow-sm hover:shadow-md hover:scale-105 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[#90e0ef]">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
      </svg>
      </button>
    </div>
    `;

    // Add event listeners to update currentPath when selectors change
    const yearSelector = document.getElementById("year-selector");
    const monthSelector = document.getElementById("month-selector");

    yearSelector.addEventListener("change", () => {
      const selectedYear = yearSelector.value;
      const selectedMonth = monthSelector.value;
      currentPath = `/control/${userName}/${selectedYear}/${selectedMonth}`;
      console.log("Current path updated to:", currentPath);
      unsubscribe();
      const newUnsubscribe = subscribeToPath(currentPath, (val) => {
        renderList(val);
      });
    });

    monthSelector.addEventListener("change", () => {
      const selectedYear = yearSelector.value;
      const selectedMonth = monthSelector.value;
      currentPath = `/control/${userName}/${selectedYear}/${selectedMonth}`;
      unsubscribe();
      const newUnsubscribe = subscribeToPath(currentPath, (val) => {
        renderList(val);
      });
    });

    /*  selectorRow.innerHTML += `
      <button id="add-record-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer">New</button>
    `; */

    // Add summary box
    const summary = document.createElement("div");
    summary.className =
      "flex gap-6 justify-center items-center font-semibold text-[#023e8a] bg-white";
    // Get the current user's info from Firebase Auth
    //const auth = getAuth();
    const user = auth.currentUser || {};
    console.log("Rendering summary for user from renderlist:", user);
    const photoURL =
      user.photoURL ||
      "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";
    const displayName = user.displayName || "Google user";

    summary.innerHTML = `
    <!--- <div>
        <span class="mr-4 flex items-center">
          <img src="${photoURL}" alt="${displayName}" class="h-7 w-7 rounded-full bg-white " />
        </span>
        <span>Total Hours: <span class="text-[#0096c7]">${totalHoras}</span></span>
        <span>Total Studies: <span class="text-[#00b4d8]">${totalEst}</span></span>
       </div> --->
        
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="mr-4 flex items-center">
          <img src="${photoURL}" alt="${displayName}" class="h-7 w-7 rounded-full bg-white " />
        </span>
                    <div class="mr-4">
                        <p class="text-sm text-gray-500 dark:text-gray-400">Welcome,</p>
                        <p class="font-bold text-gray-900 ">${user.displayName}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 text-center">
                    <div>
                        <div
                            class="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                            <span class="material-symbols-outlined text-lg">schedule</span>
                            <p class="text-xs">Hours</p>
                        </div>
                        <p class="text-lg font-bold text-gray-900 ">${totalHoras}</p>
                    </div>
                    <div>
                        <div
                            class="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
                            <span class="material-symbols-outlined text-lg">local_library</span>
                            <p class="text-xs">Studies</p>
                        </div>
                        <p class="text-lg font-bold text-gray-900">${totalEst}</p>
                    </div>
                </div>
            </div>
        </div>
        
    `;
    totalsEl.appendChild(summary);
    const addRecordBtn = document.getElementById("add-record-btn");
    if (addRecordBtn) {
      addRecordBtn.addEventListener("click", () => {
        console.log("Opening add dialog");
        openAddDialog();
      });
    }

    // Add header row
    // Clear previous content

    // Create header row
    const header = document.createElement("li");
    header.className =
      "m-0 p-3 text-sm font-medium font-semibold flex justify-between items-center bg-[#00b4d8] text-white rounded-t ";
    header.innerHTML = `
  <span class="flex-1 text-center">Day</span>
  <span class="flex-1 text-center">Hours</span>
  <span class="flex-1 text-center">Studies</span>
  <span class="w-40 text-center">Actions</span>
`;
    itemsEl.appendChild(header);

    // Reset cache
    Object.keys(itemsCache).forEach((k) => delete itemsCache[k]);

    // Render entries
    if (!data) {
      console.log("No data available");
      const noDataDiv = document.createElement("div");
      noDataDiv.textContent = "No data";
      noDataDiv.className = "text-center text-gray-500 py-4";
      itemsEl.appendChild(noDataDiv);
      //itemsEl.appendChild ="<div>No data</div>";
      return;
    }
    Object.entries(data).forEach(([key, value], idx) => {
      itemsCache[key] = value || {};

      const li = document.createElement("li");
      li.className = `m-0 p-3 flex justify-between items-center transition ${
        idx % 2 === 0 ? "bg-white" : "bg-white"
      } hover:bg-[#caf0f8] `;

      const day = value?.date?.split("-")[2] || "0";
      const horas = value?.horas || "0";
      const est = value?.est || "0";

      li.innerHTML = `
        <span class="flex-1 text-center text-[#0096c7] font-medium">${escapeHtml(
          day
        )}</span>
        <span class="flex-1 text-center text-[#0096c7]">${escapeHtml(
          horas
        )}</span>
        <span class="flex-1 text-center text-[#0096c7]">${escapeHtml(
          est
        )}</span>
        <div class="w-40 flex items-center justify-center gap-2">
          <button data-key="${key}" class=" edit-btn text-[#023e8a] p-2 rounded-md hover:bg-green-100 transition cursor-pointer" aria-label="Edit record" title="Edit">
        <!-- pencil icon -->
        <span class="material-symbols-outlined" style="font-size: 20px;">edit</span>
          </button>
          <button data-key="${key}" class="remove-btn text-[red] p-2 rounded-md hover:bg-[#e0fbff] transition cursor-pointer" aria-label="Delete record" title="Delete">
        <!-- trash icon -->
        <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
          </button>
        </div>
      `;

      itemsEl.appendChild(li);
    });

    // attach delete handlers
    itemsEl.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const key = btn.getAttribute("data-key");
        if (!key) return;
        // confirmation alert before deleting
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
          await writeData(`${currentPath}/${key}`, null); // remove by setting null
        } catch (err) {
          console.error("remove failed", err);
        }
      });
    });

    // attach edit handlers
    itemsEl.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const key = btn.getAttribute("data-key");
        if (!key) return;
        console.log("Editing key:", key, itemsCache[key]);
        openEditDialog(key, itemsCache[key] || {});
      });
    });

    // attach handler for the add button (guard against null)
  }

  // subscribe realtime updates
  const unsubscribe = subscribeToPath(currentPath, (val) => {
    renderList(val);
  });

  // open add dialog

  // refresh manual read
  /*   refreshBtn.addEventListener("click", async () => {
    try {
      const data = await getData(currentPath);
      console.log("Manual refresh data:", data);
      renderList(data);
    } catch (err) {
      console.error("refresh failed", err);
    }
  }); */

  // cleanup when the page is replaced (optional)
  // return unsubscribe; // if caller wants to keep the unsubscribe function
}

// very small helper
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* -------- Edit dialog helpers -------- */
function createEditDialog() {
  if (document.getElementById("edit-dialog")) return;

  const modal = document.createElement("div");
  modal.id = "edit-dialog";
  modal.className =
    "fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-40";
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-6">
  <h3 class="text-xl font-bold text-gray-800 mb-4">Edit Record</h3>
  <form id="edit-form" class="space-y-5">
    
    <!-- Date -->
    <div>
      <label for="edit-date" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
      <input id="edit-date" type="date" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
    </div>

    <!-- Hours -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Hours (hours + minutes)</label>
      <div class="flex gap-3">
        <input
          id="edit-horas-hours"
          type="number"
          min="0"
          step="1"
          placeholder="Hours"
          class="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          
        />
        <input
          id="edit-horas-minutes"
          type="number"
          min="0"
          max="59"
          step="1"
          placeholder="Minutes"
          class="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
         
        />
      </div>
      <input id="edit-horas" type="hidden" />
    </div>

    <!-- Studies -->
    <div>
      <label for="edit-est" class="block text-sm font-medium text-gray-700 mb-1">Studies</label>
      <input id="edit-est" type="number" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
    </div>

    <!-- Buttons -->
    <div class="flex justify-end gap-3 pt-4">
  <button type="button" id="edit-cancel" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition cursor-pointer">Cancel</button>
  <button type="submit" id="edit-save" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer">Save</button>
    </div>
  </form>
</div>
`;
  document.body.appendChild(modal);

  // hook events
  const editForm = modal.querySelector("#edit-form");
  const cancelBtn = modal.querySelector("#edit-cancel");
  const editHorasHours = modal.querySelector("#edit-horas-hours");
  const editHorasMinutes = modal.querySelector("#edit-horas-minutes");

  let currentEditKey = null;
  //const auth = getAuth();
  const user = auth.currentUser;
  const userName = user?.displayName || user?.email?.split("@")[0] || "Henry";
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  let currentPath = `/control/${userName}/${currentYear}/${currentMonth}`;

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("edit-date").value.trim();
    const horas = document.getElementById("edit-horas").value || 0;
    const est = parseInt(document.getElementById("edit-est").value, 10) || 0;
    if (!currentEditKey) return closeDialog();
    console.log("Would update:", { date, horas, est });

    try {
      await updateData(`${currentPath}/${currentEditKey}`, {
        date,
        horas,
        est,
      });
    } catch (err) {
      console.error("update failed", err);
      alert("Update failed, see console.");
    } finally {
      closeDialog();
    }
  });

  editHorasHours.addEventListener("input", () => {
    updateDecimalHours();
  });
  editHorasMinutes.addEventListener("input", () => {
    updateDecimalHours();
  });
  cancelBtn.addEventListener("click", () => {
    closeDialog();
  });
  cancelBtn.addEventListener("click", () => {
    closeDialog();
  });

  // close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDialog();
  });

  // expose open/close via window for simplicity
  window.__openEditDialog = (key, data) => {
    currentEditKey = key;
    const fullhours = data && data.horas ? data.horas : 0;
    const hrs = fullhours.split(":")[0];
    const mins = fullhours.split(":")[1];
    document.getElementById("edit-horas-hours").value = hrs;
    document.getElementById("edit-horas-minutes").value = mins;
    document.getElementById("edit-date").value =
      data && data.date ? data.date : "";
    console.log("Editing horas:", data && data.date ? data.date : 0);
    document.getElementById("edit-horas").value = fullhours;
    console.log("Parsed horas:", data && data.horas ? data.horas : 0);
    document.getElementById("edit-est").value =
      data && data.est ? data.est : "";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.getElementById("edit-date").focus();
  };

  window.__closeEditDialog = () => {
    currentEditKey = null;
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  };
}

function openEditDialog(key, data) {
  if (!document.getElementById("edit-dialog")) createEditDialog();
  window.__openEditDialog(key, data);
}

function closeDialog() {
  if (window.__closeEditDialog) window.__closeEditDialog();
}

function updateDecimalHours() {
  const hours = Number(document.getElementById("edit-horas-hours").value || 0);
  const minutes = Number(
    document.getElementById("edit-horas-minutes").value || 0
  );
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");

  const timeString = `${formattedHours}:${formattedMinutes}`;
  document.getElementById("edit-horas").value = timeString;

  //const total = (hours + minutes / 60).toFixed(2);
  console.log("Updating decimal hours to:", timeString);
  //document.getElementById('edit-horas').value = total;
}

/* -------- Add dialog helpers -------- */
function createAddDialog() {
  if (document.getElementById("add-dialog")) return;

  const modal = document.createElement("div");
  modal.id = "add-dialog";
  modal.className =
    "fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-40";
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-6">
      <h3 class="text-xl font-bold text-gray-800 mb-4">Add New Record</h3>
      <form id="add-form" class="space-y-5">
        
        <!-- Date -->
        <div>
          <label for="add-date" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input id="add-date" type="date" required class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>

        <!-- Hours -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Hours (hours + minutes)</label>
          <div class="flex gap-3">
            <input
              id="add-horas-hours"
              type="number"
              min="0"
              step="1"
              placeholder="Hours"
              class="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <input
              id="add-horas-minutes"
              type="number"
              min="0"
              max="59"
              step="1"
              placeholder="Minutes"
              class="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <input id="add-horas" type="hidden" />
        </div>

        <!-- Studies -->
        <div>
          <label for="add-est" class="block text-sm font-medium text-gray-700 mb-1">Studies</label>
          <input id="add-est" type="number" min="0" step="1" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" id="add-cancel" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition cursor-pointer">Cancel</button>
          <button type="submit" id="add-save" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer">Add Record</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // hook events
  const addForm = modal.querySelector("#add-form");
  const cancelBtn = modal.querySelector("#add-cancel");
  const addHorasHours = modal.querySelector("#add-horas-hours");
  const addHorasMinutes = modal.querySelector("#add-horas-minutes");

  //const currentPath = "/control/Henry/2023/0";

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("add-date").value.trim();
    const horas = document.getElementById("add-horas").value || "00:00";
    const est = parseInt(document.getElementById("add-est").value, 10) || 0;

    if (!date) {
      alert("Please enter a date");
      return;
    }

    console.log("Adding new record:", { date, horas, est });

    try {
      await pushData(currentPath, {
        date,
        horas,
        est,
        createdAt: Date.now(),
      });
      closeAddDialog();
    } catch (err) {
      console.error("add failed", err);
      alert("Add failed, see console.");
    }
  });

  addHorasHours.addEventListener("input", () => {
    updateAddDecimalHours();
  });
  addHorasMinutes.addEventListener("input", () => {
    updateAddDecimalHours();
  });

  cancelBtn.addEventListener("click", () => {
    closeAddDialog();
  });

  // close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAddDialog();
  });

  // expose open/close via window for simplicity
  window.__openAddDialog = () => {
    // Reset form fields
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("add-date").value = today;
    document.getElementById("add-horas-hours").value = "";
    document.getElementById("add-horas-minutes").value = "";
    document.getElementById("add-horas").value = "00:00";
    document.getElementById("add-est").value = "";

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.getElementById("add-date").focus();
  };

  window.__closeAddDialog = () => {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  };
}

function openAddDialog() {
  if (!document.getElementById("add-dialog")) createAddDialog();
  window.__openAddDialog();
}

function closeAddDialog() {
  if (window.__closeAddDialog) window.__closeAddDialog();
}

function updateAddDecimalHours() {
  const hours = Number(document.getElementById("add-horas-hours").value || 0);
  const minutes = Number(
    document.getElementById("add-horas-minutes").value || 0
  );
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");

  const timeString = `${formattedHours}:${formattedMinutes}`;
  document.getElementById("add-horas").value = timeString;
  console.log("Updating add hours to:", timeString);
}
