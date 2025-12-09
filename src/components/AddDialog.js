import { pushData } from "../firebase.js";
import createTimePicker from "./TimePicker.js";

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
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Hours</label>
          <div id="add-timepicker-container" class="border border-gray-200 rounded-xl p-4 bg-gray-50 flex justify-center"></div>
          <input id="add-horas" type="hidden" />
        </div>

        <!-- Studies (Multiple) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Study Names</label>
          <div class="flex gap-2 mb-2">
            <input id="add-est-input" type="text" placeholder="Enter name" class="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block p-2.5 transition-all" />
            <button type="button" id="add-name-btn" class="px-4 py-2 bg-pink-100 text-pink-700 rounded-xl hover:bg-pink-200 font-medium transition-colors">Add</button>
          </div>
          
          <!-- Pending List -->
          <div id="pending-names-list" class="space-y-2 max-h-32 overflow-y-auto">
            <!-- Items will be added here -->
          </div>
          <p class="text-xs text-gray-500 mt-1">Add multiple names. Hours will be applied to the first record.</p>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" id="add-cancel" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-gray-300 transition-all cursor-pointer">Cancel</button>
          <button type="submit" id="add-save" class="px-5 py-2.5 text-sm font-medium text-white bg-pink-600 rounded-xl hover:bg-pink-700 focus:ring-4 focus:ring-pink-200 transition-all shadow-sm shadow-pink-200 cursor-pointer">Save All</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // hook events
  const addForm = modal.querySelector("#add-form");
  const cancelBtn = modal.querySelector("#add-cancel");
  const closeXBtn = modal.querySelector("#add-close-x");
  const timePickerContainer = modal.querySelector("#add-timepicker-container");
  const addNameBtn = modal.querySelector("#add-name-btn");
  const nameInput = modal.querySelector("#add-est-input");
  const pendingList = modal.querySelector("#pending-names-list");

  // Initialize TimePicker
  const picker = createTimePicker({ initial: "00:00" });
  timePickerContainer.appendChild(picker.element);

  // Hide internal buttons
  const pickerButtons = picker.element.querySelector('.tp-actions');
  if (pickerButtons) pickerButtons.style.display = 'none';

  picker.onChange = (val) => {
    document.getElementById("add-horas").value = val;
  };

  let currentPath = null;
  let validateFn = null;
  let pendingNames = [];

  const renderPendingNames = () => {
    pendingList.innerHTML = "";
    pendingNames.forEach((name, index) => {
      const div = document.createElement("div");
      div.className = "flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100";
      div.innerHTML = `
            <span class="text-sm text-gray-700 font-medium">${name}</span>
            <button type="button" data-index="${index}" class="remove-pending-btn text-gray-400 hover:text-red-500">
                <span class="material-symbols-outlined text-lg">close</span>
            </button>
        `;
      pendingList.appendChild(div);
    });

    // Attach remove handlers
    pendingList.querySelectorAll(".remove-pending-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"));
        pendingNames.splice(idx, 1);
        renderPendingNames();
      });
    });
  };

  addNameBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) return;

    const date = document.getElementById("add-date").value;

    // Validate against DB
    if (validateFn) {
      const error = validateFn(date, name);
      if (error) {
        alert(error);
        return;
      }
    }

    // Validate against pending list
    if (pendingNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      alert("Name already in pending list.");
      return;
    }

    pendingNames.push(name);
    nameInput.value = "";
    renderPendingNames();
    nameInput.focus();
  });

  // Allow Enter key to add name
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNameBtn.click();
    }
  });

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("add-date").value.trim();
    const horas = document.getElementById("add-horas").value || "00:00";

    if (!date) {
      alert("Please enter a date");
      return;
    }
    /* if (pendingNames.length === 0) {
      alert("Please add at least one name");
      return;
    } */

    if (!currentPath) {
      console.error("No current path set for adding record");
      return;
    }

    console.log("Adding records:", { date, horas, names: pendingNames });

    try {
      // Save as a single record with array of names
      await pushData(currentPath, {
        date,
        horas,
        est: pendingNames, // Save array
        createdAt: Date.now(),
      });
      closeAddDialog();
    } catch (err) {
      console.error("add failed", err);
      alert("Add failed, see console.");
    }
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
  window.__openAddDialog = (path, validator) => {
    currentPath = path;
    validateFn = validator;
    pendingNames = [];
    renderPendingNames();

    // Reset form fields
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("add-date").value = today;

    // Reset picker
    picker.setValue("00:00");
    document.getElementById("add-horas").value = "00:00";

    document.getElementById("add-est-input").value = "";

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.getElementById("add-date").focus();
  };

  window.__closeAddDialog = () => {
    currentPath = null;
    validateFn = null;
    pendingNames = [];
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  };
}

export function openAddDialog(path, validator) {
  if (!document.getElementById("add-dialog")) createAddDialog();
  window.__openAddDialog(path, validator);
}

function closeAddDialog() {
  if (window.__closeAddDialog) window.__closeAddDialog();
}
