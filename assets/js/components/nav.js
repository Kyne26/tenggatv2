import { icon } from "./icons.js";

// [kunci halaman, ikon, alamat, label]
const L = [
  ["home", "home", "index.html", "Beranda"],
  ["cal", "cal", "kalender.html", "Kalender"],
  ["add", "plus", "tambah.html", "Tambah"],
  ["set", "set", "pengaturan.html", "Pengaturan"],
];

export function mountNav(page) {
  const date = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  document.getElementById("nav").innerHTML = `
  <header class="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper px-4 md:px-5">
    <a href="index.html" class="flex flex-1 items-center gap-3 text-lg font-medium">
      <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand text-paper">${icon("logo", "h-5 w-5", 2)}</span>Tenggat
    </a>
    <span class="text-sm text-mute">${date}</span>
  </header>

  <aside class="fixed bottom-0 left-0 top-14 z-10 hidden w-64 flex-col gap-1 p-3 md:flex">
    ${L.map(
      ([
        k,
        ic,
        h,
        n,
      ]) => `<a href="${h}" class="relative flex h-12 items-center gap-4 rounded-full px-4 text-sm hover:bg-surface ${k === page ? "font-medium" : "text-mute"}">
      ${k === page ? '<span data-pill class="anim-fade absolute inset-0 rounded-full bg-surface"></span>' : ""}
      <span class="relative ${k === page ? "text-brand" : ""}">${icon(ic, "h-5 w-5")}</span><span class="relative">${n}</span></a>`,
    ).join("")}
  </aside>

  <nav class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
    ${L.map(
      ([
        k,
        ic,
        h,
        n,
      ]) => `<a href="${h}" class="flex flex-col items-center gap-1 pb-2.5 pt-2 text-xs transition duration-200 active:scale-95 ${k === page ? "font-medium text-ink" : "text-mute"}">
      <span class="relative grid h-8 w-16 place-items-center rounded-full ${k === page ? "text-brand" : ""}">
        ${k === page ? '<span data-pill class="anim-fade absolute inset-0 rounded-full bg-soft"></span>' : ""}
        <span class="relative">${icon(ic, "h-6 w-6")}</span>
      </span>${n}</a>`,
    ).join("")}
  </nav>`;
}
