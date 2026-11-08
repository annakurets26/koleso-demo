(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var tg = window.Telegram && window.Telegram.WebApp;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function r01() {
    if (window.crypto && crypto.getRandomValues) {
      var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296;
    }
    return Math.random();
  }
  function rint(n) { return Math.floor(r01() * n); }
  function pt(a, r) { var t = a * Math.PI / 180; return [r * Math.sin(t), -r * Math.cos(t)]; }
  function f(n) { return Math.round(n * 100) / 100; }

  function loadConfig() {
    if (location.protocol === 'file:' && window.KOLESO_CONFIG) return Promise.resolve(window.KOLESO_CONFIG);
    return fetch('config.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('config');
      return r.json();
    }).catch(function (e) {
      if (window.KOLESO_CONFIG) return window.KOLESO_CONFIG;
      throw e;
    });
  }

  function iconSvg(name, cls) {
    var body = (window.KOLESO_ICONS || {})[name] || '';
    return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" aria-hidden="true">' + body + '</svg>';
  }

  var cfg, n, step, angle = 0, spinning = false, uid = 0;
  var rotEl, pointerEl, lastResult = null;

  function applyColors(c) {
    var root = document.documentElement.style;
    Object.keys(c).forEach(function (k) { root.setProperty('--' + k, c[k]); });
  }

  function buildRot(svg) {
    var w = cfg.wheel, R = 88, h = '';
    var gid = 'g' + (++uid);
    h += '<defs><filter id="' + gid + '" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    cfg.sectors.forEach(function (s, i) {
      var a0 = i * step - step / 2, a1 = a0 + step;
      var p0 = pt(a0, R), p1 = pt(a1, R);
      var fill = w.sectorFill[i % w.sectorFill.length];
      h += '<path class="sec" d="M0 0L' + f(p0[0]) + ' ' + f(p0[1]) + 'A' + R + ' ' + R + ' 0 0 1 ' + f(p1[0]) + ' ' + f(p1[1]) + 'Z" fill="' + fill + '"/>';
    });
    cfg.sectors.forEach(function (s, i) {
      var a = i * step;
      var col = w.iconColors[i % w.iconColors.length];
      var body = (window.KOLESO_ICONS || {})[s.icon] || '';
      h += '<g transform="rotate(' + a + ') translate(0 -33) scale(0.88) translate(-12 -12)" class="ic" style="color:' + col + '"' +
        (w.glow ? ' filter="url(#' + gid + ')"' : '') + '>' + body + '</g>';
      h += '<text class="lbl" transform="rotate(' + a + ') translate(0 -81) rotate(-90)" text-anchor="end" dy=".35em">' + s.title + '</text>';
    });
    svg.setAttribute('viewBox', '-100 -100 200 200');
    svg.innerHTML = h;
  }

  function buildFix(svg) {
    var w = cfg.wheel, h = '';
    h += '<path class="rim" fill-rule="evenodd" d="M-99 0a99 99 0 1 0 198 0a99 99 0 1 0-198 0zM-89.5 0a89.5 89.5 0 1 0 179 0a89.5 89.5 0 1 0-179 0z"/>';
    h += '<circle class="rim-in" r="89.5" cx="0" cy="0"/>';
    for (var i = 0; i < w.bulbs; i++) {
      var p = pt(i * 360 / w.bulbs, 94.2);
      h += '<circle class="bulb" style="animation-delay:' + ((i % 2) * 0.6) + 's" cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="1.9"/>';
    }
    h += '<circle class="hub" r="12"/><circle class="hub-in" r="6"/>';
    svg.setAttribute('viewBox', '-100 -100 200 200');
    svg.innerHTML = h;
  }

  function buildWheelInto(box) {
    box.insertAdjacentHTML('afterbegin', '<svg class="w-rot" role="img" aria-label="Колесо с восемью секторами"></svg><svg class="w-fix" aria-hidden="true"></svg>');
    buildRot($('.w-rot', box)); buildFix($('.w-fix', box));
  }

  /* ---------- effects ---------- */
  var cv, ctx, parts = [], raf = 0;
  function sizeCv() {
    var d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function burst() {
    var e = cfg.effect, type = e.type;
    if (type === 'flash' || type === 'both') {
      var fl = $('#flash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    }
    if (type === 'confetti' || type === 'both') {
      var box = $('.wheel-box').getBoundingClientRect();
      var cx = box.left + box.width / 2, cy = box.top + box.height / 2;
      for (var i = 0; i < (type === 'both' ? 44 : 90); i++) {
        var a = r01() * Math.PI * 2, sp = 3 + r01() * 7;
        parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, g: 0.22, rot: r01() * 6, vr: (r01() - .5) * .4,
          s: 5 + r01() * 6, c: e.colors[rint(e.colors.length)], life: 1, d: 0.008 + r01() * 0.008 });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    }
  }
  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) { return p.life > 0; });
    parts.forEach(function (p) {
      p.vy += p.g; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.d;
      ctx.save(); ctx.globalAlpha = Math.max(p.life, 0); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      if (cfg.effect.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.3); ctx.fill(); }
      else if (cfg.effect.shape === 'star') {
        ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.lineTo(p.s * .3, -p.s * .3); ctx.lineTo(p.s, 0); ctx.lineTo(p.s * .3, p.s * .3);
        ctx.lineTo(0, p.s); ctx.lineTo(-p.s * .3, p.s * .3); ctx.lineTo(-p.s, 0); ctx.lineTo(-p.s * .3, -p.s * .3); ctx.closePath(); ctx.fill();
      } else ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6);
      ctx.restore();
    });
    if (parts.length) raf = requestAnimationFrame(frame);
    else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* ---------- spin ---------- */
  function curAngle() {
    var m = getComputedStyle(rotEl).transform;
    if (!m || m === 'none') return angle;
    var v = m.match(/matrix\(([^)]+)\)/); if (!v) return angle;
    var p = v[1].split(',').map(parseFloat);
    return Math.atan2(p[1], p[0]) * 180 / Math.PI;
  }
  function kick(big) {
    if (reduceMq.matches || !pointerEl.animate) return;
    pointerEl.animate([{ transform: 'translateX(-50%) rotate(0deg)' }, { transform: 'translateX(-50%) rotate(' + (big ? -26 : -16) + 'deg)' },
      { transform: 'translateX(-50%) rotate(' + (big ? 8 : 0) + 'deg)' }, { transform: 'translateX(-50%) rotate(0deg)' }],
      { duration: big ? 420 : 130, easing: 'ease-out' });
  }
  function haptic(kind) {
    try { if (tg && tg.HapticFeedback) kind === 'done' ? tg.HapticFeedback.notificationOccurred('success') : tg.HapticFeedback.impactOccurred('light'); } catch (e) {}
  }

  function spin() {
    if (spinning) return;
    spinning = true; closeCard();
    document.body.classList.add('is-spinning');
    $('#spinBtn').disabled = true;
    var k = rint(n), jitter = (r01() - .5) * step * .7;
    var target = (360 - (k * step + jitter)) % 360;
    var cur = ((angle % 360) + 360) % 360;
    var delta = (target - cur + 360) % 360;
    var reduce = reduceMq.matches;
    var turns = reduce ? 0 : (cfg.spin.minTurns + rint(3));
    var dur = reduce ? 450 : cfg.spin.duration;
    angle += delta + turns * 360;
    rotEl.style.transition = 'transform ' + dur + 'ms ' + (reduce ? 'ease-out' : 'cubic-bezier(.12,.6,.1,1)');
    rotEl.style.transform = 'rotate(' + angle + 'deg)';
    var lastIdx = -1, t0 = performance.now();
    (function tick() {
      if (!spinning) return;
      var a = curAngle(), v = (((-a) % 360) + 360) % 360, idx = Math.floor((v + step / 2) / step);
      if (lastIdx !== -1 && idx !== lastIdx) { kick(false); haptic('tick'); }
      lastIdx = idx;
      if (performance.now() - t0 < dur + 80) requestAnimationFrame(tick);
    })();
    setTimeout(function () { finish(k); }, dur + 60);
  }

  function finish(k) {
    spinning = false; lastResult = k;
    document.body.classList.remove('is-spinning');
    $('#spinBtn').disabled = false;
    kick(true); haptic('done');
    var s = cfg.sectors[k];
    var txt = s.texts[rint(s.texts.length)];
    $('#cardIcon').innerHTML = iconSvg(s.icon, 'ic ic-big');
    $('#cardTitle').textContent = s.title;
    $('#cardText').textContent = txt;
    var card = $('#sheet'); card.hidden = false; void card.offsetWidth; card.classList.add('open');
    if (!reduceMq.matches) burst(); else { /* без эффектов */ }
    setTimeout(function () { $('#againBtn').focus({ preventScroll: true }); }, 50);
  }

  function closeCard() {
    var card = $('#sheet'); card.classList.remove('open'); card.hidden = true;
  }

  function openLink(url) {
    try {
      if (tg && /^https:\/\/t\.me\//.test(url) && tg.openTelegramLink) { tg.openTelegramLink(url); return; }
      if (tg && tg.openLink) { tg.openLink(url); return; }
    } catch (e) {}
    window.open(url, '_blank', 'noopener');
  }

  function share() {
    var l = cfg.links;
    var s = lastResult !== null ? cfg.sectors[lastResult] : null;
    var text = (l.shareText || '') + (s ? ' Выпало: ' + s.title + '.' : '');
    openLink('https://t.me/share/url?url=' + encodeURIComponent(l.share) + '&text=' + encodeURIComponent(text));
  }

  function init() {
    n = cfg.sectors.length; step = 360 / n;
    applyColors(cfg.colors);
    document.title = cfg.title;
    $('#t-title').textContent = cfg.title;
    $('#t-sub').textContent = cfg.subtitle;
    $('#t-kicker').textContent = cfg.kicker || '';
    $('#t-title2').textContent = cfg.title;
    $('#startBtn').textContent = cfg.startLabel;
    $('#spinBtn').textContent = cfg.spinLabel;
    $('#againBtn').textContent = cfg.againLabel;
    $('#shareBtn').textContent = cfg.shareLabel;
    $('#contactBtn').textContent = cfg.contactLabel;
    $('#demoNote').textContent = cfg.demoNote;
    buildWheelInto($('#wheelMain'));
    buildWheelInto($('#wheelSplash'));
    rotEl = $('#wheelMain .w-rot'); pointerEl = $('#pointer');
    cv = $('#fx'); ctx = cv.getContext('2d'); sizeCv(); addEventListener('resize', sizeCv);

    $('#startBtn').addEventListener('click', function () {
      $('#splash').classList.add('hide'); setTimeout(function () { $('#spinBtn').focus({ preventScroll: true }); }, 400);
    });
    $('#spinBtn').addEventListener('click', spin);
    $('#againBtn').addEventListener('click', function () { closeCard(); spin(); });
    $('#shareBtn').addEventListener('click', share);
    $('#contactBtn').addEventListener('click', function () { openLink(cfg.links.contact); });
    $('#sheetBg').addEventListener('click', closeCard);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
    if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor(cfg.colors.bg); tg.setBackgroundColor(cfg.colors.bg); } catch (e) {} }
    document.body.classList.add('ready');
  }

  loadConfig().then(function (c) { cfg = c; init(); }).catch(function () {
    document.body.innerHTML = '<p style="padding:24px;font:16px sans-serif">Не удалось загрузить config.json</p>';
  });
})();
