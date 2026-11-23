"use strict";
/* =========================================================
   activities.js — WBS F1–F8: activities & projects list,
   status filters, CRUD
   ========================================================= */

const Activities = (() => {
  const f = { subject: "all", search: "", type: "all", status: "all" };

  /* ---------- shared actions (also used by Priorities) ---------- */
  function toggle(id) {
    const a = Store.data().activities.find(x => x.id === id);
    if (!a) return;
    a.status = a.status === "Completed" ? "Pending" : "Completed";
    Store.save();
  }

  function remove(id) {
    const d = Store.data();
    const a = d.activities.find(x => x.id === id);
    if (!a) return;
    Modal.confirm(`Delete "${a.title}"?`, { title: "Delete activity", confirmText: "Delete", danger: true }, () => {
      d.activities = d.activities.filter(x => x.id !== id);
      Store.save();
      toast("Activity deleted");
    });
  }

  /* ---------- add / edit form ---------- */
  function openForm(act = null) {
    const d = Store.data();
    if (!d.subjects.length) {
      toast("Add a subject first.");
      App.go("subjects");
      return;
    }
    const defaultSubject = act ? act.subjectId : (f.subject !== "all" ? f.subject : d.subjects[0].id);
    Modal.open({
      title: act ? "Edit activity" : "Add activity",
      submitText: act ? "Update" : "Save",
      fields: [
        { name: "subjectId", label: "Subject", type: "select", value: defaultSubject, options: d.subjects.map(s => ({ value: s.id, label: s.name })) },
        { name: "title", label: "Title", value: act ? act.title : "", placeholder: "e.g., Lab 1, Quiz 1, Final project", maxlength: 80 },
        { name: "type", label: "Type", type: "select", value: act ? act.type : "Activity", options: [{ value: "Activity", label: "Activity" }, { value: "Project", label: "Project" }] },
        { name: "deadline", label: "Deadline (optional)", type: "date", value: act ? act.deadline : "" },
        { name: "status", label: "Status", type: "select", value: act ? act.status : "Pending", options: [{ value: "Pending", label: "Pending" }, { value: "Completed", label: "Completed" }] },
        { name: "desc", label: "Description / notes (optional)", type: "textarea", value: act ? act.desc : "" },
        { name: "urgent", label: "Mark as urgent", type: "checkbox", value: act ? act.urgent : false }
      ],
      onSubmit: v => {
        const errors = {};
        if (!v.title) errors.title = "Enter a title.";
        else if (v.title.length > 80) errors.title = "Title is too long (max 80 characters).";
        else if (d.activities.some(a => a.subjectId === v.subjectId && a.title.toLowerCase() === v.title.toLowerCase() && (!act || a.id !== act.id))) {
          errors.title = "This activity already exists in that subject.";
        }
        if (Object.keys(errors).length) return errors;

        if (act) Object.assign(act, v);
        else d.activities.push({ id: uid(), ...v });
        Store.save();
        toast(act ? "Activity updated" : "Activity added");
      }
    });
  }

  /* ---------- list ---------- */
  function card(x, subject) {
    const { a, s } = x;
    const done = a.status === "Completed";
    return `
      <article class="task-item ${s.urgent ? "is-urgent" : ""} ${done ? "is-done" : ""}" data-id="${a.id}">
        <div class="task-main">
          <input type="checkbox" data-act="toggle" ${done ? "checked" : ""} aria-label="Mark complete">
          <div class="task-body">
            <div class="task-header">
              <div>
                <span class="task-title">${esc(a.title)}</span>
                ${s.urgent && !done ? '<span class="urgent-flag">🔥 Urgent</span>' : ""}
              </div>
              <div class="task-actions">
                <button class="btn-sm" data-act="edit">Edit</button>
                <button class="btn-sm del" data-act="delete">Delete</button>
              </div>
            </div>
            <div class="task-meta">
              <span class="badge badge-type">${esc(a.type)}</span>
              <span>${esc(subject ? subject.name : "—")}</span><span>•</span>
              <span>${a.deadline ? `Deadline: ${esc(fmtDate(a.deadline))} (${esc(s.note)})` : "No deadline set"}</span>
              <span class="badge badge-${s.key}">${esc(s.label)}</span>
            </div>
            ${a.desc ? `<p class="task-desc">${esc(a.desc)}</p>` : ""}
          </div>
        </div>
      </article>`;
  }

  function renderSubjectSelect() {
    const sel = $("#actSubject");
    const subjects = Store.data().subjects;
    sel.innerHTML = '<option value="all">All Subjects</option>' +
      subjects.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    if (f.subject !== "all" && !subjects.some(s => s.id === f.subject)) f.subject = "all";
    sel.value = f.subject;
  }

  function render() {
    renderSubjectSelect();
    const d = Store.data();
    const q = f.search;

    const list = d.activities
      .map(a => ({ a, s: deadlineStatus(a) }))
      .filter(x =>
        (f.subject === "all" || x.a.subjectId === f.subject) &&
        (f.type === "all" || x.a.type === f.type) &&
        (f.status === "all" || statusGroup(x.s) === f.status) &&
        (!q || x.a.title.toLowerCase().includes(q) || (x.a.desc || "").toLowerCase().includes(q)))
      .sort(byPriority);

    const pending = list.filter(x => x.s.key !== "completed").length;
    $("#actSummary").textContent = `${plural(list.length, "item")} • ${pending} pending`;

    $("#activityList").innerHTML = list.length
      ? list.map(x => card(x, d.subjects.find(s => s.id === x.a.subjectId))).join("")
      : `<p class="empty-message">${
          d.activities.length === 0
            ? 'No activities yet. Click "+ Add Activity" to create one.'
            : "No activities match your filters."}</p>`;
  }

  function init() {
    $("#addActivityBtn").addEventListener("click", () => openForm());
    $("#actSubject").addEventListener("change", e => { f.subject = e.target.value; render(); });
    $("#actSearch").addEventListener("input", e => { f.search = e.target.value.trim().toLowerCase(); render(); });
    $("#actType").addEventListener("change", e => { f.type = e.target.value; render(); });
    $("#actStatus").addEventListener("change", e => { f.status = e.target.value; render(); });

    $("#activityList").addEventListener("click", e => {
      const btn = e.target.closest("[data-act]");
      const item = e.target.closest("[data-id]");
      if (!btn || !item) return;
      const id = item.dataset.id;
      if (btn.dataset.act === "toggle") toggle(id);
      else if (btn.dataset.act === "edit") openForm(Store.data().activities.find(a => a.id === id));
      else if (btn.dataset.act === "delete") remove(id);
    });
  }

  return { init, render, openForm, toggle, remove };
})();
