import { auth, ADMIN_EMAIL, FIREBASE_CONFIG_READY } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const logoutButtons = document.querySelectorAll("[data-logout]");
const userEmailTexts = document.querySelectorAll("[data-user-email]");
const userNameTexts = document.querySelectorAll("[data-user-name]");
const adminLinks = document.querySelectorAll("[data-admin-only]");
const authLinks = document.querySelectorAll("[data-auth-link]");
const guestLinks = document.querySelectorAll("[data-guest-link]");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");

function setMessage(element, text, type = "") {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function friendlyError(error) {
  const code = error?.code || "";

  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Email ou senha inválidos.";
  }

  if (code.includes("email-already-in-use")) {
    return "Esse email já está cadastrado.";
  }

  if (code.includes("weak-password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (code.includes("invalid-email")) {
    return "Digite um email válido.";
  }

  return "Não foi possível concluir. Tente novamente.";
}

function ensureFirebaseReady(messageElement) {
  if (FIREBASE_CONFIG_READY) return true;
  setMessage(messageElement, "Configure suas chaves do Firebase em firebase-config.js antes de usar login real.", "error");
  return false;
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!ensureFirebaseReady(loginMessage)) return;

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    setMessage(loginMessage, "Login realizado com sucesso.", "success");

    if (credential.user.email === ADMIN_EMAIL) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "perfil.html";
    }
  } catch (error) {
    setMessage(loginMessage, friendlyError(error), "error");
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!ensureFirebaseReady(registerMessage)) return;

  const name = document.getElementById("registerName")?.value.trim();
  const email = document.getElementById("registerEmail")?.value.trim();
  const password = document.getElementById("registerPassword")?.value.trim();

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(credential.user, { displayName: name });
    setMessage(registerMessage, "Conta criada com sucesso.", "success");
    window.location.href = "perfil.html";
  } catch (error) {
    setMessage(registerMessage, friendlyError(error), "error");
  }
});

resetPasswordBtn?.addEventListener("click", async () => {
  if (!ensureFirebaseReady(loginMessage)) return;

  const email = document.getElementById("loginEmail")?.value.trim();
  if (!email) {
    setMessage(loginMessage, "Digite seu email no campo de login para receber o link.", "error");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    setMessage(loginMessage, "Link de recuperação enviado para seu email.", "success");
  } catch (error) {
    setMessage(loginMessage, friendlyError(error), "error");
  }
});

logoutButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (FIREBASE_CONFIG_READY) await signOut(auth);
    window.location.href = "login.html";
  });
});

onAuthStateChanged(auth, (user) => {
  const isAdmin = Boolean(user?.email && user.email === ADMIN_EMAIL);
  const page = document.body.dataset.page;

  userEmailTexts.forEach((element) => {
    element.textContent = user?.email || "Visitante";
  });

  userNameTexts.forEach((element) => {
    element.textContent = user?.displayName || user?.email?.split("@")[0] || "Cliente VOID";
  });

  adminLinks.forEach((element) => {
    element.style.display = isAdmin ? "inline-flex" : "none";
  });

  authLinks.forEach((element) => {
    element.style.display = user ? "inline-flex" : "none";
  });

  guestLinks.forEach((element) => {
    element.style.display = user ? "none" : "inline-flex";
  });

  if (page === "admin") {
    if (!FIREBASE_CONFIG_READY) {
      const guard = document.getElementById("adminGuardMessage");
      if (guard) guard.textContent = "Configure o Firebase em firebase-config.js para liberar o painel admin.";
      return;
    }

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    if (!isAdmin) {
      window.location.href = "index.html";
    }
  }

  if (page === "profile" && FIREBASE_CONFIG_READY && !user) {
    window.location.href = "login.html";
  }
});
