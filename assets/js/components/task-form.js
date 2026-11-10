import { esc, rel, longDate } from "../core/date-utils.js";

const L = "grid gap-1.5 text-sm text-mute";
const TYPES = [
  "Tugas",
  "Kuis",
  "UTS",
  "UAS",
  "Praktikum",
  "Presentasi",
  "Lomba",
  "Rapat",
  "Acara",
];

export const taskFields = (v = {}) => `
  <label class="${L}">Kegiatan<input id="f-course" class="field" autocomplete="off" placeholder="Mata kuliah, lomba, rapat, dll" value="${esc(v.course || "")}"></label>
  <label class="${L}">Jenis (boleh kosong)<input id="f-title" class="field" autocomplete="off" list="f-types" placeholder="Tugas, kuis, lomba…" value="${esc(v.title || "")}"></label>
  <datalist id="f-types">${TYPES.map((t) => `<option value="${t}">`).join("")}</datalist>
  <div class="grid grid-cols-2 gap-3">
    <label class="${L}">Tanggal<input id="f-date" type="date" required class="field" value="${esc(v.date || "")}"></label>
    <label class="${L}">Jam (boleh kosong)<input id="f-time" type="time" class="field" value="${esc(v.time || "")}"></label>
  </div>
  <p id="f-hint" class="-mt-2 text-sm text-mute"></p>
  <label class="${L}">Catatan (boleh kosong)<textarea id="f-note" rows="3" class="field resize-y">${esc(v.note || "")}</textarea></label>`;

export const readFields = (root) => ({
  course: root.querySelector("#f-course").value.trim() || "Tanpa judul",
  title: root.querySelector("#f-title").value.trim(),
  date: root.querySelector("#f-date").value,
  time: root.querySelector("#f-time").value,
  note: root.querySelector("#f-note").value.trim(),
});

export function setFields(root, v) {
  root.querySelector("#f-course").value = v.course || "";
  root.querySelector("#f-title").value = v.title || "";
  root.querySelector("#f-date").value = v.date || "";
  root.querySelector("#f-time").value = v.time || "";
  root.querySelector("#f-note").value = v.note || "";
}

export function bindHint(root) {
  const d = root.querySelector("#f-date"),
    h = root.querySelector("#f-hint");
  const upd = () => {
    h.textContent = d.value ? `${longDate(d.value)} · ${rel(d.value)}` : "";
  };
  d.addEventListener("input", upd);
  d.addEventListener("change", upd);
  upd();
  return upd;
}
