"use strict";
/* =========================================================
   auth.js — WBS B1–B3: validation engine, login, registration,
   account switching
   ========================================================= */

const Auth = (() => {
  /* ---------- B1: validation engine ---------- */
  const rules = {
    fullName: v => v.length >= 2 || "Enter your full name (at least 2 characters).",
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "Enter a valid email address.",
    username: v => /^[A-Za-z0-9_]{3,20}$/.test(v) || "3–20 characters: letters, numbers or underscore.",
    password: v => v.length >= 6 || "Password must be at least 6 characters."
  };

  /** Validate only the listed fields; returns {field: message}. */
  function validate(values, fields) {
    const errors = {};
    fields.forEach(f => {
      const res = rules[f](values[f] ?? "");
      if (res !== true) errors[f] = res;
    });
    return errors;
  }

  /** Uniqueness check for email / username (ignoring one user id). */
  function uniqueErrors(values, exceptId = null) {
    const errors = {};
    const list = Store.users().filter(u => u.id !== exceptId);
    if (values.email && list.some(u => u.email.toLowerCase() === values.email.toLowerCase())) {
      errors.email = "This email is already registered.";
    }
    if (values.username && list.some(u => u.username.toLowerCase() === values.username.toLowerCase())) {
      errors.username = "This username is already taken.";
    }
    return errors;
  }

  /* ---------- B2: register / login ---------- */
  function register(values) {
    const errors = {
      ...uniqueErrors(values),
      ...validate(values, ["fullName", "email", "username", "password"])
    };
    if (Object.keys(errors).length) return { ok: false, errors };
    const user = Store.createUser(values);
    Store.setSession(user.id);
    return { ok: true, user };
  }

  function login(identifier, password) {
    if (!identifier.trim()) return { ok: false, error: "Enter your email or username." };
    if (!password) return { ok: false, error: "Enter your password." };
    const user = Store.findByIdentifier(identifier);
    if (!user || user.password !== password) return { ok: false, error: "Invalid email/username or password." };
    Store.setSession(user.id);
    return { ok: true, user };
  }

  /* ---------- B3: account switch / logout ---------- */
  function switchTo(userId, password) {
    const user = Store.users().find(u => u.id === userId);
    if (!user) return { ok: false, error: "Account not found." };
    if (user.password !== password) return { ok: false, error: "Incorrect password." };
    Store.setSession(user.id);
    return { ok: true, user };
  }

  function logout() {
    Store.setSession(null);
    showAuth("login");
  }

  /* ---------- UI ---------- */
  function showAuth(which = "login") {
    $("#appView").classList.add("hidden");
    $("#authView").classList.remove("hidden");
    $("#loginForm").hidden = which !== "login";
    $("#registerForm").hidden = which !== "register";
    $$("[data-err]").forEach(s => (s.textContent = ""));
  }

  function setErrors(form, errors) {
    $$("[data-err]", form).forEach(s => (s.textContent = errors[s.dataset.err] || ""));
  }

  function init() {
    $("#goRegister").addEventListener("click", () => showAuth("register"));
    $("#goLogin").addEventListener("click", () => showAuth("login"));

    $("#loginForm").addEventListener("submit", e => {
      e.preventDefault();
      const f = e.target;
      const res = login(f.identifier.value, f.password.value);
      if (!res.ok) { setErrors(f, { password: res.error }); return; }
      f.reset(); setErrors(f, {});
      App.start();
    });

    $("#registerForm").addEventListener("submit", e => {
      e.preventDefault();
      const f = e.target;
      const values = {
        fullName: f.fullName.value.trim(), email: f.email.value.trim(),
        username: f.username.value.trim(), password: f.password.value
      };
      const res = register(values);
      if (!res.ok) { setErrors(f, res.errors); return; }
      f.reset(); setErrors(f, {});
      toast("Account created. Welcome!");
      App.start();
    });
  }

  return { init, validate, uniqueErrors, register, login, switchTo, logout, showAuth };
})();
