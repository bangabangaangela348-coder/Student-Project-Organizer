"use strict";
/* =========================================================
   subjects.js — WBS E1–E6: subject list, search bar,
   add / edit / view / delete subjects
   ========================================================= */

const Subjects = (() => {
  let query = "";

  function render() {
    const d = Store.data();
    const list = d.subjects.filter(s => s.name.toLowerCase().includes(query));
    const box = $("#subjectList");

    if (!list.length) {
      box.innerHTML = `<p class="empty-message">${query ? "No subjects match your search." : "No subjects yet. Add a subject to get started."}</p>`;
      return;
    }

    box.innerHTML = list.map(s => {
      const acts = d.activities.filter(a => a.subjectId === s.id);
      const pending = acts.filter(a => a.status !== "Completed").length;
      return `
        <article class="subject-card" data-id="${s.id}">
          <div class="subject-initial">${esc(s.name.charAt(0).toUpperCase())}</div>
          <div class="subject-info">
            <h3>${esc(s.name)}</h3>
            <span class="sub">${plural(acts.length, "activity", "activities")} • ${pending} pending</span>
          </div>
          <div class="task-actions">
            <button class="btn-sm" data-act="view">View</button>
            <button class="btn-sm" data-act="edit">Edit</button>
            <button class="btn-sm del" data-act="delete">Delete</button>
          </div>
        </article>`;
    }).join("");
  }

  function nameError(name, exceptId = null) {
    if (!name) return "Enter a subject name.";
    if (name.length > 60) return "Subject name is too long (max 60 characters).";
    const dup = Store.data().subjects.some(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== exceptId);
    return dup ? "This subject already exists." : null;
  }

  function openForm(subject = null) {
    Modal.open({
      title: subject ? "Edit subject" : "Add subject",
      submitText: subject ? "Update" : "Save",
      fields: [{ name: "name", label: "Subject name", value: subject ? subject.name : "", placeholder: "e.g., Physics", maxlength: 60 }],
      onSubmit: v => {
        const err = nameError(v.name, subject && subject.id);
        if (err) return { name: err };
        const d = Store.data();
        if (subject) subject.name = v.name;
        else d.subjects.push({ id: uid(), name: v.name });
        Store.save();
        toast(subject ? "Subject updated" : "Subject added");
      }
    });
  }

  function view(subject) {
    const d = Store.data();
    const acts = d.activities
      .filter(a => a.subjectId === subject.id)
      .map(a => ({ a, s: deadlineStatus(a) }))
      .sort(byPriority);
    const html = acts.length
      ? acts.map(x => `
          <div class="task-row">
            <div><strong>${esc(x.a.title)}</strong>
              <div class="sub">${esc(x.a.type)} • ${esc(fmtDate(x.a.deadline))}${x.a.desc ? " • " + esc(x.a.desc) : ""}</div></div>
            <span class="badge badge-${x.s.key}">${esc(x.s.label)}</span>
          </div>`).join("")
      : '<p class="empty">No activities for this subject yet.</p>';
    Modal.open({ title: subject.name, html, hideSubmit: true, cancelText: "Close" });
  }

  function remove(subject) {
    const d = Store.data();
    const count = d.activities.filter(a => a.subjectId === subject.id).length;
    Modal.confirm(
      `Delete "${subject.name}"?${count ? ` This also deletes its ${plural(count, "activity", "activities")}.` : ""}`,
      { title: "Delete subject", confirmText: "Delete", danger: true },
      () => {
        d.subjects = d.subjects.filter(s => s.id !== subject.id);
        d.activities = d.activities.filter(a => a.subjectId !== subject.id);
        Store.save();
        toast("Subject deleted");
      });
  }

  function init() {
    $("#addSubjectBtn").addEventListener("click", () => openForm());
    $("#subjectSearch").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); render(); });
    $("#subjectList").addEventListener("click", e => {
      const btn = e.target.closest("[data-act]");
      const card = e.target.closest("[data-id]");
      if (!btn || !card) return;
      const subject = Store.data().subjects.find(s => s.id === card.dataset.id);
      if (!subject) return;
      if (btn.dataset.act === "view") view(subject);
      else if (btn.dataset.act === "edit") openForm(subject);
      else if (btn.dataset.act === "delete") remove(subject);
    });
  }

  return { init, render, openForm };
})();
