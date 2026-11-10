import "../app.js";
import { getTasks, clearDone } from "../core/store.js";
import { confirmDialog } from "../components/modal.js";
import {
  today,
  fromIso,
  iso,
  addD,
  mondayOf,
  longDate,
  DN,
  MN,
} from "../core/date-utils.js";
import { taskItem, bindActions, cvar } from "../components/task-item.js";
import { icon } from "../components/icons.js";
import { toast } from "../components/toast.js";

const app = document.getElementById("app");
const cmp = (a, b) =>
  a.date + (a.time || "99") < b.date + (b.time || "99") ? -1 : 1;
const LBL = {
  late: ["Terlambat", "text-danger"],
  soon: ["Segera (0–2 hari)", "text-mute"],
  week: ["3–7 hari lagi", "text-mute"],
  later: ["Nanti", "text-mute"],
};
const greet = () => {
  const h = new Date().getHours();
  return h < 11
    ? "Selamat pagi."
    : h < 15
      ? "Selamat siang."
      : h < 18
        ? "Selamat sore."
        : "Selamat malam.";
};
const arrow = "grid h-10 w-10 place-items-center rounded-full hover:bg-surface";

let ws = mondayOf(today()); // Senin dari minggu yang sedang dilihat
let selDay = null; // hari yang sedang dipilih di kartu minggu (null = tampilan awal)
let fresh = false; // true sesaat setelah memilih hari, supaya daftarnya muncul dengan animasi

const abbr = (d) => MN[d.getMonth()].slice(0, 3);
function weekLabel(s) {
  const e = addD(s, 6);
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()}–${e.getDate()} ${abbr(e)} ${e.getFullYear()}`
    : `${s.getDate()} ${abbr(s)} – ${e.getDate()} ${abbr(e)} ${e.getFullYear()}`;
}
function weekRel(s) {
  const n = Math.round((s - mondayOf(today())) / (7 * 864e5));
  return n === 0
    ? "Minggu ini"
    : n === 1
      ? "Minggu depan"
      : n === -1
        ? "Minggu lalu"
        : n > 0
          ? `${n} minggu lagi`
          : `${-n} minggu lalu`;
}

// kartu minggu: 7 hari, titik tenggat per hari, status padat/ringan/kosong, tombol pindah minggu
function weekCard(pend) {
  const T = iso(today());
  let total = 0;
  const cells = Array.from({ length: 7 }, (_, i) => {
    const d = addD(ws, i),
      k = iso(d),
      ts = pend.filter((t) => t.date === k);
    total += ts.length;
    const dots =
      ts
        .slice(0, 3)
        .map(
          (t) =>
            `<i class="h-1.5 w-1.5 rounded-full" style="background:rgb(${cvar(t.course)})"></i>`,
        )
        .join("") +
      (ts.length > 3
        ? `<b class="text-[10px] font-medium leading-none text-mute">+${ts.length - 3}</b>`
        : "");
    return `<button type="button" data-day="${k}" aria-pressed="${k === selDay}" aria-label="${longDate(k)}, ${ts.length} tenggat" class="flex flex-col items-center gap-1 rounded-2xl py-2 transition-colors hover:bg-surface ${k === selDay ? "bg-soft" : ""}">
      <span class="text-xs text-mute">${DN[i]}</span>
      <span class="grid h-8 w-8 place-items-center rounded-full text-sm ${k === T ? "bg-brand font-medium text-paper" : ""}">${d.getDate()}</span>
      <span class="flex h-2 items-center gap-0.5">${dots}</span>
    </button>`;
  }).join("");
  const st =
    total === 0
      ? ["Minggu kosong", "text-ok"]
      : total < 3
        ? [`Minggu ringan (${total})`, "bg-soft px-3 text-brand"]
        : [`Minggu padat (${total})`, "bg-warn px-3"];
  const isNow = iso(ws) === iso(mondayOf(today()));
  return `<section class="mb-8 rounded-3xl border border-line p-4" aria-label="Rencana minggu">
    <div class="flex items-center">
      <div class="min-w-0 flex-1"><p class="text-sm text-mute">${weekRel(ws)}</p><h2 class="text-lg font-medium">${weekLabel(ws)}</h2></div>
      <button type="button" id="wp" aria-label="Minggu sebelumnya" class="${arrow}">${icon("prev", "h-5 w-5")}</button>
      <button type="button" id="wn" aria-label="Minggu berikutnya" class="${arrow}">${icon("next", "h-5 w-5")}</button>
    </div>
    <div class="mt-2 grid grid-cols-7 gap-1">${cells}</div>
    <div class="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1">
      <span class="whitespace-nowrap rounded-full py-1 text-[13px] font-medium sm:text-sm ${st[1]}">${st[0]}</span>
      <div class="-mr-2 ml-auto flex items-center justify-end">
        ${isNow ? "" : '<button type="button" id="wt" class="btn-text whitespace-nowrap !px-2 !text-[13px] sm:!px-3 sm:!text-sm">Minggu ini</button>'}
        <button type="button" id="we" aria-label="Cari minggu kosong" class="btn-text whitespace-nowrap !px-2 !text-[13px] sm:!px-3 sm:!text-sm"><span class="sm:hidden">Cari kosong</span><span class="hidden sm:inline">Cari minggu kosong</span></button>
      </div>
    </div>
  </section>`;
}

function findEmptyWeek() {
  const pend = getTasks().filter((t) => !t.done),
    cur = mondayOf(today());
  let s = addD(ws, 7);
  if (s < cur) s = cur;
  for (let i = 0; i < 52; i++, s = addD(s, 7)) {
    const ks = new Set(Array.from({ length: 7 }, (_, j) => iso(addD(s, j))));
    if (!pend.some((t) => ks.has(t.date))) {
      ws = s;
      selDay = null;
      render();
      return;
    }
  }
  toast("Tidak ada minggu kosong dalam 1 tahun ke depan");
}

// daftar tenggat untuk satu hari yang dipilih di kartu minggu, dengan tombol kembali
function dayBlock() {
  const ts = getTasks()
    .filter((t) => t.date === selDay)
    .sort(cmp);
  return `<section class="${fresh ? "anim-fade" : ""}" aria-label="Tenggat ${longDate(selDay)}">
    <button type="button" id="db" class="btn-text -ml-4 mb-1">${icon("prev", "h-5 w-5")} Kembali</button>
    <h2 class="text-lg font-medium">${fromIso(selDay).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</h2>
    ${ts.length ? ts.map(taskItem).join("") : '<p class="py-3 text-sm text-mute">Tidak ada tenggat di hari ini.</p>'}
    <a href="tambah.html?date=${selDay}" class="btn-text -ml-4 mt-2">${icon("plus", "h-5 w-5")} Tambah tenggat</a>
  </section>`;
}

function render() {
  const T = today(),
    all = getTasks(),
    pend = all.filter((t) => !t.done),
    g = { late: [], soon: [], week: [], later: [] };
  pend.sort(cmp).forEach((t) => {
    const n = Math.round((fromIso(t.date) - T) / 864e5);
    (n < 0 ? g.late : n <= 2 ? g.soon : n <= 7 ? g.week : g.later).push(t);
  });
  const done = all.filter((t) => t.done).sort(cmp),
    keys = Object.keys(g).filter((k) => g[k].length);
  let h =
    (all.length || selDay ? '<h1 class="sr-only">Beranda</h1>' : "") +
    weekCard(pend);
  if (selDay) {
    app.innerHTML = h + dayBlock();
    fresh = false;
    return;
  }
  h += keys
    .map(
      (k) =>
        `<section class="mb-6"><h2 class="mb-1 text-sm font-medium ${LBL[k][1]}">${LBL[k][0]}</h2>${g[k].map(taskItem).join("")}</section>`,
    )
    .join("");
  if (done.length)
    h += `<details class="mb-6"><summary class="cursor-pointer py-2 text-sm text-mute">Selesai (${done.length})</summary>${done.map(taskItem).join("")}
    <button type="button" id="dd" class="btn-text -ml-4 mt-1 !text-danger">${icon("trash", "h-5 w-5")} Hapus semua yang selesai</button></details>`;
  // sapaan hanya muncul saat belum ada tenggat sama sekali, dan letaknya di bawah
  if (!all.length)
    h += `<div class="rounded-3xl bg-surface p-6">
    <h1 class="text-2xl font-medium tracking-tight">${greet()}</h1>
    <p class="mb-5 mt-1.5 text-mute">Belum ada tenggat. Tempel pengumuman atau tulis jadwal pertamamu.</p>
    <a href="tambah.html" class="btn">${icon("plus", "h-5 w-5")} Tambah tenggat pertama</a>
  </div>`;
  app.innerHTML = h;
}

app.addEventListener("click", async (e) => {
  const d = e.target.closest("[data-day]");
  if (d) {
    selDay = selDay === d.dataset.day ? null : d.dataset.day;
    fresh = !!selDay;
    return render();
  } // ketuk lagi = batal
  const id = e.target.closest("button")?.id;
  if (id === "db") {
    selDay = null;
    render();
  }
  if (id === "dd") {
    const n = getTasks().filter((t) => t.done).length;
    if (
      n &&
      (await confirmDialog({
        title: "Hapus semua yang selesai?",
        text: `${n} tenggat yang sudah selesai akan dihapus permanen.`,
      }))
    ) {
      clearDone();
      render();
      toast(`${n} tenggat dihapus`);
    }
  }
  if (id === "wp") {
    ws = addD(ws, -7);
    selDay = null;
    render();
  }
  if (id === "wn") {
    ws = addD(ws, 7);
    selDay = null;
    render();
  }
  if (id === "wt") {
    ws = mondayOf(today());
    selDay = null;
    render();
  }
  if (id === "we") findEmptyWeek();
});
bindActions(app, render);
render();
