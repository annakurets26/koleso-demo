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
    return fetch('config.json?v=15', { cache: 'no-cache' }).then(function (r) {
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
      h += '<path class="sec" data-i="' + i + '" d="M0 0L' + f(p0[0]) + ' ' + f(p0[1]) + 'A' + R + ' ' + R + ' 0 0 1 ' + f(p1[0]) + ' ' + f(p1[1]) + 'Z" fill="' + fill + '"/>';
    });
    if (w.icons === false && w.labels === false) { /* чистое колесо */ } else cfg.sectors.forEach(function (s, i) {
      var a = i * step;
      var col = w.iconColors[i % w.iconColors.length];
      var body = (window.KOLESO_ICONS || {})[s.icon] || '';
      if (w.icons !== false) h += '<g transform="rotate(' + a + ') translate(0 -33) scale(0.88) translate(-12 -12)" class="ic" style="color:' + col + '"' +
        (w.glow ? ' filter="url(#' + gid + ')"' : '') + '>' + body + '</g>';
      if (w.labels !== false) h += '<text class="lbl" data-i="' + i + '" transform="rotate(' + a + ') translate(0 -81) rotate(-90)" text-anchor="end" dy=".35em">' + s.title + '</text>';
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
      else if (cfg.effect.shape === 'heart') {
        var s = p.s; ctx.beginPath(); ctx.moveTo(0, s * .35);
        ctx.bezierCurveTo(-s * 1.1, -s * .3, -s * .5, -s * 1.0, 0, -s * .35);
        ctx.bezierCurveTo(s * .5, -s * 1.0, s * 1.1, -s * .3, 0, s * .35); ctx.fill();
      } else if (cfg.effect.shape === 'star') {
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

  var tickEl = null;
  function tickSector(idx) {
    if (!cfg.anim || !cfg.anim.tick || reduceMq.matches) return;
    if (tickEl) tickEl.classList.remove('tick');
    tickEl = rotEl.querySelector('.sec[data-i="' + (((idx % n) + n) % n) + '"]');
    if (tickEl) tickEl.classList.add('tick');
  }

  function spin() {
    if (spinning) return;
    spinning = true; closeCard(); closePanel(); setWinner(-1);
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
      if (lastIdx !== -1 && idx !== lastIdx) { kick(false); haptic('tick'); tickSector(idx); }
      lastIdx = idx;
      if (performance.now() - t0 < dur + 80) requestAnimationFrame(tick);
    })();
    setTimeout(function () { finish(k); }, dur + 60);
  }

  function finish(k) {
    spinning = false; lastResult = k;
    if (tickEl) { tickEl.classList.remove('tick'); tickEl = null; }
    document.body.classList.remove('is-spinning');
    $('#spinBtn').disabled = false;
    kick(true); haptic('done'); bumpCounter(); setWinner(k);
    var s = cfg.sectors[k];
    var txt = s.texts[rint(s.texts.length)];
    $('#cardIcon').innerHTML = iconSvg(s.icon, 'ic ic-big');
    $('#cardTitle').textContent = s.title;
    $('#cardText').textContent = txt;
    var act = s.action || { label: cfg.againLabel, type: 'spin' };
    var ab = $('#actionBtn'); ab.textContent = act.label; ab.dataset.type = act.type; ab.dataset.url = act.url || '';
    $('#againBtn').hidden = act.type === 'spin';
    var card = $('#sheet'); card.hidden = false; void card.offsetWidth; card.classList.add('open');
    if (!reduceMq.matches) burst(); else { /* без эффектов */ }
    setTimeout(function () { $('#actionBtn').focus({ preventScroll: true }); }, 50);
  }

  function setWinner(k) {
    var box = $('#wheelMain'), nm = $('#resultName');
    box.classList.toggle('done', k >= 0);
    box.querySelectorAll('.w-rot .sec, .w-rot .lbl').forEach(function (el) {
      el.classList.toggle('win', +el.getAttribute('data-i') === k);
    });
    if (k >= 0) {
      nm.textContent = cfg.sectors[k].title;
      nm.classList.remove('show'); void nm.offsetWidth; nm.classList.add('show');
    } else { nm.textContent = ''; nm.classList.remove('show'); }
  }

  /* ---------- экран с полезным ---------- */
  var timerId = 0;
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function rCheck(body, p) {
    var prog = h('p', 'p-prog'), n = p.items.length, done = 0;
    function upd() { prog.textContent = 'Отмечено ' + done + ' из ' + n; }
    p.items.forEach(function (t) {
      var b = h('button', 'p-check'); b.type = 'button'; b.setAttribute('role', 'checkbox'); b.setAttribute('aria-checked', 'false');
      b.appendChild(h('span', 'p-box')); b.appendChild(h('span', 'p-txt', t));
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-checked') !== 'true';
        b.setAttribute('aria-checked', on); b.classList.toggle('on', on); done += on ? 1 : -1; upd();
      });
      body.appendChild(b);
    });
    upd(); body.appendChild(prog);
    if (p.outro) body.appendChild(h('p', 'p-note', p.outro));
  }

  function rInfo(body, p) {
    p.items.forEach(function (it) {
      var d = h('div', 'p-item'); d.appendChild(h('strong', '', it.title)); d.appendChild(h('span', '', it.text)); body.appendChild(d);
    });
  }

  function rTask(body, p) {
    var ol = h('ol', 'p-steps'); p.steps.forEach(function (s) { ol.appendChild(h('li', '', s)); }); body.appendChild(ol);
    var t = h('div', 'p-timer'), btn = h('button', 'btn btn-sec p-start', 'Запустить таймер'), msg = h('p', 'p-note');
    btn.type = 'button';
    function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    t.textContent = fmt(p.seconds);
    btn.addEventListener('click', function () {
      clearInterval(timerId); var left = p.seconds; msg.textContent = ''; t.textContent = fmt(left); btn.textContent = 'Начать заново';
      timerId = setInterval(function () {
        left -= 1; t.textContent = fmt(Math.max(left, 0));
        if (left <= 0) { clearInterval(timerId); msg.textContent = p.done; }
      }, 1000);
    });
    body.appendChild(t); body.appendChild(btn); body.appendChild(msg);
  }

  function rQuiz(body, p) {
    var i = 0, score = 0, box = h('div', 'p-quiz'); body.appendChild(box);
    function show() {
      box.innerHTML = '';
      if (i >= p.questions.length) {
        box.appendChild(h('p', 'p-q', 'Верных ответов: ' + score + ' из ' + p.questions.length + '.'));
        if (p.outro) box.appendChild(h('p', 'p-note', p.outro));
        return;
      }
      var q = p.questions[i];
      box.appendChild(h('p', 'p-prog', 'Вопрос ' + (i + 1) + ' из ' + p.questions.length));
      box.appendChild(h('p', 'p-q', q.q));
      var btns = [], exp = h('p', 'p-note'), next = h('button', 'btn btn-sec', i + 1 < p.questions.length ? 'Дальше' : 'Показать результат');
      next.type = 'button'; next.hidden = true;
      q.options.forEach(function (o, k) {
        var b = h('button', 'p-opt', o); b.type = 'button'; btns.push(b);
        b.addEventListener('click', function () {
          btns.forEach(function (x, j) { x.disabled = true; if (j === q.answer) x.classList.add('right'); });
          if (k === q.answer) score += 1; else b.classList.add('wrong');
          exp.textContent = q.explain; next.hidden = false;
        });
        box.appendChild(b);
      });
      box.appendChild(exp); box.appendChild(next);
      next.addEventListener('click', function () { i += 1; show(); });
    }
    show();
  }

  function startTimer(body, seconds, doneText) {
    var t = h('div', 'p-timer'), btn = h('button', 'btn btn-sec p-start', 'Запустить таймер'), msg = h('p', 'p-note');
    btn.type = 'button';
    function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    t.textContent = fmt(seconds);
    btn.addEventListener('click', function () {
      clearInterval(timerId); var left = seconds; msg.textContent = ''; t.textContent = fmt(left); btn.textContent = 'Начать заново';
      timerId = setInterval(function () {
        left -= 1; t.textContent = fmt(Math.max(left, 0));
        if (left <= 0) { clearInterval(timerId); msg.textContent = doneText || ''; }
      }, 1000);
    });
    body.appendChild(t); body.appendChild(btn); body.appendChild(msg);
  }

  function rRandom(body, p) {
    var last = -1, box = h('div', 'p-big'), btn = h('button', 'btn btn-sec p-start', p.again || 'Ещё');
    btn.type = 'button';
    function pick() {
      var i; do { i = rint(p.items.length); } while (i === last && p.items.length > 1);
      last = i; box.textContent = p.items[i]; box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
    }
    btn.addEventListener('click', pick);
    body.appendChild(box); body.appendChild(btn); pick();
    if (p.seconds) startTimer(body, p.seconds, p.done);
  }

  function rGuess(body, p) {
    var box = h('div', 'p-quiz'); body.appendChild(box);
    function round() {
      box.innerHTML = ''; var secret = 1 + rint(p.max), row = h('div', 'p-nums'), msg = h('p', 'p-big');
      for (var n = 1; n <= p.max; n++) (function (n) {
        var b = h('button', 'p-num', String(n)); b.type = 'button';
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(row.children, function (x) { x.disabled = true; if (+x.textContent === secret) x.classList.add('right'); });
          if (n !== secret) b.classList.add('wrong');
          msg.textContent = n === secret ? p.win : p.lose + ' ' + secret + '.'; msg.classList.add('pop');
          var again = h('button', 'btn btn-sec p-start', p.again || 'Ещё'); again.type = 'button'; again.addEventListener('click', round); box.appendChild(again);
        });
        row.appendChild(b);
      })(n);
      box.appendChild(row); box.appendChild(msg);
    }
    round();
  }

  function rPairGuess(body, p) {
    var max = p.max || 10, tries = p.tries || 3, box = h('div', 'p-quiz'); body.appendChild(box);
    function setup() {
      box.innerHTML = '';
      box.appendChild(h('p', 'p-q', 'Первый игрок: загадайте число от 1 до ' + max + ' и введите его. Второй игрок, не подглядывайте.'));
      var inp = document.createElement('input'); inp.type = 'password'; inp.inputMode = 'numeric'; inp.maxLength = 2; inp.className = 'p-input'; inp.setAttribute('aria-label', 'Загаданное число');
      var go = h('button', 'btn btn-sec p-start', 'Спрятать и передать телефон'), err = h('p', 'p-note'); go.type = 'button';
      go.addEventListener('click', function () {
        var v = parseInt(inp.value, 10);
        if (!(v >= 1 && v <= max)) { err.textContent = 'Введите число от 1 до ' + max + '.'; return; }
        inp.value = ''; guess(v, tries);
      });
      box.appendChild(inp); box.appendChild(go); box.appendChild(err);
    }
    function guess(secret, left) {
      box.innerHTML = '';
      box.appendChild(h('p', 'p-q', 'Второй игрок, угадывайте. Попыток: ' + left));
      var row = h('div', 'p-nums'), msg = h('p', 'p-big');
      for (var n = 1; n <= max; n++) (function (n) {
        var b = h('button', 'p-num', String(n)); b.type = 'button';
        b.addEventListener('click', function () {
          if (n === secret) { end(secret, true); return; }
          left -= 1; b.disabled = true; b.classList.add('wrong');
          if (left <= 0) { end(secret, false); return; }
          msg.textContent = (n < secret ? 'Загаданное число больше. ' : 'Загаданное число меньше. ') + 'Попыток: ' + left; msg.classList.remove('pop'); void msg.offsetWidth; msg.classList.add('pop');
        });
        row.appendChild(b);
      })(n);
      box.appendChild(row); box.appendChild(msg);
    }
    function end(secret, ok) {
      box.innerHTML = '';
      var m = h('p', 'p-big pop', ok ? 'Угадали! Число ' + secret + '.' : 'Не угадали. Было число ' + secret + '.');
      var again = h('button', 'btn btn-sec p-start', 'Сыграть ещё'); again.type = 'button'; again.addEventListener('click', setup);
      box.appendChild(m); box.appendChild(again);
    }
    setup();
  }

  function rDice(body, p) {
    var row = h('div', 'p-dice'), a = h('div', 'p-die', '?'), b = h('div', 'p-die', '?'), msg = h('p', 'p-big');
    var btn = h('button', 'btn btn-sec p-start', 'Бросить кубики'); btn.type = 'button';
    row.appendChild(a); row.appendChild(b);
    btn.addEventListener('click', function () {
      btn.disabled = true; msg.textContent = ''; var t = 0;
      var iv = setInterval(function () {
        a.textContent = 1 + rint(6); b.textContent = 1 + rint(6); a.classList.add('roll'); b.classList.add('roll'); t += 1;
        if (t > 9 || reduceMq.matches) {
          clearInterval(iv); a.classList.remove('roll'); b.classList.remove('roll');
          var x = 1 + rint(6), y = 1 + rint(6); a.textContent = x; b.textContent = y;
          msg.textContent = x === y ? 'Ничья, бросайте ещё.' : (x > y ? 'Выше у первого игрока.' : 'Выше у второго игрока.');
          msg.classList.remove('pop'); void msg.offsetWidth; msg.classList.add('pop'); btn.disabled = false;
        }
      }, 80);
    });
    body.appendChild(h('p', 'p-note', 'Первый игрок слева, второй справа.'));
    body.appendChild(row); body.appendChild(msg); body.appendChild(btn);
  }

  function rCoin(body, p) {
    var sides = p.sides || ['Орёл', 'Решка'], coin = h('div', 'p-coin', '?'), msg = h('p', 'p-big');
    var btn = h('button', 'btn btn-sec p-start', 'Подбросить монетку'); btn.type = 'button';
    btn.addEventListener('click', function () {
      btn.disabled = true; coin.classList.remove('flip'); void coin.offsetWidth; coin.classList.add('flip'); msg.textContent = '';
      setTimeout(function () {
        var s = sides[rint(2)]; coin.textContent = s.charAt(0); msg.textContent = 'Выпало: ' + s + '.';
        msg.classList.remove('pop'); void msg.offsetWidth; msg.classList.add('pop'); btn.disabled = false;
      }, reduceMq.matches ? 50 : 700);
    });
    body.appendChild(coin); body.appendChild(msg); body.appendChild(btn);
  }

  function rMenu(body, p) {
    var list = h('div', 'p-menu'); body.appendChild(list);
    function home() {
      list.innerHTML = '';
      p.games.forEach(function (g) {
        var b = h('button', 'p-opt', g.title); b.type = 'button';
        b.addEventListener('click', function () {
          list.innerHTML = '';
          var back = h('button', 'btn btn-sec p-start', 'К списку игр'); back.type = 'button'; back.addEventListener('click', function () { clearInterval(timerId); home(); });
          list.appendChild(h('p', 'p-q', g.title));
          if (g.panel.intro) list.appendChild(h('p', 'p-note', g.panel.intro));
          var inner = h('div'); list.appendChild(inner);
          ({ random: rRandom, pairguess: rPairGuess, dice: rDice, coin: rCoin, guess: rGuess }[g.panel.type] || rRandom)(inner, g.panel);
          list.appendChild(back);
        });
        list.appendChild(b);
      });
    }
    home();
  }

  function openPanel(k) {
    var p = cfg.sectors[k].panel; if (!p) return;
    clearInterval(timerId);
    $('#panelTitle').textContent = p.title; $('#panelIntro').textContent = p.intro || '';
    var body = $('#panelBody'); body.innerHTML = '';
    ({ checklist: rCheck, info: rInfo, task: rTask, quiz: rQuiz, random: rRandom, guess: rGuess, menu: rMenu, pairguess: rPairGuess, dice: rDice, coin: rCoin }[p.type] || rInfo)(body, p);
    var lk = $('#panelLink');
    if (p.link) { lk.hidden = false; lk.textContent = p.link.label; lk.dataset.type = p.link.type; lk.dataset.url = p.link.url || ''; } else lk.hidden = true;
    closeCard();
    var sh = $('#panel'); sh.hidden = false; void sh.offsetWidth; sh.classList.add('open');
    $('#panelScroll').scrollTop = 0;
  }
  function closePanel() { clearInterval(timerId); var sh = $('#panel'); sh.classList.remove('open'); sh.hidden = true; }

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

  function contactUrl() {
    var l = cfg.links, u = l.contact;
    if (l.contactPrefill && lastResult !== null) {
      var t = l.contactPrefill.replace('{sector}', cfg.sectors[lastResult].title);
      u += (u.indexOf('?') === -1 ? '?' : '&') + 'text=' + encodeURIComponent(t);
    }
    return u;
  }

  function bumpCounter() {
    var el = $('#counter'), day = new Date().toISOString().slice(0, 10), n = 0;
    try {
      var d = JSON.parse(localStorage.getItem('koleso_count') || '{}');
      n = d.day === day ? d.n : 0; n += 1;
      localStorage.setItem('koleso_count', JSON.stringify({ day: day, n: n }));
    } catch (e) { n = (bumpCounter.mem = (bumpCounter.mem || 0) + 1); }
    el.textContent = (cfg.counterText || '').replace('{n}', n);
  }

  function share() {
    var l = cfg.links;
    var s = lastResult !== null ? cfg.sectors[lastResult] : null;
    var text = (l.shareText || '') + (s ? ' Выпало: ' + s.title + '.' : '');
    openLink('https://t.me/share/url?url=' + encodeURIComponent(l.share) + '&text=' + encodeURIComponent(text));
  }

  function sparks() {
    if (!cfg.anim || !cfg.anim.sparks || reduceMq.matches) return;
    var box = $('#wheelMain'), n8 = 10;
    for (var i = 0; i < n8; i++) {
      var ang = i * 360 / n8 + 18, p = pt(ang, 58), s = document.createElement('i');
      s.className = 'spark';
      s.style.cssText = 'left:' + f(50 + p[0] * 0.86) + '%;top:' + f(50 + p[1] * 0.86) + '%;animation-delay:' + f(i * 0.35) + 's;width:' + (i % 2 ? 12 : 18) + 'px;height:' + (i % 2 ? 12 : 18) + 'px';
      s.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1c.9 6.2 4.8 10.1 11 11-6.2.9-10.1 4.8-11 11-.9-6.2-4.8-10.1-11-11C7.200 11.100 11.100 7.200 12 1z"/></svg>';
      box.appendChild(s);
    }
  }

  function ambient() {
    sparks();
    if (!cfg.anim || cfg.anim.ambient !== 'hearts' || reduceMq.matches) return;
    var bg = $('.bg'), cols = cfg.wheel.sectorFill;
    for (var i = 0; i < 14; i++) {
      var d = document.createElement('i'); d.className = 'float';
      var sz = 14 + r01() * 22;
      d.style.cssText = 'left:' + f(r01() * 96) + '%;width:' + f(sz) + 'px;height:' + f(sz) + 'px;animation-duration:' + f(9 + r01() * 9) + 's;animation-delay:' + f(-r01() * 14) + 's;color:' + cols[i % cols.length];
      d.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21S3 15.2 3 8.8A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 9 2.4C21 15.2 12 21 12 21z"/></svg>';
      bg.appendChild(d);
    }
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
    if (!cfg.links.contact) $('#contactBtn').hidden = true;
    if (!cfg.links.contact) $('#contactBtn').hidden = true;
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
    $('#actionBtn').addEventListener('click', function () {
      var t = this.dataset.type, u = this.dataset.url;
      if (t === 'panel') openPanel(lastResult);
      else if (t === 'spin') { closeCard(); spin(); }
      else if (t === 'share') share();
      else if (u) openLink(u);
      else if (t === 'channel') openLink(cfg.links.channel);
      else openLink(contactUrl());
    });
    $('#shareBtn').addEventListener('click', share);
    $('#panelBack').addEventListener('click', closePanel);
    $('#panelBg').addEventListener('click', closePanel);
    $('#panelAgain').addEventListener('click', function () { closePanel(); spin(); });
    $('#panelLink').addEventListener('click', function () {
      var t = this.dataset.type, u = this.dataset.url;
      if (u) openLink(u); else if (t === 'channel') openLink(cfg.links.channel); else openLink(contactUrl());
    });
    $('#contactBtn').addEventListener('click', function () { openLink(contactUrl()); });
    $('#sheetBg').addEventListener('click', closeCard);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeCard(); closePanel(); } });
    if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor(cfg.colors.bg); tg.setBackgroundColor(cfg.colors.bg); } catch (e) {} }
    ambient();
    document.body.classList.add('ready');
  }

  loadConfig().then(function (c) { cfg = c; init(); }).catch(function () {
    document.body.innerHTML = '<p style="padding:24px;font:16px sans-serif">Не удалось загрузить config.json</p>';
  });
})();
