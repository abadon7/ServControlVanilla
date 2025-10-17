import { auth, signInWithGoogle, signOutUser, onAuthStateChanged } from "../firebase.js";

function renderUser(user) {
  if (!user) {
    return `
      <div class="text-center">
        <h1 class="text-2xl font-semibold mb-4">Sign in</h1>
        <button id="sign-in-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Sign in with Google
        </button>
      </div>
    `;
  }

  const { displayName, email, photoURL } = user;
  return `
    <div class="text-center">
      <img src="${photoURL || ''}" alt="avatar" class="w-20 h-20 rounded-full mx-auto mb-4" />
      <h2 class="text-xl font-medium">${displayName || email}</h2>
      <p class="text-sm text-gray-500 mb-4">${email || ''}</p>
      <button id="sign-out-btn" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Sign out</button>
    </div>
  `;
}

export function mountLogin(target = "#app") {
  const root = document.querySelector(target);
  if (!root) return;

  root.innerHTML = `
    <div class="w-full max-w-md mx-auto p-6 bg-white rounded shadow">
      <div id="auth-area"></div>
    </div>
  `;

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