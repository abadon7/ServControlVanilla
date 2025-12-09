import { updateData } from "../firebase.js";
import { showNotification } from "./Notification.js";
import createTimePicker from "./TimePicker.js";

export function createEditDialog() {
  if (document.getElementById("edit-dialog")) return;

  const modal = document.createElement("div");
  modal.id = "edit-dialog";
  modal.className =
    "fixed inset-0 z-50 hidden items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity";
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all scale-100">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 class="text-lg font-bold text-gray-900">Edit Record</h3>
        <button type="button" id="edit-close-x" class="text-gray-400 hover:text-gray-600 transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <form id="edit-form" class="p-6 space-y-5">
        
        <!-- Date -->
        <div>
          <label for="edit-date" class="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
          <input id="edit-date" type="date" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5 transition-all" />
        </div>

        <!-- Hours -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Hours</label>
          <div id="edit-timepicker-container" class="border border-gray-200 rounded-xl p-4 bg-gray-50 flex justify-center"></div>
          <input id="edit-horas" type="hidden" />
        </div>

        <!-- Studies -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Study Names</label>
          <div class="flex gap-2 mb-2">
            <input id="edit-est-input" type="text" placeholder="Enter name" class="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block p-2.5 transition-all" />
            <button type="button" id="edit-name-btn" class="px-4 py-2 bg-pink-100 text-pink-700 rounded-xl hover:bg-pink-200 font-medium transition-colors">Add</button>
          </div>
          
          <!-- Pending List -->
          <div id="edit-pending-names-list" class="space-y-2 max-h-32 overflow-y-auto">
            <!-- Items will be added here -->
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" id="edit-cancel" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-gray-300 transition-all cursor-pointer">Cancel</button>
          <button type="submit" id="edit-save" class="px-5 py-2.5 text-sm font-medium text-white bg-pink-600 rounded-xl hover:bg-pink-700 focus:ring-4 focus:ring-pink-200 transition-all shadow-sm shadow-pink-200 cursor-pointer">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // hook events
  const editForm = modal.querySelector("#edit-form");
  const cancelBtn = modal.querySelector("#edit-cancel");
  const closeXBtn = modal.querySelector("#edit-close-x");
  const timePickerContainer = modal.querySelector("#edit-timepicker-container");
  const editNameBtn = modal.querySelector("#edit-name-btn");
  const nameInput = modal.querySelector("#edit-est-input");
  const pendingList = modal.querySelector("#edit-pending-names-list");

  // Initialize TimePicker
  const picker = createTimePicker({ initial: "00:00" });
  timePickerContainer.appendChild(picker.element);

  // Hide internal buttons
  const pickerButtons = picker.element.querySelector('.tp-actions');
  if (pickerButtons) pickerButtons.style.display = 'none';

  picker.onChange = (val) => {
    document.getElementById("edit-horas").value = val;
  };

  let currentEditKey = null;
  let currentPath = null;
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

  editNameBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) return;

    // Validate against pending list
    if (pendingNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      alert("Name already in list.");
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
      editNameBtn.click();
    }
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("edit-date").value.trim();
    const horas = document.getElementById("edit-horas").value || 0;

    if (!currentEditKey || !currentPath) return closeDialog();
    if (pendingNames.length === 0) {
      alert("Please add at least one name");
      return;
    }

    console.log("Would update:", { date, horas, est: pendingNames });

    try {
      await updateData(`${currentPath}/${currentEditKey}`, {
        date,
        horas,
        est: pendingNames
      });
      showNotification("Record updated successfully");
    } catch (err) {
      console.error("update failed", err);
      showNotification("Failed to update record", "error");
    } finally {
      closeDialog();
    }
  });

  cancelBtn.addEventListener("click", () => {
    closeDialog();
  });
  closeXBtn.addEventListener("click", () => {
    closeDialog();
  });

  // close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDialog();
  });

  // expose open/close via window for simplicity
  window.__openEditDialog = (key, data, path) => {
    currentEditKey = key;
    currentPath = path;
    const fullhours = data && data.horas ? data.horas : "00:00";

    // Set picker value
    picker.setValue(fullhours);
    document.getElementById("edit-horas").value = fullhours;

    document.getElementById("edit-date").value =
      data && data.date ? data.date : "";

    // Initialize pending names
    pendingNames = [];
    if (data && data.est) {
      if (Array.isArray(data.est)) {
        pendingNames = [...data.est];
      } else {
        // Handle legacy string or comma-separated string
        pendingNames = String(data.est).split(",").map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    renderPendingNames();
    document.getElementById("edit-est-input").value = "";

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.getElementById("edit-date").focus();
  };

  window.__closeEditDialog = () => {
    currentEditKey = null;
    currentPath = null;
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  };
}

export function openEditDialog(key, data, path) {
  if (!document.getElementById("edit-dialog")) createEditDialog();
  window.__openEditDialog(key, data, path);
}

function closeDialog() {
  if (window.__closeEditDialog) window.__closeEditDialog();
}
