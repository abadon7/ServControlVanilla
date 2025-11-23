import { auth } from "../firebase.js";
import { createHeader } from "../components/Header.js";
import { createRecordList } from "../components/RecordList.js";
import { createEditDialog } from "../components/EditDialog.js";
import { createAddDialog } from "../components/AddDialog.js";

export function mountApp(target = "#app") {
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
  const initialPath = `/control/${userName}/${currentYear}/${currentMonth}`;
  console.log("Initial currentPath:", initialPath);

  const root = document.querySelector(target);
  if (!root) return;

  // Clear root
  root.innerHTML = "";

  // Create Header
  createHeader(root);

  const main = document.createElement("main");
  main.className = "w-full mx-auto p-4 items-center justify-center flex";
  root.appendChild(main);

  // Create Record List (which includes Summary and Selectors)
  createRecordList(main, initialPath, userName);

  // Initialize Dialogs (they attach themselves to body)
  createEditDialog();
  createAddDialog();
}
