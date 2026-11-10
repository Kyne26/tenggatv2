import { getTask, updateTask, delTask } from "../core/store.js";
import { taskFields, readFields, bindHint } from "./task-form.js";
import { toast } from "./toast.js";
import { icon } from "./icons.js";
import { esc } from "../core/date-utils.js";

// Kotak konfirmasi: mengembalikan Promise<true|false>. Fokus awal di "Batal" supaya tidak terhapus tak sengaja.
export function confirmDialog({
  title,
  text = "",
  items = [],
  ok = "Ya, hapus",
  cancel = "Tidak",
  danger = true,
}) {
  return new Promise((res) => {
    const prev = document.activeElement;
    const host = document.createElement("div");
    host.className =
      "anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center md:p-6";
    host.innerHTML = `
    <div role="alertdialog" aria-modal="true" aria-labelledby="cd-t" aria-describedby="cd-d" class="anim-sheet w-full rounded-t-3xl bg-paper p-6 shadow-2xl md:max-w-sm md:rounded-3xl">
      <h2 id="cd-t" class="text-xl font-medium">${esc(title)}</h2>
      <div id="cd-d" class="mt-2 text-sm text-mute">
        ${text ? `<p>${esc(text)}</p>` : ""}
        ${items.length ? `<ul class="mt-2 list-disc space-y-1 pl-5">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="mt-6 flex justify-end gap-1">
        <button type="button" data-v="0" class="btn-text">${esc(cancel)}</button>
        <button type="button" data-v="1" class="btn ${danger ? "!bg-danger" : ""}">${esc(ok)}</button>
      </div>
    </div>`;
    // capture di window: Esc menutup kotak konfirmasi saja, tidak ikut menutup dialog di belakangnya
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        done(false);
      }
    };
    const done = (v) => {
      host.remove();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey, true);
      if (prev && prev.focus) prev.focus();
      res(v);
    };
    window.addEventListener("keydown", onKey, true);
    document.body.style.overflow = "hidden";
    document.body.appendChild(host);
    host.querySelector('[data-v="0"]').focus();
    host.addEventListener("click", (e) => {
      if (e.target === host) return done(false);
      const b = e.target.closest("[data-v]");
      if (b) done(b.dataset.v === "1");
    });
  });
}

export function openTaskDialog(id, onChange) {
  const t = getTask(id);
  if (!t) return;
  const prev = document.activeElement;
  const host = document.createElement("div");
  host.className =
    "anim-fade fixed inset-0 z-40 flex items-end justify-center bg-black/50 md:items-center md:p-6";
  host.innerHTML = `
  <div role="dialog" aria-modal="true" aria-labelledby="dlg-t" tabindex="-1" class="anim-sheet max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-2xl outline-none md:max-w-md md:rounded-3xl">
    <div class="mb-5 flex items-center">
      <h2 id="dlg-t" class="flex-1 text-xl font-medium">Ubah tenggat</h2>
      <button type="button" data-x aria-label="Tutup" class="-mr-2 grid h-10 w-10 place-items-center rounded-full text-mute hover:bg-surface">${icon("x", "h-5 w-5")}</button>
    </div>
    <form class="grid gap-4">
      ${taskFields(t)}
      <div class="mt-2 flex items-center gap-1">
        <button type="button" data-del class="btn-text -ml-4 text-danger">${icon("trash", "h-5 w-5")} Hapus</button>
        <span class="flex-1"></span>
        <button type="button" data-x class="btn-text">Batal</button>
        <button class="btn">Simpan</button>
      </div>
    </form>
  </div>`;

  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  const close = () => {
    host.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    if (prev && prev.focus) prev.focus();
  };
  document.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  document.body.appendChild(host);
  bindHint(host);
  host.firstElementChild.focus();

  host.addEventListener("click", (e) => {
    if (e.target === host || e.target.closest("[data-x]")) close();
  });
  host.querySelector("[data-del]").onclick = async () => {
    const ok = await confirmDialog({
      title: "Hapus tenggat ini?",
      text: `“${t.course}${t.title ? " · " + t.title : ""}” akan dihapus permanen.`,
    });
    if (!ok) return;
    delTask(id);
    close();
    onChange();
    toast("Tenggat dihapus");
  };
  host.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const v = readFields(host);
    if (!v.date) return;
    updateTask(id, v);
    close();
    onChange();
    toast("Perubahan disimpan");
  };
}
