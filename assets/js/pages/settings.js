import { applyTheme } from "../app.js";
import {
  getTheme,
  setTheme,
  exportJson,
  importJson,
  clearAll,
  clearDone,
  countTasks,
  wipeAll,
  seedDemo,
} from "../core/store.js";
import { toast } from "../components/toast.js";
import { confirmDialog } from "../components/modal.js";

const app = document.getElementById("app");

// ---- pasang aplikasi (PWA) ----
let promptEv = null; // event "beforeinstallprompt" dari browser (Chrome/Edge/Android)
const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches ||
  navigator.standalone === true;
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

function drawInstall() {
  const box = document.getElementById("inst-box");
  if (!box) return;
  if (isStandalone()) {
    box.innerHTML = `<p class="text-sm text-ok">Aplikasi sudah terpasang di perangkat ini.</p>`;
  } else if (promptEv) {
    box.innerHTML = `<button type="button" id="inst" class="btn">Install</button>`;
  } else if (isIos()) {
    box.innerHTML = `<p class="text-sm text-mute">Di iPhone/iPad: buka lewat Safari, ketuk <b>Bagikan</b>, lalu pilih <b>Tambah ke Layar Utama</b>.</p>`;
  } else {
    box.innerHTML = `<p class="text-sm text-mute">Tombol install belum tersedia. Buka lewat HTTPS di Chrome/Edge, lalu coba lagi. Atau pakai menu browser → Instal aplikasi.</p>`;
  }
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // tahan prompt bawaan, kita tampilkan lewat tombol sendiri
  promptEv = e;
  drawInstall();
});
window.addEventListener("appinstalled", () => {
  promptEv = null;
  drawInstall();
  toast("Aplikasi berhasil dipasang");
});

function draw() {
  app.innerHTML = `
  <h1 class="mb-6 text-2xl font-medium">Pengaturan</h1>
  <section class="mb-8 border-b border-line pb-8">
    <h2 class="mb-3 font-medium">Tema</h2>
    <div class="flex flex-wrap gap-2">
      ${[
        ["auto", "Ikuti sistem"],
        ["light", "Terang"],
        ["dark", "Gelap"],
      ]
        .map(
          ([v, l]) =>
            `<button type="button" data-t="${v}" class="rounded-full border px-5 py-2.5 text-sm font-medium ${getTheme() === v ? "border-brand bg-soft text-brand" : "border-line hover:bg-surface"}">${l}</button>`,
        )
        .join("")}
    </div>
  </section>
  <section class="mb-8 border-b border-line pb-8">
    <h2 class="mb-1 font-medium">Pasang aplikasi</h2>
    <p class="mb-3 text-sm text-mute">Pasang Tenggat ke layar utama supaya bisa dibuka seperti aplikasi biasa, juga saat offline.</p>
    <div id="inst-box"></div>
  </section>
  <section class="mb-8 border-b border-line pb-8">
    <h2 class="mb-1 font-medium">Cadangan data</h2>
    <p class="mb-3 text-sm text-mute">Data tersimpan di browser ini saja. Ekspor berkala supaya aman kalau data browser terhapus.</p>
    <div class="flex flex-wrap gap-2">
      <button type="button" id="ex" class="btn-line">Ekspor (.json)</button>
      <label class="btn-line cursor-pointer">Impor<input id="im" type="file" accept="application/json" hidden></label>
    </div>
  </section>
  <section class="mb-8 border-b border-line pb-8">
    <h2 class="mb-1 font-medium">Data contoh</h2>
    <p class="mb-3 text-sm text-mute">Tambahkan beberapa tenggat contoh untuk mencoba tampilan.</p>
    <button type="button" id="demo" class="btn-line">Isi data contoh</button>
  </section>
  <section>
    <h2 class="mb-1 font-medium text-danger">Hapus data</h2>
    <p class="mb-4 text-sm text-mute">Penghapusan bersifat permanen: datanya hilang dari penyimpanan browser, tidak ada tempat sampah atau riwayat. File cadangan (.json) yang pernah kamu unduh tersimpan di perangkatmu dan tidak ikut terhapus.</p>
    <div class="grid gap-3">
      <div class="flex items-center gap-3"><p class="flex-1 text-sm">Tenggat yang sudah selesai</p><button type="button" id="cd" class="btn-line !border-danger !text-danger">Hapus</button></div>
      <div class="flex items-center gap-3"><p class="flex-1 text-sm">Semua tenggat (tema tetap)</p><button type="button" id="cl" class="btn-line !border-danger !text-danger">Hapus</button></div>
      <div class="flex items-center gap-3"><p class="flex-1 text-sm">Semua data aplikasi dan reset total</p><button type="button" id="rs" class="btn !bg-danger">Hapus semua</button></div>
    </div>
  </section>`;
  drawInstall();
}

app.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-t]");
  if (t) {
    setTheme(t.dataset.t);
    applyTheme();
    return draw();
  }
  const id = e.target.closest("button")?.id;
  if (id === "inst" && promptEv) {
    const ev = promptEv;
    promptEv = null; // event cuma bisa dipakai sekali
    ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome !== "accepted") toast("Pemasangan dibatalkan");
    drawInstall();
  }
  if (id === "ex") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([exportJson()], { type: "application/json" }),
    );
    a.download = "tenggat-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  if (id === "demo") {
    seedDemo();
    toast("Data contoh ditambahkan");
  }
  if (id === "cd") {
    const { done } = countTasks();
    if (!done) return toast("Belum ada tenggat yang selesai");
    if (
      await confirmDialog({
        title: "Hapus yang sudah selesai?",
        text: `${done} tenggat yang sudah selesai akan dihapus permanen.`,
      })
    ) {
      clearDone();
      toast(`${done} tenggat dihapus`);
    }
  }
  if (id === "cl") {
    const { all } = countTasks();
    if (!all) return toast("Belum ada tenggat");
    if (
      await confirmDialog({
        title: "Hapus semua tenggat?",
        text: `${all} tenggat akan dihapus permanen dan tidak bisa dikembalikan. Pengaturan tema tetap.`,
        ok: "Ya, hapus semua",
      })
    ) {
      clearAll();
      toast("Semua tenggat dihapus");
    }
  }
  if (id === "rs") {
    const ok = await confirmDialog({
      title: "Hapus semua data aplikasi?",
      text: "Yang akan dihapus permanen dari browser ini, dan tidak bisa dibatalkan:",
      items: [
        "Semua tenggat, selesai maupun belum",
        "Pengaturan tema",
        "Data sementara dan cache offline",
      ],
      ok: "Ya, hapus semuanya",
    });
    if (!ok) return;
    await wipeAll();
    applyTheme();
    app.innerHTML = `<div class="py-16 text-center"><p class="text-lg font-medium">Semua data sudah dihapus.</p><p class="mt-1 text-sm text-mute">Aplikasi kembali seperti baru dipasang.</p><a href="index.html" class="btn mt-6">Ke Beranda</a></div>`;
  }
});
app.addEventListener("change", async (e) => {
  if (e.target.id !== "im" || !e.target.files[0]) return;
  try {
    importJson(await e.target.files[0].text());
    toast("Data berhasil diimpor");
    applyTheme();
    draw();
  } catch {
    toast("File tidak valid");
  }
});
draw();
