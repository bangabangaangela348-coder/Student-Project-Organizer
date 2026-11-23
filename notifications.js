"use strict";
/* =========================================================
   notifications.js — WBS H1.1–H1.10: automated reminders,
   read/unread state, dismiss
   Notification records only store {key, activityId, kind, read,
   dismissed}; the text is rebuilt from the live activity so it
   never goes stale.
   ========================================================= */

const Notifications = (() => {
  const KINDS = ["overdue", "today", "soon"];
  const ICON = { overdue: "⚠️", today: "⏰", soon: "🔔" };

  /** Generate reminders for newly overdue / due-today / due-soon activities. */
  function sync() {
    const d = Store.data();
    let changed = false;

    d.activities.forEach(a => {
      const s = deadlineStatus(a);
      if (!KINDS.includes(s.key)) return;
      const key = `${a.id}:${s.key}`;
      if (!d.notifs.some(n => n.key === key)) {
        d.notifs.unshift({ key, activityId: a.id, kind: s.key, read: false, dismissed: false, createdAt: Date.now() });
        changed = true;
      }
    });

    const before = d.notifs.length;
    d.notifs = d.notifs.filter(n => d.activities.some(a => a.id === n.activityId));
    if (changed || before !== d.notifs.length) Store.persist();
  }

  /** Notifications that should currently be shown. */
  function visible() {
    const d = Store.data();
    return d.notifs
      .map(n => {
        const a = d.activities.find(x => x.id === n.activityId);
        return a ? { n, a, s: deadlineStatus(a), subject: d.subjects.find(x => x.id === a.subjectId) } : null;
      })
      .filter(x => x && !x.n.dismissed && x.s.key === x.n.kind)   // hides completed / superseded reminders
      .sort((x, y) => x.s.rank - y.s.rank || y.n.createdAt - x.n.createdAt);
  }

  function render() {
    const list = visible();
    const unread = list.filter(x => !x.n.read).length;

    const badge = $("#notifBadge");
    badge.textContent = unread;
    badge.classList.toggle("hidden", unread === 0);
    $("#notifSummary").textContent = `${unread} unread • ${list.length} total`;

    $("#notifList").innerHTML = list.length
      ? list.map(x => `
        <div class="notif ${x.n.read ? "" : "unread"}" data-key="${esc(x.n.key)}">
          <span class="notif-dot"></span>
          <div class="notif-body">
            <strong>${ICON[x.n.kind]} ${esc(x.a.title)}</strong>
            <div class="sub">${esc(x.subject ? x.subject.name : "—")} • ${esc(x.s.note)}${x.a.deadline ? " (" + esc(fmtDate(x.a.deadline)) + ")" : ""}</div>
          </div>
          <span class="badge badge-${x.s.key}">${esc(x.s.label)}</span>
          <button class="btn-sm" data-act="dismiss">Dismiss</button>
        </div>`).join("")
      : "<p class=\"empty\">No reminders. You're all caught up!</p>";
  }

  function find(key) { return Store.data().notifs.find(n => n.key === key); }

  function init() {
    $("#notifList").addEventListener("click", e => {
      const row = e.target.closest("[data-key]");
      if (!row) return;
      const n = find(row.dataset.key);
      if (!n) return;
      if (e.target.closest('[data-act="dismiss"]')) n.dismissed = true;
      else n.read = !n.read;                       // click toggles read / unread
      Store.save();
    });
    $("#markAllRead").addEventListener("click", () => {
      visible().forEach(x => (x.n.read = true));
      Store.save();
    });
    $("#clearNotifs").addEventListener("click", () => {
      visible().forEach(x => (x.n.dismissed = true));
      Store.save();
      toast("Notifications cleared");
    });
  }

  return { init, sync, render };
})();
