import { getTheme } from "./core/store.js";
import { mountNav } from "./components/nav.js";
import { toast } from "./components/toast.js";

export const applyTheme = () => {
  const t = getTheme();
  const dark =
    t === "dark" ||
    (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
};
applyTheme();
mountNav(document.body.dataset.page);

// ---- animasi pindah halaman: isi lama memudar, halaman baru muncul berurutan (seperti saat refresh), tanpa geser ----
const root = document.documentElement;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

root.classList.add("enter");
setTimeout(() => root.classList.remove("enter"), 800); // dilepas supaya render ulang (centang, ganti bulan) tidak ikut beranimasi

document.addEventListener("click", (e) => {
  if (
    calm ||
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  )
    return;
  const a = e.target.closest("a[href]");
  if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
  const u = new URL(a.href, location.href);
  if (
    u.origin !== location.origin ||
    !(u.pathname.endsWith(".html") || u.pathname.endsWith("/"))
  )
    return;
  if (u.pathname === location.pathname && u.search === location.search) return;
  e.preventDefault();
  root.classList.remove("enter");
  root.classList.add("leaving");
  setTimeout(() => {
    location.href = u.href;
  }, 140);
});
addEventListener("pageshow", (e) => {
  if (e.persisted) root.classList.remove("leaving");
}); // tombol Back browser

try {
  const m = sessionStorage.getItem("toast");
  if (m) {
    sessionStorage.removeItem("toast");
    toast(m);
  }
} catch {}

// Service worker hanya aktif di situs asli (HTTPS). Di localhost / Live Server dimatikan supaya
// perubahan kode langsung terlihat, dan SW lama yang tersangkut ikut dibersihkan.
if ("serviceWorker" in navigator) {
  const dev = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  addEventListener("load", async () => {
    if (!dev) return navigator.serviceWorker.register("sw.js");
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    if (window.caches) (await caches.keys()).forEach((k) => caches.delete(k));
  });
}
