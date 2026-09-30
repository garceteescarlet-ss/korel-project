"use strict";
/* KOREL -- shared site behavior: loaded on every page, before the page's own script.
   Provides $, $$, esc, reduce, the scroll-safety fixes, scroll-reveal, the gold veins,
   the header/back-to-top, the full-screen menu, and the tiltify() 3D-tilt utility. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = window.matchMedia("(max-width: 899px)");

/* keep a fresh load anchored at the very top. Several separate things can undo this:
   (1) the browser's own scroll-position memory on reload/back-forward navigation,
   (2) a leftover #hash from earlier browsing (e.g. after visiting Collection, then reloading to
   replay the intro), and (3) whatever the artifact preview itself does when swapping between
   pages, which isn't something this script can see or control directly. (1) and (2) are
   neutralized before anything else runs. For (3), since it isn't clear whether that correction
   happens before or after this script executes, the fix re-asserts the top position a few times
   over the first second after load rather than just once -- cheap, and it stops on its own, so
   it never fights a real scroll a person makes afterward. */
try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
if (location.hash) {
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
}
function forceTop() { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }
forceTop();
window.addEventListener("pageshow", forceTop);
[0, 50, 150, 300, 600, 1000].forEach(ms => setTimeout(forceTop, ms));

/* ---------- reveal on scroll ---------- */
if ("IntersectionObserver" in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .12 });
  $$(".reveal").forEach(el => io.observe(el));
} else { $$(".reveal").forEach(el => el.classList.add("in")); }

/* ---------- gold veins draw with scroll ---------- */
const veins = $$("#veins path");
let ticking = false;
function drawVeins() {
  const root = document.documentElement;
  const max = root.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  veins.forEach((v, k) => {
    const t = reduce ? 1 : Math.min(1, Math.max(0, .1 + p * 1.1 - k * .07));
    v.style.strokeDashoffset = String(1 - t);
  });
}
drawVeins();
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { drawVeins(); updateHeader(); ticking = false; }); } }, { passive: true });
window.addEventListener("resize", drawVeins);

/* ---------- the nav bar: transparent over the hero, solid once scrolled, with a progress line ---------- */
const navHeader = $("header.top");
const toTop = $("#toTop"), toTopRing = $("#toTopRing");
const RING_C = 2 * Math.PI * 19;
function updateHeader() {
  const y = window.scrollY;
  navHeader.classList.toggle("scrolled", y > 40);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, y / max) : 0;
  navHeader.style.setProperty("--scrollp", String(p));
  toTop.classList.toggle("show", y > 500);
  toTopRing.style.strokeDashoffset = String(RING_C * (1 - p));
}
updateHeader();
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

/* the logo scrolls to top explicitly rather than relying on the "#top" anchor jump, which can
   behave inconsistently inside some hosting/preview contexts */
const logoLink = $('a[aria-label="KOREL home"]');
if (logoLink) {
  logoLink.addEventListener("click", e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
}

/* ---------- the full-screen numbered menu ---------- */
const menuTrigger = $("#menuTrigger"), megaMenu = $("#megaMenu"), megaClose = $("#megaClose");
function openMega() {
  megaMenu.classList.add("open"); megaMenu.setAttribute("aria-hidden", "false");
  menuTrigger.classList.add("open"); menuTrigger.setAttribute("aria-expanded", "true");
  document.body.classList.add("locked");
  megaClose.focus();
}
function closeMega() {
  megaMenu.classList.remove("open"); megaMenu.setAttribute("aria-hidden", "true");
  menuTrigger.classList.remove("open"); menuTrigger.setAttribute("aria-expanded", "false");
  document.body.classList.remove("locked");
  menuTrigger.focus();
}
menuTrigger.addEventListener("click", () => { megaMenu.classList.contains("open") ? closeMega() : openMega(); });
megaClose.addEventListener("click", closeMega);
megaMenu.addEventListener("click", e => { if (e.target === megaMenu) closeMega(); });
$$(".mega-link, .mega-foot a", megaMenu).forEach(a => a.addEventListener("click", e => {
  const href = a.getAttribute("href");
  closeMega();
  if (href && href.startsWith("#")) {
    e.preventDefault();
    const target = $(href);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }), 60);
  }
}));
document.addEventListener("keydown", e => { if (e.key === "Escape" && megaMenu.classList.contains("open")) closeMega(); });

/* ---------- 3D tilt: panels and book covers gently tilt toward the cursor ---------- */
function tiltify(el, { max = 7, lift = 0, glow = false } = {}) {
  if (!el || reduce || !window.matchMedia("(pointer: fine)").matches) return;
  let raf = 0, rx = 0, ry = 0;
  const apply = () => {
    el.style.transform = `perspective(900px) translateY(${lift}px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    raf = 0;
  };
  el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    ry = (px - .5) * max * 2; rx = -(py - .5) * max * 2;
    if (glow) { el.style.setProperty("--mx", (px * 100) + "%"); el.style.setProperty("--my", (py * 100) + "%"); }
    if (!raf) raf = requestAnimationFrame(apply);
  });
  el.addEventListener("pointerenter", () => { el.style.transform = `perspective(900px) translateY(${lift}px)`; });
  el.addEventListener("pointerleave", () => { el.style.transform = "perspective(900px) translateY(0) rotateX(0) rotateY(0)"; });
}
