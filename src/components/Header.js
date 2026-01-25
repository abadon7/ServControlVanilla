import { signOutUser } from "../firebase.js";

export function createHeader(target) {
  const header = document.createElement("header");
  header.className = "w-full bg-white dark:bg-gray-800 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-700 shadow-sm px-6 py-4 transition-colors duration-200";

  const isDark = document.documentElement.classList.contains("dark");
  const themeIcon = isDark ? "light_mode" : "dark_mode";

  header.innerHTML = `
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
        <a href="/" class="flex items-center gap-3 group" aria-label="ServControl home">
          <div class="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-xl group-hover:bg-pink-100 dark:group-hover:bg-pink-900/50 transition-colors">
            <img src="/logo.svg" alt="ServControl logo" class="h-8 w-8" />
          </div>
          <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">ServControl</h1>
        </a>
        </div>
        <div class="flex items-center gap-3">
          <button id="theme-toggle" class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="material-symbols-outlined text-[20px]">${themeIcon}</span>
          </button>
          <div class="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <button id="sign-out-btn" class="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
            Sign out
          </button>
        </div>
      </div>
  `;

  target.appendChild(header);

  // Theme Toggle Logic
  const themeBtn = header.querySelector("#theme-toggle");
  const themeIconEl = themeBtn.querySelector("span");

  themeBtn.addEventListener("click", () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      themeIconEl.textContent = "dark_mode";
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      themeIconEl.textContent = "light_mode";
    }
  });

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
