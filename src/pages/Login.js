import { auth, signInWithGoogle, signOutUser, onAuthStateChanged } from "../firebase.js";

function renderUser(user) {
  if (!user) {
    return `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div>
            <div class="mx-auto h-16 w-16 flex items-center justify-center">
              <img src="/logo.svg" alt="ServControl Logo" class="h-16 w-16" />
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              ServControl
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Sign in to manage your services
            </p>
          </div>
          <div class="mt-8 space-y-6">
            <button id="sign-in-btn" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="h-5 w-5 text-blue-500 group-hover:text-blue-400 transition-colors duration-200 bg-white rounded-full p-0.5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </span>
              Sign in with Google
            </button>
          </div>
          <div class="mt-6">
             <p class="text-center text-xs text-gray-400">
               &copy; ${new Date().getFullYear()} ServControl. All rights reserved.
             </p>
          </div>
        </div>
      </div>
    `;
  }

  const { displayName, email, photoURL } = user;
  return `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
       <div class="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <img src="${photoURL || ''}" alt="avatar" class="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-blue-100" />
          <h2 class="text-2xl font-bold text-gray-900 mb-1">${displayName || email}</h2>
          <p class="text-sm text-gray-500 mb-8">${email || ''}</p>
          <button id="sign-out-btn" class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
            Sign out
          </button>
       </div>
    </div>
  `;
}

export function mountLogin(target = "#app") {
  const root = document.querySelector(target);
  if (!root) return;

  // Clear any existing content and setup the container
  root.innerHTML = `<div id="auth-area" class="w-full h-full"></div>`;

  const authArea = root.querySelector("#auth-area");

  function update(user) {
    authArea.innerHTML = renderUser(user);
    const signInBtn = document.getElementById("sign-in-btn");
    const signOutBtn = document.getElementById("sign-out-btn");

    if (signInBtn) {
      signInBtn.addEventListener("click", async () => {
        try {
          await signInWithGoogle();
        } catch (err) {
          console.error("Sign in failed", err);
          alert("Sign in failed. See console for details.");
        }
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener("click", async () => {
        try {
          await signOutUser();
        } catch (err) {
          console.error("Sign out failed", err);
        }
      });
    }
  }

  // subscribe to auth changes using the exported auth instance
  onAuthStateChanged(auth, (user) => {
    update(user);
  });
}