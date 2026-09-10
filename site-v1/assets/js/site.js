/* Vanilla JS. Keine externen Requests, keine Cookies, kein localStorage.
   Damit ist kein Consent-Banner nach § 25 TDDDG erforderlich. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- Header-Zustand ---- */
  var nav = $('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile-Menü ---- */
  var burger = $('.burger'), drawer = $('#menu');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      drawer.setAttribute('data-open', String(!open));
      document.body.style.overflow = !open ? 'hidden' : '';
      if (!open) { var f = drawer.querySelector('a'); if (f) f.focus(); }
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('data-open', 'false');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.getAttribute('data-open') === 'true') burger.click();
    });
  }

  /* ---- Scroll-Reveal ---- */
  var rv = $$('.rv');
  if (rv.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      rv.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      rv.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
    }
  }

  /* ---- Parallax (nur Desktop, nur ohne reduced-motion) ---- */
  var px = $$('[data-parallax]');
  if (px.length && !reduce && window.innerWidth > 900) {
    var ticking = false;
    var frame = function () {
      var vh = window.innerHeight;
      px.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
    }, { passive: true });
    frame();
  }

  /* ---- Scroll-Video-Hintergrund (Leistungen) ----
     currentTime folgt dem Scroll-Fortschritt der ganzen Seite.
     Kein .play() — Autoplay-Policies betreffen uns dadurch nicht.
     Fällt zurück auf CSS-Gradient bei reduced-motion, Sparmodus
     oder langsamer Verbindung (data-saver), statt das Video zu laden. */
  if (document.body.classList.contains('page--video-bg')) {
    var bgVideo = $('.bg-video');
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var lowData = !!(conn && (conn.saveData || /2g/.test(conn.effectiveType || '')));
    if (bgVideo && !reduce && !lowData) {
      var ready = false;
      var scrub = function () {
        if (!bgVideo.duration || isNaN(bgVideo.duration)) return;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        bgVideo.currentTime = progress * bgVideo.duration;
      };
      bgVideo.addEventListener('loadedmetadata', function () { ready = true; scrub(); });
      bgVideo.addEventListener('error', function () { document.body.classList.add('page--video-bg-fallback'); });
      var vTicking = false;
      window.addEventListener('scroll', function () {
        if (!ready || vTicking) return;
        vTicking = true;
        window.requestAnimationFrame(function () { scrub(); vTicking = false; });
      }, { passive: true });
      bgVideo.preload = 'auto';
      bgVideo.load();
    } else {
      document.body.classList.add('page--video-bg-fallback');
    }
  }

  /* ---- REAL ⇄ KI Vergleichsregler ---- */
  $$('.compare').forEach(function (box) {
    var top = $('.compare-top', box), handle = $('.compare-handle', box), range = $('.compare-range', box);
    if (!top || !handle || !range) return;
    var set = function (v) {
      v = Math.max(0, Math.min(100, v));
      top.style.clipPath = 'inset(0 0 0 ' + v + '%)';
      handle.style.left = v + '%';
      range.value = v;
      range.setAttribute('aria-valuenow', Math.round(v));
    };
    set(50);
    range.addEventListener('input', function () { set(parseFloat(range.value)); });
    var drag = function (e) {
      var r = box.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      set((x / r.width) * 100);
    };
    var down = false;
    box.addEventListener('pointerdown', function (e) { down = true; box.setPointerCapture(e.pointerId); drag(e); });
    box.addEventListener('pointermove', function (e) { if (down) drag(e); });
    box.addEventListener('pointerup', function () { down = false; });
    box.addEventListener('pointercancel', function () { down = false; });
  });

  /* ---- Hero-Video: Steuerung + Respekt vor reduced-motion ---- */
  var hero = $('.hero'), vid = $('.hero-media video');
  if (hero && vid) {
    hero.classList.add('has-video');
    if (reduce) vid.pause();
    var tgl = $('.vid-toggle');
    if (tgl) {
      var sync = function () {
        var playing = !vid.paused;
        tgl.textContent = playing ? '❙❙' : '▶';
        tgl.setAttribute('aria-label', playing ? tgl.dataset.pause : tgl.dataset.play);
      };
      tgl.addEventListener('click', function () { vid.paused ? vid.play() : vid.pause(); sync(); });
      sync();
    }
    vid.addEventListener('error', function () { hero.classList.remove('has-video'); });
  }

  /* ---- Projektanfrage → E-Mail (kein Server, keine Datenweitergabe) ---- */
  var form = $('#brief');
  if (form) {
    /* novalidate erst jetzt setzen: fällt JS aus, greift die native
       Browser-Validierung und der mailto-action als Fallback. */
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('.hp input').value) return;           /* Honeypot */
      if (!form.reportValidity()) return;
      var d = new FormData(form), L = [];
      var get = function (k) { return (d.getAll(k) || []).filter(Boolean).join(', '); };
      form.dataset.fields.split('|').forEach(function (pair) {
        var p = pair.split(':'), v = get(p[0]);
        if (v) L.push(p[1] + ': ' + v);
      });
      var mail = form.dataset.mail;
      window.location.href = 'mailto:' + mail
        + '?subject=' + encodeURIComponent(form.dataset.subject + ' — ' + (d.get('name') || ''))
        + '&body=' + encodeURIComponent(L.join('\n'));
      var ok = $('#sent'); if (ok) ok.hidden = false;
    });
  }

  /* ---- Projekt-Reel: Fokus-Karussell + Schnitt-Deck ----
     Nur auf .strip[data-reel]. Karten skalieren nach Abstand zur Mitte —
     wie eine Sichtungs-Leiste im Schnittprogramm, nicht wie ein Musik-
     Player-Karussell. Steht bei reduced-motion optisch still (keine
     Skalierung, kein automatisches Weiterspringen ohne Nutzeraktion),
     bleibt aber bedienbar: Pfeile/Punkte funktionieren weiterhin, nur
     ohne Animation. */
  $$('.strip[data-reel]').forEach(function (strip) {
    var cards = $$('.card', strip);
    if (!cards.length) return;
    var viewport = strip.closest('.strip-viewport');
    var deck = viewport ? viewport.querySelector('.reel-deck') : null;

    var applyFocus = function () {
      if (reduce) return;
      var mid = strip.clientWidth / 2;
      cards.forEach(function (c) {
        var cardMid = c.offsetLeft + c.offsetWidth / 2 - strip.scrollLeft;
        var t = Math.min(1, Math.abs(cardMid - mid) / mid);
        c.style.transform = 'scale(' + (1 - t * 0.16).toFixed(3) + ')';
        c.style.opacity = (1 - t * 0.55).toFixed(3);
      });
    };

    var nearestIndex = function () {
      var target = strip.scrollLeft + strip.clientWidth / 2;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - target);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    };

    var current = 0;
    var goTo = function (i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      var c = cards[i];
      var target = c.offsetLeft + c.offsetWidth / 2 - strip.clientWidth / 2;
      strip.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
    };

    var scrollTicking = false;
    var onScroll = function () {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(function () {
        applyFocus();
        updateDeck();
        scrollTicking = false;
      });
    };
    strip.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Start exakt auf Karte 0 zentriert, statt auf dem, was scrollLeft:0
    // zufällig am nächsten liegt (hängt vom Seiten-Padding ab).
    strip.scrollLeft = cards[0].offsetLeft + cards[0].offsetWidth / 2 - strip.clientWidth / 2;
    applyFocus();

    if (!deck) return;
    var prevBtn = deck.querySelector('.reel-btn--prev');
    var nextBtn = deck.querySelector('.reel-btn--next');
    var playBtn = deck.querySelector('.reel-btn--play');
    var indexEl = deck.querySelector('[data-reel-index]');
    var totalEl = deck.querySelector('[data-reel-total]');
    var labelEl = deck.querySelector('[data-reel-label]');
    var dotsWrap = deck.querySelector('[data-reel-dots]');

    var dots = cards.map(function (c, i) {
      var isEmpty = c.classList.contains('card--empty');
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'reel-dot' + (isEmpty ? ' reel-dot--empty' : '');
      var title = c.querySelector('h3');
      dot.setAttribute('aria-label', title ? title.textContent : 'Projekt ' + (i + 1));
      if (isEmpty) {
        dot.disabled = true;
      } else {
        dot.addEventListener('click', function () { goTo(i); setPlaying(false); });
      }
      dotsWrap.appendChild(dot);
      return dot;
    });
    if (totalEl) totalEl.textContent = String(cards.length).padStart(2, '0');

    var updateDeck = function () {
      current = nearestIndex();
      if (indexEl) indexEl.textContent = String(current + 1).padStart(2, '0');
      var label = cards[current].querySelector('.svc-no');
      if (labelEl) labelEl.textContent = label ? label.textContent : '';
      dots.forEach(function (d, j) { d.setAttribute('aria-current', String(j === current)); });
    };
    updateDeck();

    prevBtn.addEventListener('click', function () { goTo(current - 1); setPlaying(false); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); setPlaying(false); });

    // Play/Pause ist der einzige dauerhafte Zustand; Hover/Fokus auf einer
    // Karte pausiert nur den Timer (Video-Vorschau soll nicht weggeschoben
    // werden) und läuft danach von selbst weiter, ohne den Play-Knopf
    // umzuschalten.
    var timer = null, playing = false;
    var stopTimer = function () { clearInterval(timer); timer = null; };
    var startTimer = function () {
      stopTimer();
      timer = setInterval(function () {
        goTo(current + 1 >= cards.length ? 0 : current + 1);
      }, 4200);
    };
    var setPlaying = function (v) {
      playing = v;
      stopTimer();
      if (playing) startTimer();
      playBtn.textContent = playing ? '❙❙' : '▶';
      playBtn.setAttribute('aria-pressed', String(playing));
      playBtn.setAttribute('aria-label', playing ? 'Pausieren' : 'Automatisch weiter');
    };
    playBtn.addEventListener('click', function () { setPlaying(!playing); });
    setPlaying(!reduce);

    cards.forEach(function (c) {
      c.addEventListener('pointerenter', stopTimer);
      c.addEventListener('pointerleave', function () { if (playing) startTimer(); });
      c.addEventListener('focusin', stopTimer);
      c.addEventListener('focusout', function () { if (playing) startTimer(); });
    });
  });

  /* ---- Karten-Vorschau: Video spielt bei Hover/Tastaturfokus ----
     Nur auf Geräten mit echtem Hover (Maus/Trackpad) — auf Touch würde ein
     "kurz antippen zum Vorschauen" nur den eigentlichen Klick verzögern,
     dort führt ein Tap direkt zur Projektseite, wo das Video sowieso spielt.
     Steht komplett still bei reduced-motion. */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.card-video').forEach(function (v) {
      var card = v.closest('.card');
      if (!card) return;
      var start = function () { v.play().catch(function () {}); };
      var stop = function () { v.pause(); v.currentTime = 0; };
      card.addEventListener('pointerenter', start);
      card.addEventListener('pointerleave', stop);
      card.addEventListener('focusin', start);
      card.addEventListener('focusout', stop);
    });
  }

  /* ---- Kein Rechtsklick-Download auf Videos ----
     Blendet nur "Video speichern unter…" im Kontextmenü aus — keine echte
     Zugriffssperre. Die Datei liegt als normale statische URL im Netz;
     wer sie wirklich ziehen will, kommt per DevTools/Direktlink trotzdem
     dran. Echter Schutz bräuchte einen Video-Host mit signierten/
     ablaufenden URLs, was externe Requests bedeuten würde (siehe
     tools/build-projects.py, hero_media()). */
  document.addEventListener('contextmenu', function (e) {
    if (e.target.tagName === 'VIDEO') e.preventDefault();
  });

  /* ---- Jahr im Footer ---- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
