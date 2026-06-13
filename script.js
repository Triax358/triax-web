/* Triax v3 :: interactividad */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches;

  /* ---------- Secuencia de encendido ---------- */
  var boot = document.getElementById('boot');
  var skip = document.getElementById('bootSkip');
  function bootOff() {
    if (boot) boot.classList.add('off');
    try { sessionStorage.setItem('triaxBoot', '1'); } catch (e) {}
  }
  if (boot) {
    var seen = false;
    try { seen = sessionStorage.getItem('triaxBoot') === '1'; } catch (e) {}
    if (reduce || seen) {
      boot.classList.add('off');
    } else {
      boot.classList.add('run');
      setTimeout(bootOff, 1700);
      if (skip) skip.addEventListener('click', bootOff);
      boot.addEventListener('click', bootOff);
    }
  }

  /* ---------- Menú móvil ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Año dinámico ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Red de nodos del hero (canvas) ---------- */
  (function () {
    var canvas = document.getElementById('net');
    if (!canvas || reduce) return;
    var ctx = canvas.getContext('2d');
    var dots = [];
    var mouse = { x: -9999, y: -9999 };
    var W = 0, H = 0, raf = null;

    function size() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = canvas.width = Math.floor(r.width);
      H = canvas.height = Math.floor(r.height);
      var n = Math.min(90, Math.floor(W * H / 16000));
      dots = [];
      for (var i = 0; i < n; i++) {
        dots.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.6
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d2;
      for (i = 0; i < dots.length; i++) {
        a = dots[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        // leve atracción hacia el mouse
        dx = mouse.x - a.x; dy = mouse.y - a.y;
        d2 = dx * dx + dy * dy;
        if (d2 < 22500) { a.x += dx * 0.004; a.y += dy * 0.004; }
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(123,215,255,.55)';
        ctx.fill();
      }
      for (i = 0; i < dots.length; i++) {
        for (j = i + 1; j < dots.length; j++) {
          a = dots[i]; b = dots[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d2 = dx * dx + dy * dy;
          if (d2 < 13000) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(77,159,255,' + (0.16 * (1 - d2 / 13000)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    }

    canvas.parentElement.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('mouseleave', function () {
      mouse.x = -9999; mouse.y = -9999;
    });

    // pausa cuando el hero no está a la vista
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            if (!raf) raf = requestAnimationFrame(frame);
          } else if (raf) {
            cancelAnimationFrame(raf); raf = null;
          }
        });
      }, { threshold: 0.05 }).observe(canvas);
    } else {
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', size);
    size();
  })();

  /* ---------- Circuito oculto que sigue al mouse ---------- */
  (function () {
    var grid = document.getElementById('revealGrid');
    if (!grid || touch || reduce) return;
    var on = false;
    document.addEventListener('mousemove', function (e) {
      grid.style.setProperty('--mx', e.clientX + 'px');
      grid.style.setProperty('--my', e.clientY + 'px');
      if (!on) { grid.classList.add('on'); on = true; }
    });
    document.addEventListener('mouseleave', function () {
      grid.classList.remove('on'); on = false;
    });
  })();

  /* ---------- Aparición al hacer scroll ---------- */
  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Tarjetas: tilt 3D + brillo que sigue al mouse ---------- */
  (function () {
    if (touch || reduce) return;
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.transform =
          'rotateY(' + ((px - 0.5) * 7).toFixed(2) + 'deg)' +
          ' rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg)';
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  })();

  /* ---------- Botón magnético ---------- */
  (function () {
    if (touch || reduce) return;
    document.querySelectorAll('.magnet').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.14).toFixed(1) + 'px,' + (dy * 0.22).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  })();

  /* ---------- Línea cibernética central: avanza y retrocede con el scroll ---------- */
  (function () {
    var wrap = document.getElementById('trace');
    var svg = document.getElementById('traceSvg');
    if (!wrap || !svg || reduce) return;

    var track = document.getElementById('traceTrack');
    var prog = document.getElementById('traceProgress');
    var nodesG = document.getElementById('traceNodes');
    var spark = document.getElementById('traceSpark');
    var core = document.getElementById('traceSparkCore');
    var len = 0;
    var nodes = [];
    var lut = [];

    function lenAtY(yv) {
      for (var i = 1; i < lut.length; i++) {
        if (lut[i].y >= yv) {
          var a = lut[i - 1], b = lut[i];
          var t = b.y === a.y ? 0 : (yv - a.y) / (b.y - a.y);
          return a.l + (b.l - a.l) * t;
        }
      }
      return len;
    }

    function build() {
      var docH = document.documentElement.scrollHeight;
      var w = document.documentElement.clientWidth;
      var cx = w / 2;
      var amp = Math.min(150, w * 0.12);

      wrap.style.height = docH + 'px';
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + docH);
      svg.setAttribute('height', docH);

      var fr = [0.12, 0.30, 0.48, 0.66, 0.84];
      var d = 'M' + cx + ' 0';
      var x = cx;
      fr.forEach(function (f, i) {
        var yy = Math.round(docH * f);
        var nx = cx + (i % 2 === 0 ? -amp : amp);
        var dx = Math.abs(nx - x);
        d += ' V' + yy + ' L' + nx + ' ' + (yy + dx);
        x = nx;
      });
      d += ' V' + docH;
      track.setAttribute('d', d);
      prog.setAttribute('d', d);
      len = prog.getTotalLength();
      prog.style.strokeDasharray = len;

      lut = [];
      var samples = 300;
      for (var i = 0; i <= samples; i++) {
        var l = len * i / samples;
        lut.push({ l: l, y: prog.getPointAtLength(l).y });
      }

      nodesG.innerHTML = '';
      nodes = [];
      fr.forEach(function (f) {
        var pt = prog.getPointAtLength(lenAtY(docH * f));
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', pt.x);
        c.setAttribute('cy', pt.y);
        c.setAttribute('r', 5);
        c.setAttribute('class', 'trace-node');
        nodesG.appendChild(c);
        nodes.push({ el: c, y: pt.y });
      });
      update();
    }

    function update() {
      if (!len) return;
      var docH = document.documentElement.scrollHeight;
      var vh = window.innerHeight;
      var max = docH - vh;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      var targetY = window.scrollY + vh * (0.25 + 0.55 * p);
      var l = lenAtY(Math.min(targetY, docH));
      prog.style.strokeDashoffset = Math.max(0, len - l);
      var pt = prog.getPointAtLength(l);
      spark.setAttribute('cx', pt.x); spark.setAttribute('cy', pt.y);
      core.setAttribute('cx', pt.x); core.setAttribute('cy', pt.y);
      nodes.forEach(function (n) {
        n.el.classList.toggle('on', pt.y >= n.y);
      });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }
    }, { passive: true });
    window.addEventListener('resize', build);
    document.querySelectorAll('details').forEach(function (det) {
      det.addEventListener('toggle', function () { build(); });
    });
    build();
  })();

  /* ---------- Contadores de estadísticas ---------- */
  (function () {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduce) { el.textContent = target; return; }
      var t0 = null;
      var dur = 1300;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * ease);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            run(en.target);
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.5 });
      nums.forEach(function (el) { io.observe(el); });
    } else {
      nums.forEach(run);
    }
  })();
})();
