export const pad = (n) => String(n).padStart(2, "0");
export const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s) => {
  const [a, b, c] = s.split("-");
  return new Date(+a, b - 1, +c);
};
export const addD = (d, n) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const today = () => addD(new Date(), 0);
export const mondayOf = (d) => addD(d, -((d.getDay() + 6) % 7));
export const MN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
export const DN = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const fmt = (k) =>
  fromIso(k).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
export const longDate = (k) =>
  fromIso(k).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const diffDays = (k) => Math.round((fromIso(k) - today()) / 864e5);
export const rel = (k) => {
  const n = diffDays(k);
  return n === 0
    ? "Hari ini"
    : n === 1
      ? "Besok"
      : n === 2
        ? "Lusa"
        : n > 0
          ? `${n} hari lagi`
          : `${-n} hari lalu`;
};
export const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
