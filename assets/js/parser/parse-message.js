import { pad, iso, addD, today as getToday } from "../core/date-utils.js";
const MON = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  mei: 4,
  jun: 5,
  jul: 6,
  agu: 7,
  sep: 8,
  okt: 9,
  nov: 10,
  nop: 10,
  des: 11,
};
const WD = {
  senin: 0,
  selasa: 1,
  rabu: 2,
  kamis: 3,
  jumat: 4,
  sabtu: 5,
  minggu: 6,
};

function mk(d, mi, y, today) {
  let yr = y ? (+y < 100 ? 2000 + +y : +y) : today.getFullYear(),
    dt = new Date(yr, mi, d);
  if (mi > 11 || dt.getDate() !== d) return null;
  if (!y && dt < addD(today, -30)) dt = new Date(yr + 1, mi, d);
  return dt;
}

// ---- pembaca nama kegiatan (mata kuliah, lomba, rapat, dll) ----
// kata penanda tanggal/jam: nama kegiatan selalu berhenti di sini
const HARD = new Set(
  "deadline dikumpul dikumpulkan dikumpulin kumpul paling lambat batas tenggat selambatnya sebelum jam pukul pkl tanggal tgl hari besok lusa senin selasa rabu kamis jumat sabtu minggu depan".split(
    " ",
  ),
);
// kata sambung/sapaan: ikut menghentikan nama, kecuali pada pembacaan "longgar"
const SOFT =
  "ya yaa nih dong ada akan ini itu yg yang di ke lewat via untuk kelompok individu mohon harap tolong jangan lupa dikerjakan dikirim dikirimkan".split(
    " ",
  );
const STOP = new Set([...HARD, ...SOFT]);

const ACAD =
  "laporan praktikum|tugas|kuis|quiz|uts|uas|ujian|praktikum|presentasi|makalah|proyek|laporan";
const EVENT =
  "lomba|turnamen|kompetisi|olimpiade|pertandingan|rapat|meeting|acara|seminar|webinar|workshop|pelatihan|wawancara|interview|sidang|konser|reuni|latihan|kunjungan";
const KW = new RegExp("\\b(" + ACAD + "|" + EVENT + ")\\b", "i");
const IS_EVENT = new RegExp("^(" + EVENT + ")$", "i");
const KW_WORDS = new Set(ACAD.split("|").filter((w) => !w.includes(" ")));

const LEAD =
  /^(halo|hai|hi|hei|selamat|pagi|siang|sore|malam|reminder|pengingat|pengumuman|info|perhatian|jadwal|agenda|teman-teman|temen-temen|guys|semua|all)$/i;
const MONTH = /^(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|nop|des)/i;
const ROMAN = /^(i|ii|iii|iv|v|vi)$/i;
const clean = (s) => s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

function pretty(w) {
  if (ROMAN.test(w) || /\d/.test(w)) return w.toUpperCase(); // II, 10K
  if (w.length <= 5 && w === w.toUpperCase() && /[A-Z]/.test(w)) return w; // singkatan: PBO, BEM
  return w[0].toUpperCase() + w.slice(1).toLowerCase();
}

function stripLead(str) {
  const toks = str.split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < toks.length && (!clean(toks[i]) || LEAD.test(clean(toks[i])))) i++;
  return toks.slice(i).join(" ");
}

// ambil beberapa kata dari awal teks, berhenti di kata penanda (deadline, jam, hari, tanggal, dst)
// o.kw: berhenti juga di kata "tugas/kuis/..."; o.loose: hanya berhenti di kata penanda tanggal/jam; o.max: maks. jumlah kata
function takeCourse(str, o = {}) {
  const stop = o.loose ? HARD : STOP,
    max = o.max || 4;
  const toks = str.split(/\s+/).filter(Boolean),
    out = [];
  let i = 0;
  while (i < toks.length && !clean(toks[i])) i++;
  for (; i < toks.length && out.length < max; i++) {
    const raw = toks[i],
      w = clean(raw),
      lw = w.toLowerCase();
    if (!w || stop.has(lw) || (o.kw && KW_WORDS.has(lw))) break;
    if (/^\d+$/.test(w)) {
      if (!out.length || w.length > 1 || MONTH.test(clean(toks[i + 1] || "")))
        break; // "Kalkulus 2" boleh, "12 november" tidak
    } else if (/\d/.test(w) && /[.:\/-]/.test(w)) break; // 23.59, 12/11
    out.push(pretty(w));
    if (/[,.:;!?]$/.test(raw)) break;
  }
  return out.join(" ");
}

export function parse(text) {
  const today = getToday();
  const t = text.toLowerCase().replace(/jum['’]at/g, "jumat"),
    c = [];
  let m;
  const r1 =
    /(\d{1,2})\s*(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|nop|des)[a-z]*\.?(?:\s*(\d{4}))?/g;
  while ((m = r1.exec(t))) {
    const d = mk(+m[1], MON[m[2]], m[3], today);
    if (d) c.push({ i: m.index, d, s: m[0].trim() });
  }
  const r2 = /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/g;
  while ((m = r2.exec(t))) {
    const d = mk(+m[1], +m[2] - 1, m[3], today);
    if (d) c.push({ i: m.index, d, s: m[0] });
  }
  const r3 = /\b(hari ini|besok|lusa)\b/g;
  while ((m = r3.exec(t)))
    c.push({
      i: m.index,
      d: addD(today, { "hari ini": 0, besok: 1, lusa: 2 }[m[1]]),
      s: m[0],
    });
  const r4 =
    /\b(senin|selasa|rabu|kamis|jumat|sabtu|minggu)\b(\s+(?:minggu\s+)?(?:depan|ini))?/g;
  while ((m = r4.exec(t))) {
    const rest = t.slice(m.index + m[0].length);
    if (m[1] === "minggu" && (m[2] || /^\s*(depan|ini|lalu|ke)/.test(rest)))
      continue;
    const k = WD[m[1]],
      mon = addD(today, -((today.getDay() + 6) % 7));
    let d;
    if (m[2] && /depan/.test(m[2])) d = addD(mon, 7 + k);
    else if (m[2]) d = addD(mon, k);
    else {
      d = addD(mon, k);
      if (d < today) d = addD(d, 7);
    }
    c.push({ i: m.index, d, s: m[0].trim() });
  }
  c.sort((a, b) => a.i - b.i);
  const k = t.search(
    /dikumpul|deadline|paling lambat|batas|sebelum|selambatnya|tenggat/,
  );
  const pick = (k >= 0 && c.find((x) => x.i >= k)) || c[0];

  // jam: "jam 11", "pukul 10.30", "16.00 WIB"; "jam 3 sore" -> 15:00
  const tm = text.match(
    /(?:jam|pukul|pkl\.?)\s*(\d{1,2})(?:[.:](\d{2}))?|\b(\d{1,2})[.:](\d{2})\s*(?:wib|wita|wit)\b/i,
  );
  let time = "";
  if (tm) {
    let h = +(tm[1] || tm[3]);
    const mi = tm[2] || tm[4] || "00";
    const after = text.slice(tm.index + tm[0].length);
    if (h < 12 && /^\s*(sore|malam)/i.test(after)) h += 12;
    else if (h >= 1 && h < 11 && /^\s*siang/i.test(after)) h += 12;
    if (h < 24) time = pad(h) + ":" + mi;
  }

  // nama kegiatan (course) dan jenis (title)
  let course = "",
    title = "";
  const kw = text.match(KW);
  if (kw) {
    const w = kw[0];
    if (IS_EVENT.test(w)) {
      course = takeCourse(text.slice(kw.index), { max: 6 }); // "lomba marathon" -> "Lomba Marathon"
    } else {
      title = /^(uts|uas)$/i.test(w)
        ? w.toUpperCase()
        : w[0].toUpperCase() + w.slice(1).toLowerCase();
      course = takeCourse(text.slice(kw.index + w.length)); // "tugas Basis Data" -> "Basis Data"
    }
  }
  if (!course) course = takeCourse(stripLead(text), { kw: true });
  if (!course)
    course = takeCourse(stripLead(text), { kw: true, loose: true, max: 6 });
  if (!title && !kw && /deadline|dikumpul|tenggat|paling lambat/i.test(text))
    title = "Tugas";

  return {
    course,
    title,
    date: pick ? iso(pick.d) : "",
    from: pick ? pick.s : "",
    time,
  };
}
