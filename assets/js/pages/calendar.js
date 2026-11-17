import "../app.js";
import { getTasks, addTask } from "../core/store.js";
import {
  today,
  iso,
  fromIso,
  addD,
  pad,
  MN,
  DN,
  esc,
} from "../core/date-utils.js";
import { taskItem, bindActions, cvar } from "../components/task-item.js";
import { icon } from "../components/icons.js";
import { toast } from "../components/toast.js";
import { TYPES } from "../components/task-form.js";

const app = document.getElementById("app");
const T = today(),
  q = new URLSearchParams(location.search).get("d");
let sel = q || iso(T);
const b0 = fromIso(sel);
let view = { y: b0.getFullYear(), m: b0.getMonth() };
const cmp = (a, b) =>
  a.date + (a.time || "99") < b.date + (b.time || "99") ? -1 : 1;
const nav = "grid h-10 w-10 place-items-center rounded-full hover:bg-surface";
const wide = matchMedia("(min-width:1024px)");
const COLS = "grid-cols-[1.75rem_repeat(7,minmax(0,1fr))]"; // kolom kiri = jumlah tenggat per minggu

function render() {
  const tasks = getTasks(),
    pend = tasks.filter((t) => !t.done),
    { y, m } = view;
  const first = new Date(y, m, 1),
    lead = (first.getDay() + 6) % 7;
  const rows = Math.ceil((lead + new Date(y, m + 1, 0).getDate()) / 7),
    st = addD(first, -lead);
  let cells = "";
  for (let i = 0; i < rows * 7; i++) {
    const d = addD(st, i),
      k = iso(d),
      ts = tasks.filter((t) => t.date === k).sort(cmp),
      isT = k === iso(T);
    if (i % 7 === 0) {
      const ks = Array.from({ length: 7 }, (_, j) => iso(addD(d, j)));
      const cnt = pend.filter((t) => ks.includes(t.date)).length;
      cells += `<div aria-label="${cnt} tenggat belum selesai di minggu ini" class="flex items-center justify-center border-b border-r border-line text-xs font-medium ${cnt >= 3 ? "bg-warn" : "text-mute"}">${cnt || ""}</div>`;
    }
    cells += `<button type="button" data-d="${k}" aria-label="${d.getDate()} ${MN[d.getMonth()]}, ${ts.length} tugas"
      class="flex min-h-[64px] flex-col items-center gap-1 border-b border-r border-line p-1 text-left transition-colors hover:bg-surface md:min-h-[112px] md:items-stretch ${d.getMonth() !== m ? "opacity-40" : ""} ${k === sel ? "bg-soft" : ""}">
      <span class="grid h-7 w-7 place-items-center self-center rounded-full text-sm md:self-start ${isT ? "bg-brand font-medium text-paper" : ""}">${d.getDate()}</span>
      ${ts
        .slice(0, 2)
        .map(
          (t) =>
            `<span class="hidden w-full truncate rounded-md px-1.5 py-0.5 text-xs font-medium md:block ${t.done ? "line-through opacity-50" : ""}" style="--c:${cvar(t.course)};background:rgb(var(--c) / .16);color:rgb(var(--c))">${esc(t.course)}</span>`,
        )
        .join("")}
      ${ts.length > 2 ? `<span class="hidden px-1 text-xs text-mute md:block">+${ts.length - 2} lagi</span>` : ""}
      ${
        ts.length
          ? `<span class="flex gap-0.5 md:hidden">${ts
              .slice(0, 3)
              .map(
                (t) =>
                  `<i class="h-1.5 w-1.5 rounded-full ${t.done ? "opacity-40" : ""}" style="background:rgb(${cvar(t.course)})"></i>`,
              )
              .join("")}</span>`
          : ""
      }
    </button>`;
  }
  const dayTasks = tasks.filter((t) => t.date === sel).sort(cmp);
  app.innerHTML = `
  <div class="lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
    <div>
      <div class="mb-4 flex items-center gap-1">
        <h1 class="flex-1 text-2xl font-medium md:text-3xl">${MN[m]} <span class="text-mute">${y}</span></h1>
        <button type="button" id="tm" class="btn-line mr-1 !py-1.5">Hari ini</button>
        <button type="button" id="pm" aria-label="Bulan sebelumnya" class="${nav}">${icon("prev", "h-5 w-5")}</button>
        <button type="button" id="nm" aria-label="Bulan berikutnya" class="${nav}">${icon("next", "h-5 w-5")}</button>
      </div>
      <div class="grid ${COLS} pb-1 text-center text-xs text-mute"><div></div>${DN.map((d) => `<div>${d}</div>`).join("")}</div>
      <div class="grid ${COLS} border-l border-t border-line">${cells}</div>
      <p class="mt-2 text-xs text-mute">Angka di kiri: tenggat yang belum selesai di minggu itu. Latar kuning = minggu padat (3 atau lebih).</p>
    </div>
    <aside class="mt-8 lg:mt-0">
      <h2 class="text-lg font-medium">${fromIso(sel).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</h2>
      ${dayTasks.length ? dayTasks.map(taskItem).join("") : '<p class="py-3 text-sm text-mute">Tidak ada tenggat di tanggal ini.</p>'}
      <form id="qf" class="mt-3 grid gap-3 rounded-2xl border border-line p-3">
        <input id="q-course" required autocomplete="off" class="field" placeholder="Tambah tenggat di tanggal ini" aria-label="Kegiatan">
        <div class="grid grid-cols-2 gap-3">
          <input id="q-title" list="q-types" autocomplete="off" class="field" placeholder="Jenis" aria-label="Jenis (boleh kosong)">
          <input id="q-time" type="time" class="field" aria-label="Jam (boleh kosong)">
        </div>
        <datalist id="q-types">${TYPES.map((t) => `<option value="${t}">`).join("")}</datalist>
        <label class="grid gap-1.5 text-sm text-mute">Ingatkan saya pada (boleh kosong)<input id="q-remind" type="datetime-local" class="field"></label>
        <div class="-mt-1 flex flex-wrap gap-1">
          <button type="button" data-r="0" class="btn-line !px-3 !py-1.5 !text-[13px]">Saat tenggat</button>
          <button type="button" data-r="60" class="btn-line !px-3 !py-1.5 !text-[13px]">1 jam sebelum</button>
          <button type="button" data-r="1440" class="btn-line !px-3 !py-1.5 !text-[13px]">1 hari sebelum</button>
          <button type="button" data-r="x" class="btn-text !px-3 !py-1.5 !text-[13px]">Hapus</button>
        </div>
        <div class="flex items-center gap-1">
          <button class="btn">Simpan</button>
          <a href="tambah.html?date=${sel}" class="btn-text">Tempel pengumuman</a>
        </div>
      </form>
    </aside>
  </div>`;
}

app.addEventListener("click", (e) => {
  const rb = e.target.closest("[data-r]");
  if (rb) {
    const r = app.querySelector("#q-remind");
    if (rb.dataset.r === "x") return (r.value = "");
    const t = new Date(
      sel + "T" + (app.querySelector("#q-time").value || "09:00"),
    );
    t.setMinutes(t.getMinutes() - +rb.dataset.r);
    r.value = iso(t) + "T" + pad(t.getHours()) + ":" + pad(t.getMinutes());
    return;
  }
  const d = e.target.closest("[data-d]");
  if (d) {
    sel = d.dataset.d;
    const x = fromIso(sel);
    view = { y: x.getFullYear(), m: x.getMonth() };
    render();
    return focusForm();
  }
  const id = e.target.closest("button")?.id;
  if (id === "pm") {
    view.m--;
    if (view.m < 0) {
      view.m = 11;
      view.y--;
    }
    render();
  }
  if (id === "nm") {
    view.m++;
    if (view.m > 11) {
      view.m = 0;
      view.y++;
    }
    render();
  }
  if (id === "tm") {
    view = { y: T.getFullYear(), m: T.getMonth() };
    sel = iso(T);
    render();
  }
});
// setelah pilih tanggal: di layar lebar kursor langsung masuk ke isian, di HP layar digeser ke daftar + isian
function focusForm() {
  const a = app.querySelector("aside");
  if (!a) return;
  if (wide.matches) a.querySelector("#q-course")?.focus();
  else a.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

app.addEventListener("submit", (e) => {
  if (e.target.id !== "qf") return;
  e.preventDefault();
  const f = e.target;
  addTask({
    course: f.querySelector("#q-course").value.trim(),
    title: f.querySelector("#q-title").value.trim(),
    date: sel,
    time: f.querySelector("#q-time").value,
    note: "",
    remind: f.querySelector("#q-remind").value,
    reminded: false,
  });
  render();
  toast("Tenggat disimpan");
  if (wide.matches) app.querySelector("#q-course")?.focus(); // lanjut tambah yang lain
});

bindActions(app, render);
render();
