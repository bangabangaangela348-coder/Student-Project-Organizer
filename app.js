"use strict";
/* =========================================================
   app.js — main controller: routing, responsive navigation,
   shared modal, global render
   ========================================================= */

/* ---------- shared modal ---------- */
const Modal = (() => {
  let handler = null;
  let fields = [];

  function fieldHtml(f) {
    const v = f.value ?? "";
    if (f.type === "checkbox") {
      return `<div class="field check"><label><input type="checkbox" name="${f.name}" ${v ? "checked" : ""}> ${esc(f.label)}</label></div>`;
    }
    let input;
    if (f.type === "textarea") {
      input = `<textarea name="${f.name}" rows="3" placeholder="${esc(f.placeholder || "")}">${esc(v)}</textarea>`;
    } else if (f.type === "select") {
      input = `<select name="${f.name}">${f.options.map(o =>
        `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`;
    } else {
      input = `<input type="${f.type || "text"}" name="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || "")}" ${f.maxlength ? `maxlength="${f.maxlength}"` : ""} autocomplete="off">`;
    }
    return `<div class="field"><label>${esc(f.label)}</label>${input}<small class="err" data-ferr="${f.name}"></small></div>`;
  }

  function open({ title, message = "", html = "", fields: fs = [], submitText = "Save", cancelText = "Cancel", danger = false, hideSubmit = false, onSubmit }) {
    fields = fs;
    handler = onSubmit || null;
    $("#modalTitle").textContent = title;

    const msg = $("#modalMessage");
    msg.textContent = message;
    msg.classList.toggle("hidden", !message);

    $("#modalFields").innerHTML = '<small class="err" id="modalErr"></small>' + fs.map(fieldHtml).join("") + html;

    const submit = $("#modalSubmit");
    submit.textContent = submitText;
    submit.className = "btn " + (danger ? "danger" : "primary");
    submit.classList.toggle("hidden", hideSubmit);
    $("#modalCancel").textContent = cancelText;

    $("#modal").classList.remove("hidden");
    const first = $("#modalFields input:not([type=checkbox]), #modalFields select, #modalFields textarea");
    if (first) first.focus();
  }

  function close() {
    $("#modal").classList.add("hidden");
    handler = null;
    fields = [];
  }

  function confirm(message, { title = "Confirm", confirmText = "Confirm", danger = false } = {}, onYes) {
    open({ title, message, submitText: confirmText, danger, onSubmit: () => { onYes(); } });
  }

  function init() {
    $("#modalCancel").addEventListener("click", close);
    $("#modal").addEventListener("mousedown", e => { if (e.target.id === "modal") close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#modal").classList.contains("hidden")) close(); });

    $("#modalForm").addEventListener("submit", e => {
      e.preventDefault();
      if (!handler) { close(); return; }

      const values = {};
      fields.forEach(f => {
        const el = $(`[name="${f.name}"]`, $("#modalFields"));
        values[f.name] = f.type === "checkbox" ? el.checked : (f.type === "password" ? el.value : el.value.trim());
      });
      $$("[data-ferr]", $("#modalFields")).forEach(s => (s.textContent = ""));
      $("#modalErr").textContent = "";

      const res = handler(values);
      if (res && typeof res === "object") {
        $$("[data-ferr]", $("#modalFields")).forEach(s => (s.textContent = res[s.dataset.ferr] || ""));
        return;
      }
      if (typeof res === "string" && res) { $("#modalErr").textContent = res; return; }
      close();
    });
  }

  return { init, open, close, confirm };
})();

/* ---------- app controller ---------- */
const App = (() => {
  const ROUTES = ["dashboard", "priorities", "subjects", "activities", "calendar", "notifications", "settings"];

  const routeFromHash = () => {
    const r = location.hash.replace(/^#\/?/, "");
    return ROUTES.includes(r) ? r : "dashboard";
  };

  function show(route) {
    $$(".page").forEach(p => p.classList.toggle("active", p.id === `page-${route}`));
    $$(".nav-link[data-route]").forEach(n => n.classList.toggle("active", n.dataset.route === route));
    $("#sidebar").classList.remove("open");
    window.scrollTo(0, 0);
    renderAll();
  }

  function go(route) {
    if (!ROUTES.includes(route)) return;
    if (routeFromHash() === route && location.hash === `#/${route}`) show(route);
    else location.hash = `#/${route}`;      // triggers hashchange -> show()
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", Store.theme());
  }

  /** Enter the app for the current session user. */
  function start() {
    const user = Store.currentUser();
    if (!user) { Auth.showAuth("login"); return; }
    $("#authView").classList.add("hidden");
    $("#appView").classList.remove("hidden");
    $("#avatar").textContent = user.fullName.charAt(0).toUpperCase();
    $("#sideName").textContent = user.fullName;
    show(routeFromHash());
  }

  function init() {
    applyTheme();

    $("#dateLine").textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    }).toUpperCase();

    $$(".nav-link[data-route]").forEach(b => b.addEventListener("click", () => go(b.dataset.route)));
    $("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    window.addEventListener("hashchange", () => { if (Store.currentUser()) show(routeFromHash()); });

    // Global delegated shortcuts: [data-go], [data-pf], [data-shortcut]
    document.addEventListener("click", e => {
      const pf = e.target.closest("[data-pf]");
      if (pf) Priorities.setFilter(pf.dataset.pf);
      const goBtn = e.target.closest("[data-go]");
      if (goBtn) go(goBtn.dataset.go);
      const sc = e.target.closest("[data-shortcut]");
      if (sc) {
        if (sc.dataset.shortcut === "addSubject") { go("subjects"); Subjects.openForm(); }
        if (sc.dataset.shortcut === "addActivity") Activities.openForm();
      }
    });

    // Keep tabs in sync (e.g. another tab changes data)
    window.addEventListener("storage", () => { Store.load(); if (Store.currentUser()) renderAll(); });
  }

  return { init, start, go, applyTheme };
})();

/** Re-render every view (cheap: all data is local). */
function renderAll() {
  if (!Store.currentUser()) return;
  Notifications.sync();
  Dashboard.render();
  Priorities.render();
  Subjects.render();
  Activities.render();
  Calendar.render();
  Notifications.render();
  Settings.render();
  $("#sideName").textContent = Store.currentUser().fullName;
  $("#avatar").textContent = Store.currentUser().fullName.charAt(0).toUpperCase();
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  Store.seed();
  Store.load();
  Modal.init();
  Auth.init();
  Priorities.init();
  Subjects.init();
  Activities.init();
  Calendar.init();
  Notifications.init();
  Settings.init();
  App.init();

  if (Store.currentUser()) App.start();
  else Auth.showAuth("login");
});
