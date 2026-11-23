"use strict";
/* =========================================================
   utils.js — DOM helpers, date helpers, deadline status engine
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ESC_MAP[c]);

const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const todayDate = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const addDays = n => { const t = todayDate(); t.setDate(t.getDate() + n); return ymd(t); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const plural = (n, word, pl = word + "s") => `${n} ${n === 1 ? word : pl}`;
const fmtDate = s => s
  ? parseYmd(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  : "No deadline";

/**
 * Deadline status engine.
 * Returns { key, label, note, urgent, rank, days }
 *   key:  completed | overdue | today | soon | upcoming | none
 *   rank: lower = more pressing (used for sorting)
 */
function deadlineStatus(act) {
  if (act.status === "Completed") {
    return { key: "completed", label: "Completed", note: "Completed", urgent: false, rank: 5, days: null };
  }
  if (!act.deadline) {
    return { key: "none", label: "No deadline", note: "No deadline set", urgent: !!act.urgent, rank: act.urgent ? 2 : 4, days: null };
  }
  const days = Math.round((parseYmd(act.deadline) - todayDate()) / 86400000);
  if (days < 0) {
    return { key: "overdue", label: "Overdue", note: days === -1 ? "Overdue by 1 day" : `Overdue by ${-days} days`, urgent: true, rank: 0, days };
  }
  if (days === 0) {
    return { key: "today", label: "Due today", note: "Due today", urgent: true, rank: 1, days };
  }
  if (days <= 3) {
    return { key: "soon", label: "Due soon", note: days === 1 ? "Due tomorrow" : `Due in ${days} days`, urgent: true, rank: 2, days };
  }
  return { key: "upcoming", label: "Upcoming", note: `Due in ${days} days`, urgent: !!act.urgent, rank: act.urgent ? 2 : 3, days };
}

/** Collapse status key into the three calendar/filter groups. */
const statusGroup = s => s.key === "completed" ? "completed" : s.key === "overdue" ? "overdue" : "pending";

/** Sort comparator for {s: deadlineStatus} wrappers: most pressing first, then earliest deadline. */
function byPriority(x, y) {
  if (x.s.rank !== y.s.rank) return x.s.rank - y.s.rank;
  const dx = x.a.deadline || "9999-99-99", dy = y.a.deadline || "9999-99-99";
  return dx.localeCompare(dy);
}

let toastTimer = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2400);
}
