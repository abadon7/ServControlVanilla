import { auth } from "../firebase.js";

export function createSummary(target, totalHoras, totalEst) {
    const summary = document.createElement("div");
    summary.className = "w-full mb-8";

    const user = auth.currentUser || {};
    const photoURL = user.photoURL || "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";
    const displayName = user.displayName || "Google user";

    summary.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Welcome Card -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <img src="${photoURL}" alt="${displayName}" class="h-14 w-14 rounded-full border-2 border-pink-100 shadow-sm" />
        <div>
          <p class="text-sm font-medium text-gray-500">Welcome back,</p>
          <h2 class="text-xl font-bold text-gray-900 truncate">${displayName}</h2>
        </div>
      </div>

      <!-- Hours Card -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">Total Hours</p>
          <p class="text-3xl font-bold text-gray-900">${totalHoras}</p>
        </div>
        <div class="h-12 w-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
          <span class="material-symbols-outlined text-2xl">schedule</span>
        </div>
      </div>

      <!-- Studies Card -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">Total Studies</p>
          <p class="text-3xl font-bold text-gray-900">${totalEst}</p>
        </div>
        <div class="h-12 w-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
          <span class="material-symbols-outlined text-2xl">local_library</span>
        </div>
      </div>

    </div>
  `;

    // Clear previous content
    target.innerHTML = '';
    target.appendChild(summary);
}
