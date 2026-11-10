import "../app.js";
import { parse } from "../parser/parse-message.js";
import { addTask } from "../core/store.js";
import { esc } from "../core/date-utils.js";
import {
  taskFields,
  readFields,
  setFields,
  bindHint,
} from "../components/task-form.js";
import { icon } from "../components/icons.js";

const S = [
  "Halo teman-teman, tugas Basis Data kelompok dikumpulkan Jumat depan jam 23.59 ya, lewat Google Classroom.",
  "Reminder: Kuis Kalkulus 2 besok pukul 10.00 di kelas B.",
  "Laporan praktikum Jaringan Komputer paling lambat 20 November 2026 jam 16.00.",
  "Jadwal lomba marathon 12 November 2026 jam 6 pagi.",
  "Rapat BEM besok jam 3 sore.",
];
let si = 0;
const app = document.getElementById("app"),
  pre = new URLSearchParams(location.search).get("date") || "";

app.innerHTML = `
  <h1 class="text-2xl font-medium">Tambah tenggat</h1>
  <p class="mb-5 mt-1 text-sm text-mute">Tempel pengumuman atau tulis jadwalmu, lalu cek hasil bacaannya. Teks hanya diproses di perangkat ini.</p>
  <textarea id="msg" rows="5" placeholder="Contoh: Jadwal lomba marathon 12 November 2026 jam 6 pagi" class="field resize-y"></textarea>
  <div class="mt-3 flex items-center gap-1">
    <button type="button" id="read" class="btn">Baca pesan</button>
    <button type="button" id="manual" class="btn-text">Isi manual</button>
    <span class="flex-1"></span>
    <button type="button" id="sample" class="btn-text">Pakai contoh</button>
  </div>
  <form id="f" hidden class="mt-6 grid gap-4 border-t border-line pt-6">
    <h2 class="text-lg font-medium">Cek hasil bacaan</h2>
    <p id="pn" class="flex items-start gap-2 text-sm"></p>
    ${taskFields()}
    <div class="flex items-center gap-1"><button class="btn">Simpan tenggat</button><button type="button" id="cancel" class="btn-text">Batal</button></div>
  </form>`;

const $ = (s) => app.querySelector(s);
const upd = bindHint(app);

function show(p, kind) {
  $("#f").hidden = false;
  setFields(app, p);
  upd();
  $("#pn").innerHTML =
    kind === "ok"
      ? `<span class="text-ok">${icon("check", "h-5 w-5 shrink-0", 2.4)}</span><span>Tanggal dibaca dari “${esc(p.from)}”. Periksa dulu sebelum disimpan.</span>`
      : kind === "miss"
        ? `<span class="text-danger">${icon("alert", "h-5 w-5 shrink-0")}</span><span class="text-danger">Tanggal tidak terbaca. Isi sendiri ya.</span>`
        : '<span class="text-mute">Isi detail tenggatnya.</span>';
  $("#f").scrollIntoView({ block: "nearest", behavior: "smooth" });
}

$("#sample").onclick = () => {
  $("#msg").value = S[si++ % S.length];
};
$("#read").onclick = () => {
  const v = $("#msg").value.trim();
  if (!v) return $("#msg").focus();
  const p = parse(v);
  show(p, p.date ? "ok" : "miss");
};
$("#manual").onclick = () => {
  show({ course: "", title: "", date: pre, time: "", note: "" }, "manual");
  $("#f-course").focus();
};
$("#cancel").onclick = () => {
  $("#f").hidden = true;
};
$("#f").onsubmit = (e) => {
  e.preventDefault();
  const v = readFields(app);
  if (!v.date) return;
  addTask(v);
  try {
    sessionStorage.setItem("toast", "Tenggat disimpan");
  } catch {}
  location.href = "kalender.html?d=" + v.date;
};
if (pre)
  show({ course: "", title: "", date: pre, time: "", note: "" }, "manual");
