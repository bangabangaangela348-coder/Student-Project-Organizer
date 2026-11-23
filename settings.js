"use strict";
/* =========================================================
   settings.js — WBS I1–I5: profile view/edit, account settings,
   switch account, logout
   ========================================================= */

const Settings = (() => {
  function render() {
    const u = Store.currentUser();
    if (!u) return;

    $("#profileRows").innerHTML = [
      ["Full name", u.fullName], ["Username", u.username], ["Email", u.email]
    ].map(([k, v], i, arr) =>
      `<div class="settings-row ${i === arr.length - 1 ? "no-border" : ""}"><span>${k}</span><span>${esc(v)}</span></div>`).join("");

    $("#darkToggle").checked = Store.theme() !== "light";

    $("#accountList").innerHTML = Store.users().map((acc, i, arr) => `
      <div class="settings-row ${i === arr.length - 1 ? "no-border" : ""}" data-id="${acc.id}">
        <span style="color:var(--text)">${esc(acc.fullName)} <span class="sub">@${esc(acc.username)}</span></span>
        ${acc.id === u.id
          ? '<span class="tag-active">Active</span>'
          : '<button class="btn-sm" data-act="switch">Switch</button>'}
      </div>`).join("");
  }

  function editProfile() {
    const u = Store.currentUser();
    Modal.open({
      title: "Edit profile",
      submitText: "Update",
      fields: [
        { name: "fullName", label: "Full name", value: u.fullName },
        { name: "email", label: "Email", type: "email", value: u.email },
        { name: "username", label: "Username", value: u.username },
        { name: "password", label: "New password (leave blank to keep current)", type: "password", value: "" }
      ],
      onSubmit: v => {
        const fields = ["fullName", "email", "username"];
        if (v.password) fields.push("password");
        const errors = { ...Auth.uniqueErrors(v, u.id), ...Auth.validate(v, fields) };
        if (Object.keys(errors).length) return errors;
        const patch = { fullName: v.fullName, email: v.email.toLowerCase(), username: v.username };
        if (v.password) patch.password = v.password;
        Store.updateUser(u.id, patch);
        Store.save();
        toast("Profile updated");
      }
    });
  }

  function switchAccount(id) {
    const acc = Store.users().find(u => u.id === id);
    if (!acc) return;
    Modal.open({
      title: `Switch to ${acc.fullName}`,
      message: `Enter the password for @${acc.username}.`,
      submitText: "Switch",
      fields: [{ name: "password", label: "Password", type: "password", value: "" }],
      onSubmit: v => {
        const res = Auth.switchTo(id, v.password);
        if (!res.ok) return { password: res.error };
        toast(`Switched to ${acc.fullName}`);
        App.start();
      }
    });
  }

  function init() {
    $("#editProfileBtn").addEventListener("click", editProfile);
    $("#addAccountBtn").addEventListener("click", () => Auth.showAuth("register"));
    $("#logoutBtn").addEventListener("click", () => Auth.logout());
    $("#darkToggle").addEventListener("change", e => {
      Store.setTheme(e.target.checked ? "dark" : "light");
      App.applyTheme();
    });
    $("#accountList").addEventListener("click", e => {
      const btn = e.target.closest('[data-act="switch"]');
      if (btn) switchAccount(btn.closest("[data-id]").dataset.id);
    });
  }

  return { init, render };
})();
