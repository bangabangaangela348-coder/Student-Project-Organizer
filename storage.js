"use strict";
/* =========================================================
   storage.js — LocalStorage state, multi-user store, seed data
   Keys:
     spm_users       -> [{id, fullName, email, username, password}]
     spm_session     -> id of the logged-in user
     spm_data_<id>   -> { subjects, activities, notifs }   (one per user)
     spm_theme       -> "dark" | "light"
   NOTE: passwords are stored in plain text — fine for a classroom
   demo, but a real app needs a backend and hashed passwords.
   ========================================================= */

const Store = (() => {
  const K_USERS = "spm_users", K_SESSION = "spm_session", K_THEME = "spm_theme";
  const dataKey = id => `spm_data_${id}`;

  const read = (k, fallback) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback; }
    catch { return fallback; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const emptyData = () => ({ subjects: [], activities: [], notifs: [] });

  let userId = null;
  let cache = null;

  function load() {
    userId = read(K_SESSION, null);
    cache = null;
    if (userId && users().some(u => u.id === userId)) {
      cache = read(dataKey(userId), null);
      if (!cache) { cache = emptyData(); write(dataKey(userId), cache); }
      cache.subjects ||= []; cache.activities ||= []; cache.notifs ||= [];
    } else {
      userId = null;
    }
  }

  /* ----- users ----- */
  function users() { return read(K_USERS, []); }
  function saveUsers(list) { write(K_USERS, list); }
  function findByIdentifier(identifier) {
    const id = identifier.trim().toLowerCase();
    return users().find(u => u.email.toLowerCase() === id || u.username.toLowerCase() === id) || null;
  }
  function createUser({ fullName, email, username, password }) {
    const user = { id: uid(), fullName, email: email.toLowerCase(), username, password };
    const list = users(); list.push(user); saveUsers(list);
    write(dataKey(user.id), emptyData());
    return user;
  }
  function updateUser(id, patch) {
    const list = users();
    const u = list.find(x => x.id === id);
    if (!u) return null;
    Object.assign(u, patch);
    saveUsers(list);
    return u;
  }

  /* ----- session ----- */
  function setSession(id) {
    if (id) write(K_SESSION, id); else localStorage.removeItem(K_SESSION);
    load();
  }
  function currentUser() {
    if (userId === null) load();
    return users().find(u => u.id === userId) || null;
  }

  /* ----- per-user data ----- */
  function data() { if (!cache) load(); return cache; }
  function persist() { if (userId && cache) write(dataKey(userId), cache); }
  function save() { persist(); if (typeof renderAll === "function") renderAll(); }

  /* ----- theme ----- */
  const theme = () => localStorage.getItem(K_THEME) || "dark";
  const setTheme = t => localStorage.setItem(K_THEME, t);

  /* ----- seed demo account on first run ----- */
  function seed() {
    if (users().length) return;
    const demo = createUser({ fullName: "Demo Student", email: "demo@spo.app", username: "demo", password: "demo123" });
    const math = { id: uid(), name: "Mathematics" };
    const prog = { id: uid(), name: "Programming" };
    const eng = { id: uid(), name: "English Literature" };
    const act = (s, title, type, offset, extra = {}) => ({
      id: uid(), subjectId: s.id, title, type, deadline: addDays(offset),
      status: "Pending", desc: "", urgent: false, ...extra
    });
    const d = {
      subjects: [math, prog, eng],
      activities: [
        act(math, "Calculus Problem Set 4", "Activity", 1, { urgent: true, desc: "Chapters 5–6, odd-numbered problems." }),
        act(math, "Algebra Quiz Review", "Activity", -2, { desc: "Review sheet for the missed quiz." }),
        act(prog, "Lab 3: Sorting Algorithms", "Activity", 0, { desc: "Implement bubble, merge and quick sort." }),
        act(prog, "Capstone Web App", "Project", 12, { desc: "Student project manager with calendar and reminders." }),
        act(eng, "Essay Draft", "Activity", 6, { desc: "1,500 words on the assigned novel." }),
        act(eng, "Reading Journal", "Activity", -5, { status: "Completed" }),
        act(eng, "Group Presentation", "Project", 20, { urgent: true })
      ],
      notifs: []
    };
    write(dataKey(demo.id), d);
  }

  return {
    users, saveUsers, findByIdentifier, createUser, updateUser,
    setSession, currentUser, session: () => userId,
    data, persist, save, theme, setTheme, seed, load
  };
})();
