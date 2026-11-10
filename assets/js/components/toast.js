let timer;

export function toast(msg, act) {
  const e = document.getElementById("toast");
  if (!e) return;
  clearTimeout(timer);
  e.innerHTML = `<div role="status" class="anim-toast fixed left-1/2 z-50 flex w-max max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-xl bg-ink py-3 pl-4 pr-3 text-sm text-paper shadow-lg bottom-[calc(5.5rem_+_env(safe-area-inset-bottom))] md:bottom-8">${msg}${act ? `<button data-u class="rounded-lg px-2 py-1 font-semibold underline">${act.label}</button>` : ""}</div>`;
  if (act)
    e.querySelector("[data-u]").onclick = () => {
      act.fn();
      e.innerHTML = "";
    };
  timer = setTimeout(
    () => {
      e.innerHTML = "";
    },
    act ? 5000 : 2500,
  );
}
