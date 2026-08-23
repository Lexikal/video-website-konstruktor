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

  /* ---- Arbeiten: Projekt-Lightbox ----
     Karte klicken → <dialog> öffnet mit Glow in der Projektfarbe (real/ki/hy),
     Video wird erst jetzt geladen (kein Preload aller Karten). Eigenes Video
     einsetzen: einfach data-video/-poster auf der Karte setzen, sonst nichts
     ändern. */
  var lightbox = $('#lightbox');
  if (lightbox && 'showModal' in lightbox) {
    var lbVideo = $('.lightbox-video', lightbox);
    var lbSource = lbVideo ? $('source', lbVideo) : null;
    var lbTitle = $('.lightbox-title', lightbox);
    var lbMeta = $('.lightbox-meta', lightbox);
    var lbClose = $('.lightbox-close', lightbox);
    var openFrom = function (card) {
      lightbox.dataset.glow = card.dataset.mode || 'real';
      if (lbTitle) lbTitle.textContent = card.dataset.title || '';
      if (lbMeta) lbMeta.textContent = card.dataset.meta || '';
      var hasVideo = !!(card.dataset.video);
      var lbPh = $('.lightbox-ph', lightbox);
      if (lbVideo) lbVideo.hidden = !hasVideo;
      if (lbPh) lbPh.hidden = hasVideo;
      if (hasVideo && lbVideo && lbSource) {
        lbVideo.poster = card.dataset.poster || '';
        lbSource.src = card.dataset.video;
        lbVideo.load();
      }
      lightbox.showModal();
      if (hasVideo && lbVideo && !reduce) lbVideo.play().catch(function () {});
    };
    $$('[data-lightbox]').forEach(function (card) {
      card.addEventListener('click', function () { openFrom(card); });
    });
    if (lbClose) lbClose.addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', function () {
      if (lbVideo) { lbVideo.pause(); if (lbSource) lbSource.src = ''; lbVideo.load(); }
    });
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

  /* ---- Jahr im Footer ---- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
