"use strict";
/* =========================================================
   priorities.js — WBS D1–D10: urgent tasks, upcoming deadlines,
   task details & delete
   ========================================================= */

const Priorities = (() => {
  let filter = "urgent";            // urgent | upcoming | all
  const opened = new Set();         // activity ids with details expanded

  function pendingItems() {
    const d = Store.data();
    return d.activities
      .map(a => ({ a, s: deadlineStatus(a), subject: d.subjects.find(x => x.id === a.subjectId) }))
      .filter(x => x.s.key !== "completed")
      .sort(byPriority);
  }

  function setFilter(f) { filter = f; render(); }

  function card(x, i) {
    const { a, s, subject } = x;
    const open = opened.has(a.id);
    return `
      <div class="task-item ${s.urgent ? "is-urgent" : ""}" data-id="${a.id}">
        <div class="task-header">
          <div>
            ${i === 0 ? '<span class="rank-tag">#1 PRIORITY</span>' : ""}
            <span class="task-title">${esc(a.title)}</span>
            ${s.urgent ? `<span class="urgent-flag">🔥 ${s.key === "overdue" ? "Action needed" : "Prioritize"}</span>` : ""}
          </div>
          <div class="task-actions">
            <button class="btn-sm" data-act="done">Mark done</button>
            <button class="btn-sm del" data-act="delete">Delete</button>
          </div>
        </div>
        <div class="task-meta">
          <span>Subject: <strong>${esc(subject ? subject.name : "—")}</strong></span><span>•</span>
          <span>${a.deadline ? `Deadline: <strong>${esc(fmtDate(a.deadline))}</strong> (${esc(s.note)})` : esc(s.note)}</span>
          <span class="badge badge-${s.key}">${esc(s.label)}</span>
        </div>
        <button class="link-btn" data-act="details" style="margin-top:10px">${open ? "Hide details" : "View details"}</button>
        ${open ? `<div class="task-desc">${a.desc ? esc(a.desc) : "No description provided."}</div>` : ""}
      </div>`;
  }

  function render() {
    const all = pendingItems();
    const urgent = all.filter(x => x.s.urgent);
    const upcoming = all.filter(x => !x.s.urgent);

    $("#prioSummary").textContent = `Pending: ${all.length} • Urgent: ${urgent.length} • Upcoming: ${upcoming.length}`;
    const labels = { urgent: `Urgent (${urgent.length})`, upcoming: `Upcoming (${upcoming.length})`, all: `All pending (${all.length})` };
    $$("#prioTabs .tab-btn").forEach(b => {
      b.textContent = labels[b.dataset.pfilter];
      b.classList.toggle("active", b.dataset.pfilter === filter);
    });

    const list = filter === "urgent" ? urgent : filter === "upcoming" ? upcoming : all;
    const box = $("#priorityList");
    if (!list.length) {
      box.innerHTML = `<p class="empty">${
        Store.data().activities.length === 0
          ? "No activities yet. Add one from the Activities page."
          : filter === "urgent" ? "Nothing urgent right now. Nice work!" : "No tasks in this view."}</p>`;
      return;
    }
    box.innerHTML = list.map(card).join("");
  }

  function init() {
    $("#prioTabs").addEventListener("click", e => {
      const b = e.target.closest("[data-pfilter]");
      if (b) setFilter(b.dataset.pfilter);
    });
    $("#priorityList").addEventListener("click", e => {
      const btn = e.target.closest("[data-act]");
      const item = e.target.closest("[data-id]");
      if (!btn || !item) return;
      const id = item.dataset.id;
      if (btn.dataset.act === "details") {
        opened.has(id) ? opened.delete(id) : opened.add(id);
        render();
      } else if (btn.dataset.act === "done") {
        Activities.toggle(id);
      } else if (btn.dataset.act === "delete") {
        Activities.remove(id);
      }
    });
  }

  return { init, render, setFilter };
})();
