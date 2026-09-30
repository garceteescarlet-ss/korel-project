"use strict";
/* KOREL -- home page: drink data, the age-gate + pour intro, the menu, the recipe dialog,
   the Volume I preview viewer, and the printable-edition price toggle. Loaded after main.js. */

const DRINKS = [
  { n: "01", name: "Euphoria", gtype: "coupe", tags: ["Floral", "Tropical", "Bright", "Botanical"], line: "A familiar escape in an unfamiliar way." },
  { n: "02", name: "Daydream", gtype: "rocks", tags: ["Fresh", "Citrus", "Bright", "Garden"], line: "Fresh, bright, and effortlessly smooth." },
  { n: "03", name: "Sweet Nothing", gtype: "nick", tags: ["Luxe", "Earthy", "Elegant", "Citrus"], line: "A quiet luxury in every sip." },
  { n: "04", name: "Unspoken", gtype: "rocks", tags: ["Smoky", "Herbal", "Bright"], line: "A quiet conversation with a smoky edge." },
  { n: "05", name: "Bad Intentions", gtype: "rocks", tags: ["Smoky", "Tropical", "Spiced", "Bright"], line: "Heat meets tropical allure." },
  { n: "06", name: "Red Flag", gtype: "coupe", tags: ["Smoky", "Bitter", "Bold", "Heat"], line: "Bittersweet heat in every sip." },
  { n: "07", name: "Pillow Talk", gtype: "coupe", tags: ["Smoky", "Coffee", "Toasted", "Indulgent"], line: "A late-night indulgence with a smoky whisper." },
  { n: "08", name: "Soft Launch", free: true, gtype: "coupe", tags: ["Bright", "Fruity", "Citrus", "Silky"], line: "A little hint, a lot to say.",
    glass: "Chilled coupe or martini glass", garnish: "1 apricot candy",
    ing: [[1.5, "1 1/2 oz", "Haku Vodka"], [.75, "3/4 oz", "Combier"], [.5, "1/2 oz", "Giffard Apricot"], [.5, "1/2 oz", "Yuzu Juice"], [.4, "1 bar spoon", "Apricot Jam"]],
    steps: ["Chill a coupe or martini glass.", "Add all ingredients to a cocktail shaker with ice.", "Shake vigorously until thoroughly chilled and the apricot jam is fully incorporated.", "Double strain into the chilled glass."] }
];
const BY_NAME = Object.fromEntries(DRINKS.map((d, i) => [d.name, i]));
const SHADES = ["#f0dfb0", "#dcc593", "#c9a45c", "#b8975a", "#8f6d2f"];

/* ---------- age gate: the loader, then the curtain, then the pour ---------- */
const gate = $("#gate");
let ageOK = false;
try { ageOK = localStorage.getItem("korelAge") === "1"; } catch (e) {}
if (ageOK) { gate.hidden = true; document.body.classList.remove("locked"); }
else { $("#age-yes").focus(); }
$("#age-yes").addEventListener("click", () => {
  try { localStorage.setItem("korelAge", "1"); } catch (e) {}
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  gate.classList.add("loading");
  const glFill = $("#glFill"), glPct = $("#glPct"), loadStart = performance.now(), LOAD_DUR = 750;
  if (reduce) { glFill.style.width = "100%"; glPct.textContent = "100%"; }
  else {
    (function tickLoad(now) {
      const raw = Math.min(1, (now - loadStart) / LOAD_DUR);
      const pct = Math.round((1 - Math.pow(1 - raw, 2)) * 100);
      glFill.style.width = pct + "%"; glPct.textContent = pct + "%";
      if (raw < 1) requestAnimationFrame(tickLoad);
    })(loadStart);
  }
  setTimeout(() => { gate.classList.add("leave"); }, 800);          // the loader gives way
  setTimeout(() => { gate.classList.add("opening"); heroFX.start(); }, 1150);   // the doors pull apart, the pour begins
  setTimeout(() => { gate.hidden = true; document.body.classList.remove("locked"); window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, 2050);
});
$("#age-no").addEventListener("click", () => { $("#gate-msg").hidden = false; });


/* ---------- the pour: bottle -> the word KOREL forms across the space -> drains into a glass ---------- */

function initPour() {
  const hero = $(".hero"), fx = $("#fx"), cv = $("#pcanvas"), ghost = $(".ghost", fx);
  if (reduce || !cv.getContext) { fx.classList.add("static"); cv.hidden = true; return { start() {}, replay() {} }; }
  fx.hidden = true;                                    // the canvas draws the whole scene; the small static ghost is reduced-motion only
  hero.classList.add("pouring");
  const ctx = cv.getContext("2d");
  const img = new Image();
  const COLORS = ["#f6e6c2", "#dcc593", "#c9a45c"];
  const TPOUR = 3.6, D1 = .6, HOLD = .9, D3 = 1.5, FULL = 7.0;   // seconds
  const T2 = TPOUR + HOLD;                              // when the word starts draining into the glass
  let W = 0, H = 0, dpr = 1, buckets = [[], [], []], geo = null, raf = 0, started = false, visible = true, ready = false;
  let t0 = 0, revealed = false;
  const ptr = { x: -9999, y: -9999, on: false };

  function build() {
    const hr = hero.getBoundingClientRect();
    W = hr.width; H = Math.max(520, hr.height);   // the full hero, so the scene gets real room to breathe
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    const cx = W / 2;

    // the word, sampled from the logo image, drawn big across the middle of the space
    const lw = Math.min(980, W * .92), lh = lw * img.naturalHeight / img.naturalWidth;
    const wcx = cx, wcy = Math.max(H * .30, lh / 2 + 46);   // keep clear of the nav bar at the top of the hero
    const off = document.createElement("canvas");
    off.width = Math.round(lw); off.height = Math.round(lh);
    const o = off.getContext("2d");
    o.drawImage(img, 0, 0, off.width, off.height);
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const ox = wcx - lw / 2, oy = wcy - lh / 2, step = 2;
    let pts = [];
    for (let y = 0; y < off.height; y += step)
      for (let x = 0; x < off.width; x += step)
        if (data[(y * off.width + x) * 4 + 3] > 90) pts.push([x + ox + (Math.random() - .5) * step, y + oy + (Math.random() - .5) * step]);
    const MAX = W < 380 ? 4500 : W < 500 ? 6500 : 13000;
    pts.sort(() => Math.random() - .5);
    if (pts.length > MAX) pts.length = MAX;
    const N = pts.length;
    let minX = Infinity, maxX = -Infinity;
    pts.forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); });

    // the glass, lower in the space, directly below the word
    const b = H * .085, a = b * 1.15, stemH = H * .1, baseW = a * 1.05, rimY = H * .64;
    geo = {
      S: { x: cx + Math.min(190, W * .16), y: H * .04 }, angle: -.55,   // bottle spout
      C: { x: cx - (cx - (cx + Math.min(150, W * .13))) * .1, y: H * .07 + (wcy - H * .07) * .35 },
      glass: { cx, a, b, rimY, botY: rimY + b, stemY: rimY + b + stemH, baseW }
    };

    // where the liquid rests inside the bowl, deepest first, one spot per particle
    const fills = [];
    while (fills.length < N) {
      const x = (Math.random() * 2 - 1) * a, d = b * (.16 + Math.random() * .84);
      if ((x / a) * (x / a) + (d / b) * (d / b) <= 1) fills.push({ x: cx + x, y: rimY + d, d });
    }
    fills.sort((p, q) => q.d - p.d);

    buckets = [[], [], []];
    for (let i = 0; i < N; i++) {
      const c = Math.random() < .3 ? 0 : (Math.random() < .65 ? 1 : 2);
      buckets[c].push({
        tx: pts[i][0], ty: pts[i][1], fx: fills[i].x, fy: fills[i].y,
        ts: (pts[i][0] - minX) / (maxX - minX) * (TPOUR - D1), j: (Math.random() * 2 - 1) * 3.2,
        drainStart: T2 + Math.random() * .3, drainDur: D3 * (.85 + Math.random() * .3),
        ph: Math.random() * 6.283, s: 1 + Math.random() * 1.1,
        mode: 0, x: 0, y: 0, vx: 0, vy: 0
      });
    }
  }

  function drawBottle(alpha) {
    if (alpha <= 0) return;
    const g = geo;
    ctx.save();
    ctx.translate(g.S.x, g.S.y); ctx.rotate(g.angle);
    ctx.strokeStyle = `rgba(220,197,147,${.6 * alpha})`; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, -14); ctx.lineTo(-13, -24); ctx.lineTo(-13, -68); ctx.lineTo(13, -68); ctx.lineTo(13, -24); ctx.lineTo(4, -14); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(-4, -1); ctx.moveTo(4, -14); ctx.lineTo(4, -1); ctx.stroke();
    ctx.strokeStyle = `rgba(220,197,147,${.32 * alpha})`;
    ctx.beginPath(); ctx.ellipse(0, -68, 13, 3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawGlass(alpha) {
    if (alpha <= 0) return;
    const g = geo.glass;
    ctx.strokeStyle = `rgba(220,197,147,${.55 * alpha})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(g.cx, g.rimY, g.a, g.b, 0, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(g.cx, g.rimY, g.a, g.b * .09, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(g.cx, g.botY); ctx.lineTo(g.cx, g.stemY); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(g.cx, g.stemY, g.baseW / 2, g.baseW * .07, 0, 0, Math.PI * 2); ctx.stroke();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    drawBottle(Math.max(0, 1 - Math.max(0, t - TPOUR) / .5));
    const glassAlpha = Math.min(1, Math.max(0, (t - (T2 - .4)) / .5));
    const ambient = t < FULL ? 1 : Math.max(.22, 1 - (t - FULL) / 1);
    drawGlass(glassAlpha);

    const S = geo.S, C = geo.C, R = 105, R2 = R * R;
    const live = t > FULL;
    ctx.globalCompositeOperation = "lighter";
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = COLORS[c];
      const arr = buckets[c];
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        let px, py, alpha = .9;
        if (p.mode === 0) {
          if (t < p.ts) continue;
          if (t < p.ts + D1) {                                    // pour: bottle to its place in the word
            const u = (t - p.ts) / D1, iu = 1 - u;
            px = iu * iu * S.x + 2 * iu * u * C.x + u * u * p.tx + p.j * (.4 + .6 * u);
            py = iu * iu * S.y + 2 * iu * u * C.y + u * u * p.ty;
          } else if (t < p.drainStart) {                          // resting, part of the word
            px = p.tx + Math.sin(t * 2 + p.ph) * .5; py = p.ty + Math.cos(t * 1.7 + p.ph) * .35;
          } else if (t < p.drainStart + p.drainDur) {              // drain: the word falls into the glass
            const v = (t - p.drainStart) / p.drainDur;
            px = p.tx + (p.fx - p.tx) * v + p.j * (1 - v) * .6;
            py = p.ty + (p.fy - p.ty) * v * v;
          } else { p.mode = 4; p.x = p.fx; p.y = p.fy; p.vx = 0; p.vy = 0; px = p.x; py = p.y; }
          alpha = c === 0 ? .95 : .85;
        }
        if (p.mode === 4) {                                       // settled liquid, gently interactive
          p.vx += (p.fx + Math.sin(t * 2 + p.ph) * .4 - p.x) * .045;
          p.vy += (p.fy + Math.cos(t * 1.7 + p.ph) * .4 - p.y) * .045;
          if (live && ptr.on) {
            const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
            if (d2 < R2) { const d = Math.sqrt(d2) || 1, f = 1 - d / R, k = f * f * 6; p.vx += dx / d * k; p.vy += dy / d * k; }
          }
          p.vx *= .86; p.vy *= .86; p.x += p.vx; p.y += p.vy;
          px = p.x; py = p.y; alpha = (c === 0 ? .95 : .85) * ambient;
        }
        ctx.globalAlpha = alpha; ctx.fillRect(px, py, p.s, p.s);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    if (!revealed && t > FULL) { revealed = true; hero.classList.remove("pouring"); }
    if (live && ptr.on) {
      ctx.strokeStyle = "rgba(220,197,147,.4)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 24, 0, 6.283); ctx.stroke();
      ctx.fillStyle = "rgba(240,223,176,.9)"; ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 2, 0, 6.283); ctx.fill();
    }
  }

  const run = () => { if (!raf && ready && started && visible) raf = requestAnimationFrame(frame); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  function reset() { stop(); build(); t0 = performance.now(); revealed = false; hero.classList.add("pouring"); run(); }

  hero.addEventListener("pointermove", e => {
    const r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
    ptr.on = ptr.y >= 0 && ptr.y <= H;
  });
  hero.addEventListener("pointerleave", () => { ptr.on = false; });
  hero.addEventListener("pointerdown", e => {
    if (e.target.closest("a,button")) return;
    const t = (performance.now() - t0) / 1000;
    if (t < FULL) { t0 = performance.now() - (FULL + .05) * 1000; return; }   // click to skip straight to the poured drink
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, RB = 230;
    buckets.forEach(arr => arr.forEach(p => {
      if (p.mode !== 4) return;
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
      if (d < RB) { const k = (1 - d / RB) * 22; p.vx += dx / d * k; p.vy += dy / d * k; }
    }));
  });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? run() : stop(); }, { threshold: .05 }).observe(hero);
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (ready && started) reset(); }, 220); });
  img.onload = () => { ready = true; if (started) reset(); };
  img.src = "assets/logo.png";
  return { start() { started = true; if (ready) reset(); }, replay() { if (ready && started) reset(); } };
}

const heroFX = initPour();
$("#replay").addEventListener("click", () => heroFX.replay());
if (ageOK) heroFX.start();

const bar = d => `<div class="bar" role="img" aria-label="Ingredient proportions">${d.ing.map((x, i) =>
  `<i data-i="${i}" style="flex:${x[0]};background:${SHADES[i % SHADES.length]}" title="${esc(x[2])}"></i>`).join("")}</div>
  <ul class="legend">${d.ing.map((x, i) =>
  `<li data-i="${i}"><b style="background:${SHADES[i % SHADES.length]}"></b><span>${x[1]}</span>${esc(x[2])}</li>`).join("")}</ul>`;

const lockedPanel = (size) => `
  <div class="locked-panel ${size || ""}">
    <span class="lock-ic" aria-hidden="true">&#128274;</span>
    <p class="locked-line">Available in <strong>KOREL Vol. I</strong></p>
    <a class="btn small solid" href="https://payhip.com/b/WbtS7">Buy Volume I</a>
  </div>`;

const tabsEl = $("#menuTabs"), detailEl = $("#menuDetail");
let menuActive = 0;
tabsEl.innerHTML = DRINKS.map((d, i) => `
  <button class="m-tab${i === 0 ? " active" : ""}${d.free ? " is-free" : ""}" data-i="${i}" aria-label="${esc(d.name)}${d.free ? ", free recipe" : ", part of Volume I"}">${d.n}</button>`).join("");

function bindBars(root) {
  root.addEventListener("mouseover", e => {
    const li = e.target.closest(".legend li, .bar i");
    const b = $(".bar", root);
    if (!li || !b) return;
    b.classList.add("dim");
    $$("i", b).forEach(s => s.classList.toggle("on", s.dataset.i === li.dataset.i));
  });
  root.addEventListener("mouseout", e => {
    const b = $(".bar", root);
    if (b && !e.relatedTarget?.closest?.(".legend li, .bar i")) { b.classList.remove("dim"); $$("i", b).forEach(s => s.classList.remove("on")); }
  });
}
function renderDetail(i) {
  const d = DRINKS[i];
  const head = `<h3 class="md-name">${esc(d.name)}</h3><p class="md-tags">${d.tags.join(" · ")}</p><p class="md-line">${esc(d.line)}</p>`;
  detailEl.innerHTML = d.free
    ? `${head}${bar(d)}
       <div class="meta"><div>Glass<b>${esc(d.glass)}</b></div><div>Garnish<b>${esc(d.garnish)}</b></div></div>
       <p class="serves">Makes one drink &middot; Free recipe</p>
       <div style="text-align:center"><button class="btn small open-recipe" data-i="${i}">Open the recipe</button></div>`
    : `${head}${lockedPanel()}`;
  bindBars(detailEl);
}
renderDetail(0);

tabsEl.addEventListener("click", e => {
  const b = e.target.closest(".m-tab"); if (!b) return;
  const i = +b.dataset.i;
  if (i === menuActive) return;
  menuActive = i;
  $$(".m-tab", tabsEl).forEach(x => x.classList.toggle("active", +x.dataset.i === i));
  renderDetail(i);
  menuPour.play(DRINKS[i].gtype);
});
detailEl.addEventListener("click", e => { const b = e.target.closest(".open-recipe"); if (b) openRecipe(+b.dataset.i); });

/* ---------- the pour stage: a small glass fills each time a number is selected ---------- */
function initMenuPour() {
  const stage = $("#pourStage"), cv = $("#menuCanvas");
  if (!cv || !cv.getContext) return { play() {} };
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, glass = null, raf = 0, animStart = 0, splashed = false, splashes = [], stream = [], lastT = 0, currentType = "coupe";
  const DUR = .7, STREAM_DUR = .42;

  function computeGeo(type, W, H) {
    const cx = W / 2;
    if (type === "rocks") {
      const topY = H * .2, botY = H * .64, halfTop = H * .26, halfBot = H * .24, rimB = H * .045;
      return { type, cx, topY, botY, halfTop, halfBot, rimB, baseW: halfBot * 1.8, shadowY: botY + 6, pourX: cx, pourY: topY, pourHalfW: halfTop };
    }
    if (type === "nick") {
      const b = H * .27, a = b * .78, stemH = H * .25, rimY = H * .13;
      return { type, cx, a, b, rimY, botY: rimY + b, stemY: rimY + b + stemH, baseW: a * .95, shadowY: rimY + b + stemH + 5, pourX: cx, pourY: rimY, pourHalfW: a };
    }
    const b = H * .28, a = b * 1.15, stemH = H * .24, rimY = H * .14;
    return { type: "coupe", cx, a, b, rimY, botY: rimY + b, stemY: rimY + b + stemH, baseW: a * 1.05, shadowY: rimY + b + stemH + 5, pourX: cx, pourY: rimY, pourHalfW: a };
  }

  function size() {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    glass = computeGeo(currentType, W, H);
    draw(1, 0, 1);
  }

  function drawShadow(g) {
    ctx.save(); ctx.globalAlpha = .32; ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.ellipse(g.cx, g.shadowY, g.baseW * .95, g.baseW * .22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawGlassBowl(g) {
    ctx.strokeStyle = "rgba(220,197,147,.55)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(g.cx, g.rimY, g.a, g.b, 0, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(g.cx, g.rimY, g.a, g.b * .09, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(g.cx, g.botY); ctx.lineTo(g.cx, g.stemY); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(g.cx, g.stemY, g.baseW / 2, g.baseW * .07, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,250,235,.32)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(g.cx, g.rimY, g.a * .84, g.b * .84, 0, Math.PI * 1.08, Math.PI * 1.38); ctx.stroke();
  }
  function drawGlassRocks(g) {
    const { cx, topY, botY, halfTop, halfBot, rimB } = g;
    ctx.strokeStyle = "rgba(220,197,147,.55)"; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - halfTop, topY); ctx.lineTo(cx - halfBot, botY);
    ctx.moveTo(cx + halfTop, topY); ctx.lineTo(cx + halfBot, botY);
    ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, botY, halfBot, rimB, 0, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, topY, halfTop, rimB, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,250,235,.28)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - halfTop * .68, topY + 6); ctx.lineTo(cx - halfBot * .68, botY - 10); ctx.stroke();
  }
  function drawGlass(g) { g.type === "rocks" ? drawGlassRocks(g) : drawGlassBowl(g); }

  function drawLiquidBowl(g, p) {
    if (p <= 0) return;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(g.cx, g.rimY, g.a, g.b, 0, 0, Math.PI * 2); ctx.clip();
    const topY = g.rimY + g.b - g.b * p;
    const grad = ctx.createLinearGradient(0, topY, 0, g.rimY + g.b);
    grad.addColorStop(0, "rgba(246,230,194,.92)"); grad.addColorStop(1, "rgba(201,164,92,.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(g.cx - g.a - 4, topY, g.a * 2 + 8, (g.rimY + g.b - topY) + 4);
    ctx.restore();
  }
  function drawLiquidRocks(g, p) {
    if (p <= 0) return;
    const { cx, topY, botY, halfTop, halfBot, rimB } = g;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - halfTop, topY); ctx.lineTo(cx - halfBot, botY);
    ctx.ellipse(cx, botY, halfBot, rimB, 0, Math.PI, 0);
    ctx.lineTo(cx + halfTop, topY);
    ctx.ellipse(cx, topY, halfTop, rimB, 0, 0, Math.PI);
    ctx.closePath(); ctx.clip();
    const fillTopY = botY - (botY - topY) * p;
    const grad = ctx.createLinearGradient(0, fillTopY, 0, botY);
    grad.addColorStop(0, "rgba(246,230,194,.92)"); grad.addColorStop(1, "rgba(201,164,92,.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - halfTop - 4, fillTopY, (halfTop + 4) * 2, (botY - fillTopY) + 4);
    ctx.restore();
    if (p > .18) {
      const s = halfTop * .52, icx = cx + halfTop * .12, icy = (topY + botY) / 2 - 3;
      ctx.strokeStyle = "rgba(255,255,255,.32)"; ctx.lineWidth = 1;
      ctx.strokeRect(icx - s / 2, icy - s / 2, s, s);
      ctx.strokeStyle = "rgba(255,255,255,.14)";
      ctx.beginPath(); ctx.moveTo(icx - s / 2, icy - s / 2); ctx.lineTo(icx + s / 2, icy + s / 2); ctx.stroke();
    }
  }
  function drawLiquid(g, p) { g.type === "rocks" ? drawLiquidRocks(g, p) : drawLiquidBowl(g, p); }

  function drawStream(g, t) {
    const S = { x: g.pourX + g.pourHalfW * .55, y: -16 }, C = { x: g.pourX + g.pourHalfW * .18, y: g.pourY * .4 };
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "#f0dfb0";
    stream.forEach(sp => {
      const age = t - sp.ts; if (age < 0 || age > sp.dur) return;
      const u = age / sp.dur, iu = 1 - u;
      const x = iu * iu * S.x + 2 * iu * u * C.x + u * u * g.pourX + sp.jx * u;
      const y = iu * iu * S.y + 2 * iu * u * C.y + u * u * g.pourY;
      ctx.globalAlpha = .9; ctx.fillRect(x, y, sp.s, sp.s);
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  function drawSplashes(g, dt) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(g.cx, (g.pourY + (g.botY || g.pourY)) / 2, g.pourHalfW * 1.15, H * .4, 0, 0, Math.PI * 2); ctx.clip();
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "#f6e6c2";
    splashes.forEach(s => {
      s.vy += 220 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (s.life > 0) { ctx.globalAlpha = Math.max(0, s.life / s.maxLife); ctx.fillRect(s.x, s.y, s.sz, s.sz); }
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    splashes = splashes.filter(s => s.life > 0);
  }
  function draw(p, dt, t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const g = glass;
    drawShadow(g); drawLiquid(g, p); drawGlass(g);
    if (t < STREAM_DUR + .06) drawStream(g, t);
    if (splashes.length) drawSplashes(g, dt);
  }
  function frame(now) {
    const dt = lastT ? (now - lastT) / 1000 : 0; lastT = now;
    const t = (now - animStart) / 1000;
    const raw = Math.min(1, Math.max(0, t / DUR));
    if (!splashed && t >= STREAM_DUR) {
      splashed = true;
      for (let i = 0; i < 16; i++) {
        splashes.push({ x: glass.pourX + (Math.random() - .5) * glass.pourHalfW * .5, y: glass.pourY, vx: (Math.random() - .5) * 60, vy: -50 - Math.random() * 50, life: .28 + Math.random() * .18, maxLife: .42, sz: 1 + Math.random() * 1.1 });
      }
    }
    draw(1 - Math.pow(1 - raw, 3), dt, t);
    if (raw < 1 || splashes.length) raf = requestAnimationFrame(frame); else raf = 0;
  }
  function play(type) {
    if (type) currentType = type;
    size();
    if (reduce) { draw(1, 0, 999); return; }
    animStart = performance.now(); lastT = 0; splashed = false; splashes = [];
    stream = Array.from({ length: 30 }, (_, i) => ({ ts: i / 30 * (STREAM_DUR - .2), dur: .2 + Math.random() * .08, jx: (Math.random() - .5) * 6, s: 1 + Math.random() * 1.1 }));
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  window.addEventListener("resize", size);
  size();
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { play(); io.unobserve(stage); } }, { threshold: .3 });
  io.observe(stage);
  return { play };
}
const menuPour = initMenuPour();

/* ---------- recipe dialog ---------- */

const dlg = $("#recipe");
function openRecipe(i) {
  const d = DRINKS[i];
  if (!d.free) {
    $("#recipe-body").innerHTML = `
      <button class="x" aria-label="Close recipe">&times;</button>
      <div class="p-num">${d.n}</div>
      <h3 id="r-name">${esc(d.name)}</h3>
      <p class="tagline">${esc(d.line)}</p>
      <p class="tags">${d.tags.join(" · ")}</p>
      ${lockedPanel("big")}`;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    return;
  }
  $("#recipe-body").innerHTML = `
    <button class="x" aria-label="Close recipe">&times;</button>
    <div class="p-num">${d.n}</div>
    <h3 id="r-name">${esc(d.name)}</h3>
    <p class="tagline">${esc(d.line)}</p>
    <p class="tags">${d.tags.join(" · ")}</p>
    <h4>Ingredients</h4>
    <ul>${d.ing.map(x => `<li><span>${x[1]}</span>${esc(x[2])}</li>`).join("")}</ul>
    <h4>Method</h4>
    <ol>${d.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    <div class="two"><div><h4>Garnish</h4>${esc(d.garnish)}</div><div><h4>Glassware</h4>${esc(d.glass)}</div></div>
    <div class="foot-note"><span>Makes one drink &middot; Free recipe</span><a class="btn small" href="#collection" id="dlg-shop">Get every recipe</a></div>`;
  if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
}
dlg.addEventListener("click", e => {
  if (e.target === dlg || e.target.closest(".x")) dlg.close();
  if (e.target.closest("#dlg-shop") || e.target.closest(".locked-panel a")) dlg.close();
});

/* ---------- Volume I PDF preview: an in-page flip-through of the preview pages (as images),
   since a top-level or iframe-embedded link to a data: URI this size gets treated as a forced
   download by the browser instead of actually being shown ---------- */

const PREVIEW_PAGES = ["assets/preview/page1.jpg", "assets/preview/page2.jpg", "assets/preview/page3.jpg", "assets/preview/page4.jpg", "assets/preview/page5.jpg", "assets/preview/page6.jpg"];
const previewDlg = $("#previewDlg"), previewBtn = $("#previewBtn");
const pvImg = $("#previewImg"), pvPrev = $("#pvPrev"), pvNext = $("#pvNext"), pvCount = $("#pvCount");
let pvIndex = 0;
function pvRender() {
  pvImg.src = PREVIEW_PAGES[pvIndex];
  pvCount.textContent = `Page ${pvIndex + 1} of ${PREVIEW_PAGES.length}`;
  pvPrev.disabled = pvIndex === 0;
  pvNext.disabled = pvIndex === PREVIEW_PAGES.length - 1;
}
previewBtn.addEventListener("click", e => {
  e.preventDefault();
  pvIndex = 0;
  pvRender();
  if (typeof previewDlg.showModal === "function") previewDlg.showModal(); else previewDlg.setAttribute("open", "");
});
pvPrev.addEventListener("click", () => { if (pvIndex > 0) { pvIndex--; pvRender(); } });
pvNext.addEventListener("click", () => { if (pvIndex < PREVIEW_PAGES.length - 1) { pvIndex++; pvRender(); } });
previewDlg.addEventListener("click", e => {
  if (e.target === previewDlg || e.target.closest("#previewClose")) previewDlg.close();
});
previewDlg.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") pvPrev.click();
  if (e.key === "ArrowRight") pvNext.click();
});

/* ---------- Printable Edition add-on: just updates the displayed price here -- actually
   offering it as a real add-on at checkout needs a second variant/price option set up on
   whichever platform (Payhip, etc.) ends up handling the real purchase ---------- */
const printAddon = $("#printAddon"), volPrice = $("#volPrice");
printAddon.addEventListener("change", () => {
  volPrice.textContent = printAddon.checked ? "$24" : "$19";
});

/* ---------- magnetic hover: the hero buttons drift gently toward the cursor ---------- */
function magnetize(el, strength = 12) {
  if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
  el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    const mx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const my = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
  });
  el.addEventListener("pointerleave", () => { el.style.transform = ""; });
}
$$(".hero .cta .btn").forEach(b => magnetize(b, 10));

/* ---------- soft light that follows the cursor in the hero ---------- */
const hero = $(".hero");
if (window.matchMedia("(pointer: fine)").matches && !reduce) {
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
    hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
  });
}

/* ---------- 3D tilt calls: this page's own panels and covers ---------- */
tiltify($("#storyPanel"), { max: 5, glow: true });
$$(".book").forEach(b => tiltify(b, { max: 9, lift: -14 }));
tiltify($("#pourStage"), { max: 7 });
