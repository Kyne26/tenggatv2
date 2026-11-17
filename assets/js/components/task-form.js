import { esc, rel, longDate, iso, pad } from "../core/date-utils.js";

const L = "grid gap-1.5 text-sm text-mute";
export const TYPES = [
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
  <label class="${L}">Ingatkan saya pada (boleh kosong)<input id="f-remind" type="datetime-local" class="field" value="${esc(v.remind || "")}"></label>
  <div class="-mt-2 flex flex-wrap gap-1">
    <button type="button" data-r="0" class="btn-line !px-3 !py-1.5 !text-[13px]">Saat tenggat</button>
    <button type="button" data-r="60" class="btn-line !px-3 !py-1.5 !text-[13px]">1 jam sebelum</button>
    <button type="button" data-r="1440" class="btn-line !px-3 !py-1.5 !text-[13px]">1 hari sebelum</button>
    <button type="button" data-r="x" class="btn-text !px-3 !py-1.5 !text-[13px]">Hapus</button>
  </div>
  <label class="${L}">Catatan (boleh kosong)<textarea id="f-note" rows="3" class="field resize-y">${esc(v.note || "")}</textarea></label>`;

export const readFields = (root) => ({
  course: root.querySelector("#f-course").value.trim() || "Tanpa judul",
  title: root.querySelector("#f-title").value.trim(),
  date: root.querySelector("#f-date").value,
  time: root.querySelector("#f-time").value,
  note: root.querySelector("#f-note").value.trim(),
  remind: root.querySelector("#f-remind").value,
  reminded: false,
});

export function setFields(root, v) {
  root.querySelector("#f-course").value = v.course || "";
  root.querySelector("#f-title").value = v.title || "";
  root.querySelector("#f-date").value = v.date || "";
  root.querySelector("#f-time").value = v.time || "";
  root.querySelector("#f-remind").value = v.remind || "";
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
  root.querySelectorAll("[data-r]").forEach((b) => {
    b.onclick = () => {
      const r = root.querySelector("#f-remind");
      if (b.dataset.r === "x") return (r.value = "");
      if (!d.value) return d.focus();
      const t = new Date(
        d.value + "T" + (root.querySelector("#f-time").value || "09:00"),
      );
      t.setMinutes(t.getMinutes() - +b.dataset.r);
      r.value = iso(t) + "T" + pad(t.getHours()) + ":" + pad(t.getMinutes());
    };
  });
  upd();
  return upd;
}
