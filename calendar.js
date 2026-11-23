"use strict";
/* =========================================================
   calendar.js — WBS G1–G5: month/week views, filters,
   color-coded event details
   ========================================================= */

const Calendar = (() => {
  let view = "month";
  let anchor = new Date();
  let selected = null;

  function eventsByDate() {
    const d = Store.data();
    const sub = $("#calSubject").value || "all";
    const st = $("#calStatus").value;
    const map = {};
    d.activities.forEach(a => {
      if (!a.deadline) return;
      if (sub !== "all" && a.subjectId !== sub) return;
      const s = deadlineStatus(a);
      const group = statusGroup(s);
      if (st !== "all" && group !== st) return;
      (map[a.deadline] ||= []).push({ a, s, group, subject: d.subjects.find(x => x.id === a.subjectId) });
    });
    return map;
  }

  function renderSubjectFilter() {
    const sel = $("#calSubject");
    const cur = sel.value || "all";
    const subjects = Store.data().subjects;
    sel.innerHTML = '<option value="all">All Subjects</option>' +
      subjects.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    sel.value = subjects.some(s => s.id === cur) ? cur : "all";
  }

  function render() {
    renderSubjectFilter();
    const events = eventsByDate();
    const todayKey = ymd(new Date());
    let start, end;

    if (view === "month") {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      start = new Date(first); start.setDate(1 - first.getDay());
      end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      end.setDate(end.getDate() + (6 - end.getDay()));
      $("#calLabel").textContent = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      start = new Date(anchor); start.setDate(anchor.getDate() - anchor.getDay());
      end = new Date(start); end.setDate(start.getDate() + 6);
      const o = { month: "short", day: "numeric" };
      $("#calLabel").textContent = `${start.toLocaleDateString("en-US", o)} – ${end.toLocaleDateString("en-US", { ...o, year: "numeric" })}`;
    }
    $$("[data-view]").forEach(b => b.classList.toggle("on", b.dataset.view === view));

    let html = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(n => `<div class="calendar-day-name">${n}</div>`).join("");
    for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      const key = ymd(day);
      const evs = events[key] || [];
      const cls = ["calendar-cell",
        view === "month" && day.getMonth() !== anchor.getMonth() ? "muted" : "",
        key === todayKey ? "today" : "",
        key === selected ? "selected" : ""].filter(Boolean).join(" ");
      html += `<div class="${cls}" data-date="${key}">${day.getDate()}` +
        evs.slice(0, 2).map(e => `<div class="cal-event ${e.group}" title="${esc(e.a.title)}">${esc(e.a.title)}</div>`).join("") +
        (evs.length > 2 ? `<div class="sub" style="margin-top:4px">+${evs.length - 2} more</div>` : "") +
        `</div>`;
    }
    $("#calGrid").innerHTML = html;
    renderDetails(events);
  }

  function renderDetails(events) {
    const box = $("#eventDetails");
    if (!selected) { box.innerHTML = '<p class="empty">Select a calendar date to view its events.</p>'; return; }
    const evs = events[selected] || [];
    const head = `<p class="sub" style="margin-bottom:8px">${esc(parseYmd(selected).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }))}</p>`;
    box.innerHTML = head + (evs.length
      ? evs.map(e => `
        <div class="task-row">
          <div><span class="dot dot-${e.group}"></span><strong>${esc(e.a.title)}</strong>${e.a.urgent && e.group !== "completed" ? " 🔥" : ""}
            <div class="sub">${esc(e.subject ? e.subject.name : "—")} • ${esc(e.a.type)}${e.a.desc ? " • " + esc(e.a.desc) : ""}</div></div>
          <span class="badge badge-${e.s.key}">${esc(e.s.label)}</span>
        </div>`).join("")
      : '<p class="empty">No activities due on this date.</p>');
  }

  function shift(dir) {
    anchor = view === "month"
      ? new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1)
      : new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + dir * 7);
    render();
  }

  function init() {
    $("#calPrev").addEventListener("click", () => shift(-1));
    $("#calNext").addEventListener("click", () => shift(1));
    $("#calToday").addEventListener("click", () => { anchor = new Date(); selected = ymd(anchor); render(); });
    $$("[data-view]").forEach(b => b.addEventListener("click", () => { view = b.dataset.view; render(); }));
    $("#calSubject").addEventListener("change", render);
    $("#calStatus").addEventListener("change", render);
    $("#calGrid").addEventListener("click", e => {
      const cell = e.target.closest("[data-date]");
      if (cell) { selected = cell.dataset.date; render(); }
    });
  }

  return { init, render };
})();
