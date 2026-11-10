import { esc, fmt, rel } from "../core/date-utils.js";
import { toggleTask, getTask, delTask } from "../core/store.js";
import { openTaskDialog, confirmDialog } from "./modal.js";
import { toast } from "./toast.js";
import { icon } from "./icons.js";

// warna tetap per kegiatan (6 warna, ikut tema terang/gelap)
export const cvar = (c) => {
  let h = 0;
  for (const ch of String(c).toLowerCase())
    h = (h * 31 + ch.charCodeAt(0)) % 997;
  return `var(--c${(h % 6) + 1})`;
};

export const taskItem = (t) => `
<div class="flex items-start gap-3 border-b border-line py-3.5 ${t.done ? "opacity-55" : ""}" style="--c:${cvar(t.course)}">
  <button type="button" data-act="tog" data-id="${t.id}" aria-pressed="${!!t.done}" aria-label="${t.done ? "Tandai belum selesai" : "Tandai selesai"}" class="chk mt-0.5">${t.done ? icon("check", "h-4 w-4", 3) : ""}</button>
  <button type="button" data-act="edit" data-id="${t.id}" class="min-w-0 flex-1 text-left">
    <p class="font-medium ${t.done ? "line-through" : ""}">${esc(t.course)}${t.title ? ` <span class="font-normal text-mute">· ${esc(t.title)}</span>` : ""}</p>
    <p class="text-sm text-mute">${fmt(t.date)}${t.time ? ", jam " + t.time.replace(":", ".") : ""} · ${rel(t.date)}</p>
  </button>
  <button type="button" data-act="del" data-id="${t.id}" aria-label="Hapus tenggat" class="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-mute transition-colors hover:bg-surface hover:text-danger">${icon("trash", "h-5 w-5")}</button>
</div>`;

export const bindActions = (root, onChange) =>
  root.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-act]");
    if (!a) return;
    const id = a.dataset.id;
    if (a.dataset.act === "tog") {
      toggleTask(id);
      onChange();
    }
    if (a.dataset.act === "edit") openTaskDialog(id, onChange);
    if (a.dataset.act === "del") {
      const t = getTask(id);
      if (!t) return;
      const ok = await confirmDialog({
        title: "Hapus tenggat ini?",
        text: `“${t.course}${t.title ? " · " + t.title : ""}” akan dihapus permanen.`,
      });
      if (ok) {
        delTask(id);
        onChange();
        toast("Tenggat dihapus");
      }
    }
  });
