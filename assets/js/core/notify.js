import { getTasks, updateTask } from "./store.js";
import { fmt } from "./date-utils.js";

export const supported = () =>
  "Notification" in window && "serviceWorker" in navigator;
export const perm = () =>
  supported() ? Notification.permission : "unsupported";
export const ask = async () =>
  supported() ? Notification.requestPermission() : "unsupported";

export async function show(title, body, tag) {
  const opt = {
    body,
    tag,
    icon: "assets/icons/icon-192.png",
    badge: "assets/icons/icon-192.png",
  };
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) return reg.showNotification(title, opt);
  new Notification(title, opt);
}

// Cek pengingat yang sudah waktunya. Jalan saat aplikasi terbuka, tiap 30 detik,
// dan setiap kali aplikasi dibuka lagi (pengingat yang terlewat langsung muncul).
export async function checkDue() {
  if (perm() !== "granted") return;
  const now = Date.now();
  for (const t of getTasks()) {
    if (t.done || t.reminded || !t.remind) continue;
    if (new Date(t.remind).getTime() > now) continue;
    updateTask(t.id, { reminded: true });
    const end = new Date(t.date + "T" + (t.time || "23:59")).getTime();
    if (now - end > 864e5) continue; // sudah lewat >1 hari: jangan ganggu
    await show(
      t.course + (t.title ? " · " + t.title : ""),
      fmt(t.date) + (t.time ? ", jam " + t.time.replace(":", ".") : ""),
      t.id,
    );
  }
}

export function startChecker() {
  checkDue();
  setInterval(checkDue, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkDue();
  });
}
