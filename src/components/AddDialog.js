import { pushData } from "../firebase.js";

export function createAddDialog() {
  if (document.getElementById("add-dialog")) return;

  const modal = document.createElement("div");
  modal.id = "add-dialog";
  modal.className =
    "fixed inset-0 z-50 hidden items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity";
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all scale-100">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 class="text-lg font-bold text-gray-900">Add New Record</h3>
        <button type="button" id="add-close-x" class="text-gray-400 hover:text-gray-600 transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <form id="add-form" class="p-6 space-y-5">
        
        <!-- Date -->
        <div>
          <label for="add-date" class="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
          <input id="add-date" type="date" required class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5 transition-all" />
        </div>

        <!-- Hours -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Hours (hours : minutes)</label>
          <div class="flex gap-3">
            <div class="relative w-1/2">
              <input
                id="add-horas-hours"
                type="number"
                min="0"
                step="1"
                placeholder="00"
                class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5 transition-all text-center"
              />
              <span class="absolute right-3 top-2.5 text-gray-400 text-xs font-medium">hr</span>
            </div>
            <span class="text-gray-400 font-bold self-center">:</span>
            <div class="relative w-1/2">
              <input
                id="add-horas-minutes"
                type="number"
                min="0"
                max="59"
                step="1"
                placeholder="00"
                class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5 transition-all text-center"
              />
              <span class="absolute right-3 top-2.5 text-gray-400 text-xs font-medium">min</span>
            </div>
          </div>
          <input id="add-horas" type="hidden" />
        </div>

        <!-- Studies -->
        <div>
          <label for="add-est" class="block text-sm font-medium text-gray-700 mb-1.5">Studies</label>
          <input id="add-est" type="number" min="0" step="1" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5 transition-all" />
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" id="add-cancel" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-gray-300 transition-all cursor-pointer">Cancel</button>
          <button type="submit" id="add-save" class="px-5 py-2.5 text-sm font-medium text-white bg-pink-600 rounded-xl hover:bg-pink-700 focus:ring-4 focus:ring-pink-200 transition-all shadow-sm shadow-pink-200 cursor-pointer">Add Record</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // hook events
  const addForm = modal.querySelector("#add-form");
  const cancelBtn = modal.querySelector("#add-cancel");
  const closeXBtn = modal.querySelector("#add-close-x");
  const addHorasHours = modal.querySelector("#add-horas-hours");
  const addHorasMinutes = modal.querySelector("#add-horas-minutes");

  let currentPath = null;

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("add-date").value.trim();
    const horas = document.getElementById("add-horas").value || "00:00";
    const est = parseInt(document.getElementById("add-est").value, 10) || 0;

    if (!date) {
      alert("Please enter a date");
      return;
    }
    if (!currentPath) {
      console.error("No current path set for adding record");
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
  closeXBtn.addEventListener("click", () => {
    closeAddDialog();
  });

  // close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAddDialog();
  });

  // expose open/close via window for simplicity
  window.__openAddDialog = (path) => {
    currentPath = path;
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
    currentPath = null;
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  };
}

export function openAddDialog(path) {
  if (!document.getElementById("add-dialog")) createAddDialog();
  window.__openAddDialog(path);
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
}
