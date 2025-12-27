// script.js
import { FIREBASE_API_KEY } from "./config.js";

const BASE_URL = "https://identitytoolkit.googleapis.com/v1";

/* =========================
   DOM ELEMENTS
========================= */
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileBtn = document.getElementById("profileBtn");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const successEl = document.getElementById("success");
const resultEl = document.getElementById("result");
const themeToggle = document.getElementById("themeToggle");

/* =========================
   STORAGE KEYS
========================= */
const TOKEN_KEY = "fb_idToken";
const THEME_KEY = "fb_theme";

/* =========================
   UI HELPERS
========================= */
function setLoading(on) {
  loadingEl.classList.toggle("hidden", !on);
  registerBtn.disabled = on;
  loginBtn.disabled = on;
  profileBtn.disabled = on || !getToken();
  logoutBtn.disabled = on || !getToken();
}

function showError(msg) {
  errorEl.textContent = `❌ ${msg}`;
  errorEl.classList.remove("hidden");
  successEl.classList.add("hidden");
}

function showSuccess(msg) {
  successEl.textContent = `✅ ${msg}`;
  successEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
}

function clearMessages() {
  errorEl.classList.add("hidden");
  successEl.classList.add("hidden");
}

/* =========================
   AUTH TOKEN HANDLING
========================= */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  syncUI();
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  syncUI();
}

function syncUI() {
  const loggedIn = !!getToken();
  profileBtn.disabled = !loggedIn;
  logoutBtn.disabled = !loggedIn;
}

/* =========================
   INPUT VALIDATION
========================= */
function validateInputs() {
  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!email || !password) {
    throw new Error("Fields cannot be empty.");
  }
  if (!email.includes("@") || !email.includes(".")) {
    throw new Error("Invalid email format.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  return { email, password };
}

/* =========================
   FIREBASE REST HELPER
========================= */
async function firebasePost(endpoint, body) {
  if (!FIREBASE_API_KEY || FIREBASE_API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("Missing API key in config.js");
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error (failed API call).");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Request failed.");
  }

  return data;
}

/* =========================
   AUTH ACTIONS
========================= */
async function register() {
  clearMessages();
  setLoading(true);
  resultEl.textContent = "";

  try {
    const { email, password } = validateInputs();

    const data = await firebasePost("/accounts:signUp", {
      email,
      password,
      returnSecureToken: true,
    });

    saveToken(data.idToken);
    passwordEl.value = "";
    showSuccess("Registration successful.");
    resultEl.textContent = JSON.stringify({ email: data.email }, null, 2);
  } catch (e) {
    showError(e.message);
  } finally {
    setLoading(false);
  }
}

async function login() {
  clearMessages();
  setLoading(true);
  resultEl.textContent = "";

  try {
    const { email, password } = validateInputs();

    const data = await firebasePost("/accounts:signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });

    saveToken(data.idToken);
    passwordEl.value = "";
    showSuccess("Login successful.");
    resultEl.textContent = JSON.stringify({ email: data.email }, null, 2);
  } catch (e) {
    showError(e.message);
  } finally {
    setLoading(false);
  }
}

async function fetchProfile() {
  clearMessages();
  setLoading(true);
  resultEl.textContent = "";

  try {
    const token = getToken();
    if (!token) throw new Error("Not authenticated.");

    const data = await firebasePost("/accounts:lookup", { idToken: token });
    resultEl.textContent = JSON.stringify(data.users[0], null, 2);
    showSuccess("Profile fetched.");
  } catch (e) {
    showError(e.message);
  } finally {
    setLoading(false);
  }
}

/* =========================
   THEME HANDLING
========================= */
function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.onclick = () => {
  const nextTheme =
    (localStorage.getItem(THEME_KEY) || "dark") === "dark"
      ? "light"
      : "dark";
  applyTheme(nextTheme);
};

/* =========================
   EVENTS
========================= */
registerBtn.onclick = register;
loginBtn.onclick = login;
profileBtn.onclick = fetchProfile;

logoutBtn.onclick = () => {
  clearToken();
  resultEl.textContent = "";
  showSuccess("Logged out.");
};

/* =========================
   INIT
========================= */
applyTheme(localStorage.getItem(THEME_KEY) || "dark");
syncUI();
