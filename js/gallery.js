"use strict";
/* KOREL -- gallery page: the 3D drink wheel. Loaded after main.js, which already provides
   $, $$, esc, reveal-on-scroll, the gold veins, the header, and the full-screen menu. */

const WHEEL_ITEMS = [
  { name: "Euphoria", line: "A familiar escape in an unfamiliar way.", tone: "#2a2213", glass: "coupe", img: "assets/gallery/euphoria.jpg" },
  { name: "Daydream", line: "Fresh, bright, and effortlessly smooth.", tone: "#1e2114", glass: "rocks", img: "assets/gallery/daydream.jpg" },
  { name: "Sweet Nothing", line: "A quiet luxury in every sip.", tone: "#262012", glass: "nick", img: "assets/gallery/sweet_nothing.jpg" },
  { name: "Unspoken", line: "A quiet conversation with a smoky edge.", tone: "#221a12", glass: "rocks", img: "assets/gallery/unspoken.jpg" },
  { name: "Bad Intentions", line: "Heat meets tropical allure.", tone: "#231a10", glass: "rocks", img: "assets/gallery/bad_intentions.jpg" },
  { name: "Red Flag", line: "Bittersweet heat in every sip.", tone: "#2a1712", glass: "coupe", img: "assets/gallery/red_flag.jpg" },
  { name: "Pillow Talk", line: "A late-night indulgence with a smoky whisper.", tone: "#1f1a1c", glass: "coupe", img: "assets/gallery/pillow_talk.jpg" },
  { name: "Soft Launch", line: "A little hint, a lot to say.", tone: "#2a1f10", glass: "nick", img: "assets/gallery/soft_launch.jpg" }
];

function initWheel() {
  const stage = $("#wheelStage"), wheel = $("#wheel"), prevBtn = $("#wPrev"), nextBtn = $("#wNext");
  const capName = $("#wheelCaption .wc-name"), capLine = $("#wheelCaption .wc-line");
  const N = WHEEL_ITEMS.length, angleStep = 360 / N;

  wheel.innerHTML = WHEEL_ITEMS.map((d, i) => `
    <div class="wheel-item" data-i="${i}" style="--tone:${d.tone}">
      <span class="wi-tag">${d.video ? "&#9654; Video" : "Photo"}</span>
      ${d.img ? `<img class="wi-photo" src="${d.img}" alt="${esc(d.name)} cocktail">` : GLASSES[d.glass]}
      <span class="wi-name">${esc(d.name)}</span>
    </div>`).join("");
  const items = $$(".wheel-item", wheel);

  let radius = 260;
  function layout() {
    const w = items[0] ? items[0].getBoundingClientRect().width : 220;
    radius = (w / 2) / Math.tan(Math.PI / N) * 1.2;
  }
  layout();
  window.addEventListener("resize", layout);

  let frontIndex = 0, target = null, dragging = false, dragStartX = 0, dragStartFront = 0, hover = false, raf = 0, lastT = 0;
  const AUTO = reduce ? 0 : .045;   // revolutions-ish per second, gentle

  function render() {
    const ry = -frontIndex * angleStep;
    wheel.style.transform = `rotateY(${ry}deg)`;
    items.forEach((el, i) => {
      let a = (angleStep * i + ry) % 360; if (a > 180) a -= 360; if (a < -180) a += 360;
      const ad = Math.abs(a);
      const op = Math.max(.15, 1 - ad / 150);
      const blur = Math.min(6, ad / 22);
      const sc = Math.max(.7, 1 - ad / 380);
      el.style.transform = `translate(-50%,-50%) rotateY(${angleStep * i}deg) translateZ(${radius}px) scale(${sc})`;
      el.style.opacity = String(op);
      el.style.filter = `blur(${blur}px)`;
      el.style.zIndex = String(Math.round(1000 - ad));
    });
    const nearest = ((Math.round(frontIndex) % N) + N) % N;
    capName.textContent = WHEEL_ITEMS[nearest].name;
    capLine.textContent = WHEEL_ITEMS[nearest].line;
  }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = lastT ? (t - lastT) / 1000 : 0; lastT = t;
    if (dragging) { /* frontIndex is set directly in pointermove */ }
    else if (target !== null) {
      frontIndex += (target - frontIndex) * .18;
      if (Math.abs(target - frontIndex) < .01) { frontIndex = target; target = null; }
    } else if (!hover && AUTO) { frontIndex += AUTO * dt; }
    render();
  }
  function start() { if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  new IntersectionObserver(es => { es[0].isIntersecting ? start() : stop(); }, { threshold: .1 }).observe(stage);

  function goTo(i) { target = i; }
  prevBtn.addEventListener("click", () => goTo(Math.round(frontIndex) - 1));
  nextBtn.addEventListener("click", () => goTo(Math.round(frontIndex) + 1));
  stage.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(Math.round(frontIndex) - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(Math.round(frontIndex) + 1); }
  });
  stage.addEventListener("pointerenter", () => { hover = true; });
  stage.addEventListener("pointerleave", () => { hover = false; });
  stage.addEventListener("pointerdown", e => {
    dragging = true; target = null; dragStartX = e.clientX; dragStartFront = frontIndex;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", e => {
    if (!dragging) return;
    frontIndex = dragStartFront - (e.clientX - dragStartX) / 90;
  });
  function endDrag() { if (!dragging) return; dragging = false; goTo(Math.round(frontIndex)); }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  render();
  start();
}
initWheel();
