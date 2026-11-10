import { iso, addD, today } from "./date-utils.js";

const KEY = "tenggat:v1";
const blank = () => ({ v: 1, theme: "auto", tasks: [] });
const read = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    return d && Array.isArray(d.tasks) ? d : blank();
  } catch {
    return blank();
  }
};
const write = (d) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
};
const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + "-" + Math.random().toString(16).slice(2);

export const getTasks = () => read().tasks;
export const getTask = (id) => read().tasks.find((x) => x.id === id);
export const addTask = (t) => {
  const d = read();
  d.tasks.push({ id: uid(), done: false, note: "", ...t });
  write(d);
};
export const updateTask = (id, patch) => {
  const d = read();
  const t = d.tasks.find((x) => x.id === id);
  if (t) Object.assign(t, patch);
  write(d);
};
export const toggleTask = (id) => {
  const d = read();
  const t = d.tasks.find((x) => x.id === id);
  if (t) t.done = !t.done;
  write(d);
};
export const delTask = (id) => {
  const d = read();
  d.tasks = d.tasks.filter((x) => x.id !== id);
  write(d);
};
export const clearAll = () => {
  const d = read();
  d.tasks = [];
  write(d);
};
export const countTasks = () => {
  const t = read().tasks;
  return { all: t.length, done: t.filter((x) => x.done).length };
};
export const clearDone = () => {
  const d = read(),
    n = d.tasks.filter((t) => t.done).length;
  d.tasks = d.tasks.filter((t) => !t.done);
  write(d);
  return n;
};

// Hapus total sampai ke akarnya: tenggat, tema, data sementara, cache offline, dan service worker.
// Hanya menyentuh milik aplikasi ini (awalan "tenggat" / scope folder ini), jadi aman walau
// localhost dipakai proyek lain.
export async function wipeAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("tenggat"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
  try {
    sessionStorage.clear();
  } catch {}
  try {
    if (window.caches)
      await Promise.all(
        (await caches.keys())
          .filter((k) => k.startsWith("tenggat"))
          .map((k) => caches.delete(k)),
      );
  } catch {}
  try {
    if (navigator.serviceWorker) {
      const scope = new URL("./", document.baseURI).href;
      await Promise.all(
        (await navigator.serviceWorker.getRegistrations())
          .filter((r) => r.scope === scope)
          .map((r) => r.unregister()),
      );
    }
  } catch {}
}
export const getTheme = () => read().theme || "auto";
export const setTheme = (t) => {
  const d = read();
  d.theme = t;
  write(d);
};
export const exportJson = () => JSON.stringify(read(), null, 2);
export const importJson = (txt) => {
  const d = JSON.parse(txt);
  if (!d || !Array.isArray(d.tasks)) throw new Error("format salah");
  write({ v: 1, theme: d.theme || "auto", tasks: d.tasks });
};
export const seedDemo = () => {
  const d = read(),
    T = today();
  [
    ["Bahasa Inggris", "Presentasi", 0, "13:00"],
    ["Pemrograman Web", "Tugas", 2, "23:59"],
    ["Statistika", "Kuis", 3, "10:00"],
    ["Jaringan Komputer", "Praktikum", 4, "08:00"],
    ["Basis Data", "Laporan", 4, "16:00"],
    ["Kalkulus 2", "Tugas", 10, "23:59"],
  ].forEach(([course, title, n, time]) =>
    d.tasks.push({
      id: uid(),
      done: false,
      note: "",
      course,
      title,
      date: iso(addD(T, n)),
      time,
    }),
  );
  write(d);
};
