import { signOutUser } from "../firebase.js";

export function createHeader(target) {
  const header = document.createElement("header");
  header.className = "w-full bg-white sticky top-0 z-40 border-b border-gray-100 shadow-sm px-6 py-4";
  header.innerHTML = `
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
        <a href="/" class="flex items-center gap-3 group" aria-label="ServControl home">
          <div class="p-2 bg-pink-50 rounded-xl group-hover:bg-pink-100 transition-colors">
            <img src="/logo.svg" alt="ServControl logo" class="h-8 w-8" />
          </div>
          <h1 class="text-xl font-bold text-gray-800 tracking-tight">ServControl</h1>
        </a>
        </div>
        <div class="flex items-center gap-2">          
          <button id="sign-out-btn" class="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200">
            Sign out
          </button>
        </div>
      </div>
  `;

  target.appendChild(header);

  const btn = header.querySelector("#sign-out-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        await signOutUser();
      } catch (err) {
        console.error("Sign out failed", err);
      }
    });
  }
}
