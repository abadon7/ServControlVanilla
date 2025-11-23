import { updateData } from "../firebase.js";

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
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Hours (hours : minutes)</label>
          <div class="flex gap-3">
            <div class="relative w-1/2">
              <input
                id="edit-horas-hours"
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
                id="edit-horas-minutes"
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
          <input id="edit-horas" type="hidden" />
        </div>

        <!-- Studies -->
        <div>
          <label for="edit-est" class="block text-sm font-medium text-gray-700 mb-1.5">Studies</label>
          <input id="edit-est" type="number" class="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block w-full p-2.5 transition-all" />
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
    const editHorasHours = modal.querySelector("#edit-horas-hours");
    const editHorasMinutes = modal.querySelector("#edit-horas-minutes");

    let currentEditKey = null;
    let currentPath = null;

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const date = document.getElementById("edit-date").value.trim();
        const horas = document.getElementById("edit-horas").value || 0;
        const est = parseInt(document.getElementById("edit-est").value, 10) || 0;
        if (!currentEditKey || !currentPath) return closeDialog();
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
        const fullhours = data && data.horas ? data.horas : 0;
        const hrs = fullhours.toString().split(":")[0];
        const mins = fullhours.toString().split(":")[1];
        document.getElementById("edit-horas-hours").value = hrs;
        document.getElementById("edit-horas-minutes").value = mins;
        document.getElementById("edit-date").value =
            data && data.date ? data.date : "";
        document.getElementById("edit-horas").value = fullhours;
        document.getElementById("edit-est").value =
            data && data.est ? data.est : "";
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

function updateDecimalHours() {
    const hours = Number(document.getElementById("edit-horas-hours").value || 0);
    const minutes = Number(
        document.getElementById("edit-horas-minutes").value || 0
    );
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");

    const timeString = `${formattedHours}:${formattedMinutes}`;
    document.getElementById("edit-horas").value = timeString;
}
