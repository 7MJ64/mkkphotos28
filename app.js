"use strict";
const $ = (s) => document.querySelector(s);
const EMAIL = "mkkphotos28@gmail.com";
let photos = [], shown = [], cat = "All", idx = 0, opener = null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const vt = (fn) => (document.startViewTransition && !matchMedia("(prefers-reduced-motion:reduce)").matches ? document.startViewTransition(fn) : fn());

async function load() {
  try {
    const r = await fetch("photos.json", { cache: "no-cache" });
    if (!r.ok) throw 0;
    photos = await r.json();
  } catch {
    // No photos.json yet (run scripts/fetch_photos.py): show empty frames so the layout still works.
    const mk = (c, n) => Array.from({ length: n }, (_, i) => ({ cat: c, cap: c + " " + (i + 1), w: 3, h: i % 2 ? 4 : 2 }));
    photos = [...mk("Sports", 6), ...mk("Street", 6), ...mk("Portraits", 6)];
  }
  buildFilters(); buildStrip(); render();
}

function buildFilters() {
  const cats = ["All", ...new Set(photos.map((p) => p.cat))];
  const f = $("#filters");
  cats.forEach((c) => {
    const n = c === "All" ? photos.length : photos.filter((p) => p.cat === c).length;
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-pressed", c === cat);
    b.innerHTML = esc(c) + "<b>" + n + "</b>";
    b.onclick = () => {
      cat = c;
      f.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      vt(render);
    };
    f.append(b);
  });
}

function buildStrip() {
  const pick = photos.filter((p) => p.thumb).sort(() => 0.5 - Math.random()).slice(0, 10);
  if (!pick.length) return;
  $("#strip").innerHTML = [...pick, ...pick].map((p) => `<div style="background-image:url('${esc(p.thumb)}')"></div>`).join("");
}

function render() {
  shown = photos.filter((p) => cat === "All" || p.cat === cat);
  const g = $("#grid"); g.innerHTML = "";
  shown.forEach((p, i) => {
    const b = document.createElement("button");
    b.className = "tile"; b.type = "button"; b.setAttribute("aria-label", p.cap + ", " + p.cat);
    const ratio = p.w && p.h ? `aspect-ratio:${p.w}/${p.h}` : "";
    b.innerHTML = (p.thumb
      ? `<img src="${esc(p.thumb)}" alt="${esc(p.cap)}" width="${p.w}" height="${p.h}" loading="${i < 6 ? "eager" : "lazy"}" decoding="async" style="${ratio}">`
      : `<div class="ph" style="${ratio}"></div>`) + `<span class="cap">${esc(p.cap)} · ${esc(p.cat)}</span>`;
    b.onclick = () => openLb(i, b);
    g.append(b);
  });
}

const lb = $("#lb"), stage = $("#stage");
function paint() {
  const p = shown[idx];
  stage.innerHTML = p.full ? `<img src="${esc(p.full)}" alt="${esc(p.cap)}">` : `<div class="ph"></div>`;
  $("#lbcap").textContent = `${p.cap} · ${p.cat} (${idx + 1}/${shown.length})`;
}
function openLb(i, el) {
  idx = i; opener = el;
  const img = el.querySelector("img");
  if (img) img.style.viewTransitionName = "hero-photo";
  vt(() => { if (img) img.style.viewTransitionName = ""; paint(); lb.showModal(); const s = stage.querySelector("img"); if (s) s.style.viewTransitionName = "hero-photo"; });
}
function closeLb() {
  const s = stage.querySelector("img"), img = opener && opener.querySelector("img");
  if (s) s.style.viewTransitionName = "hero-photo";
  vt(() => { if (s) s.style.viewTransitionName = ""; if (img) img.style.viewTransitionName = "hero-photo"; lb.close(); });
  if (img) setTimeout(() => (img.style.viewTransitionName = ""), 600);
}
const step = (d) => { idx = (idx + d + shown.length) % shown.length; paint(); };
$("#prev").onclick = () => step(-1);
$("#next").onclick = () => step(1);
$("#close").onclick = closeLb;
lb.addEventListener("click", (e) => { if (e.target === lb || e.target === stage) closeLb(); });
lb.addEventListener("cancel", (e) => { e.preventDefault(); closeLb(); });
lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });
let tx = 0;
lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
lb.addEventListener("touchend", (e) => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) step(d > 0 ? -1 : 1); });

function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2200); }
$("#copy").onclick = async () => { try { await navigator.clipboard.writeText(EMAIL); toast("Email copied"); } catch { toast(EMAIL); } };
$("#book").onsubmit = (e) => {
  e.preventDefault();
  const v = (id) => $("#" + id).value;
  const body = `Hi Mayank,\n\nShoot type: ${v("f-type")}\nDate: ${v("f-date") || "Not decided"}\nPlace: ${v("f-place") || "Not decided"}\n\n${v("f-msg")}\n\nThanks,\n${v("f-name")}`;
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Photo shoot request from " + v("f-name"))}&body=${encodeURIComponent(body)}`;
};

const root = document.documentElement;
try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch {}
$("#theme").onclick = () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
};
load();
