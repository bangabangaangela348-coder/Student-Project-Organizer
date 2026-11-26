
"use strict";
/* =========================================================
   dashboard.js — WBS C1–C11: summary cards, progress bar,
   upcoming preview, shortcuts
   ========================================================= */
/*== Implement dashboard summary and progress tracking ==*/

/*==Implemented a dynamic welcome greeting that displays the logged-in user's full name on the Dashboard.==*/
const Dashboard = (() => {
  function render() {
    const d = Store.data();
    const user = Store.currentUser();
    $("#dashGreeting").textContent = `Welcome, ${user.fullName}`;
/*==  ==*/
    const items = d.activities.map(a => ({ a, s: deadlineStatus(a), subject: d.subjects.find(x => x.id === a.subjectId) }));
    const pending = items.filter(x => x.s.key !== "completed");
    const overdue = pending.filter(x => x.s.key === "overdue").length;
    const urgent = pending.filter(x => x.s.urgent).length;
    const done = items.length - pending.length;

    // C1–C5: summary cards
    const cards = [
      { label: "Subjects", value: d.subjects.length, go: "subjects", cls: "" },
      { label: "Pending", value: pending.length, go: "priorities", pf: "all", cls: "" },
      { label: "Urgent", value: urgent, go: "priorities", pf: "urgent", cls: "urgent" },
      { label: "Overdue", value: overdue, go: "priorities", pf: "urgent", cls: "overdue" },
      { label: "Completed", value: done, go: "activities", cls: "completed" }
    ];
    $("#statCards").innerHTML = cards.map(c => `
      <button class="stat ${c.cls}" data-go="${c.go}" ${c.pf ? `data-pf="${c.pf}"` : ""}>
        <span>${c.label}</span><b>${c.value}</b>
      </button>`).join("");

    // C6–C7: progress bar
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    $("#progressFill").style.width = pct + "%";
    $("#progressLabel").textContent = items.length
      ? `${done} of ${items.length} completed (${pct}%)`
      : "No activities yet";

    // C8–C9: upcoming deadlines preview (top 5 pending with a deadline)
    const upcoming = pending.filter(x => x.a.deadline).sort(byPriority).slice(0, 5);
    $("#upcomingPreview").innerHTML = upcoming.length
      ? upcoming.map(x => `
        <div class="task-row">
          <div><strong>${esc(x.a.title)}</strong>
            <div class="sub">${esc(x.subject ? x.subject.name : "—")} • ${esc(fmtDate(x.a.deadline))} • ${esc(x.s.note)}</div></div>
          <span class="badge badge-${x.s.key}">${esc(x.s.label)}</span>
        </div>`).join("")
      : '<p class="empty">No upcoming deadlines. Add an activity with a deadline to see it here.</p>';
  }

  return { render };
})();
