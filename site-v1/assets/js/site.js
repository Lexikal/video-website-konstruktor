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

  /* ---- Projekt-Reel: räumliches Karussell + Trailer-Fenster ----
     Karten liegen auf einer Bühne mit Perspektive. Position, Skalierung,
     Deckkraft und Weichzeichnung je Karte rechnet der rAF-Loop unten aus
     der Distanz zur Mitte — CSS legt nur fest, wie eine Karte aussieht.

     Eingabe unterscheidet sich nach Gerät:
       Zeiger  — horizontale Mausposition steuert eine Geschwindigkeit
                 (Totzone in der Mitte, gedämpft, mit Nachlauf)
       Finger  — Ziehen mit Gummiband an den Enden, Einrasten beim Loslassen
       Tastatur— Pfeiltasten, Enter/Leertaste
     Bei reduced-motion entfällt Zeiger-Fahrt, Trägheit, Neigung und
     automatisches Weiterschalten; bedienbar bleibt alles. */
  var REEL_TEXT = document.documentElement.lang === 'en'
    ? { trailer:'Trailer', close:'Close', play:'Play video', open:'Open project page',
        year:'Year', role:'Role', type:'Type', client:'Client', carousel:'Selected projects' }
    : { trailer:'Trailer', close:'Schließen', play:'Video abspielen', open:'Projektseite öffnen',
        year:'Jahr', role:'Rolle', type:'Art', client:'Kunde', carousel:'Ausgewählte Projekte' };

  var reelModal = null, reelPanel = null, reelPanel3d = null, reelParts = null;
  var modalOpen = false, modalOrigin = null, modalLastFocus = null, modalBodyOverflow = '';
  var tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0, tiltRaf = 0;

  function buildModal() {
    if (reelModal) return;
    reelModal = document.createElement('div');
    reelModal.className = 'reel-modal';
    reelModal.hidden = true;
    reelModal.innerHTML =
      '<button class="reel-scrim" type="button" aria-label="' + REEL_TEXT.close + '"></button>' +
      '<div class="reel-panel" role="dialog" aria-modal="true" aria-labelledby="reel-title">' +
        '<div class="reel-panel-3d">' +
          '<div class="reel-head">' +
            '<p class="reel-head-tag"><i aria-hidden="true"></i><span data-r="tag"></span></p>' +
            '<button class="reel-close" type="button">' +
              '<span aria-hidden="true">&#10005;</span><span>' + REEL_TEXT.close + '</span>' +
            '</button>' +
          '</div>' +
          '<div class="reel-stage">' +
            '<video data-r="video" playsinline preload="none" controls controlsList="nodownload"></video>' +
            '<button class="reel-stage-poster" type="button" data-r="posterbtn" aria-label="' + REEL_TEXT.play + '">' +
              '<img data-r="posterimg" alt="" decoding="async">' +
              '<span class="reel-bigplay" aria-hidden="true">&#9654;</span>' +
            '</button>' +
          '</div>' +
          '<div class="reel-info">' +
            '<div>' +
              '<h2 id="reel-title" data-r="title"></h2>' +
              '<p class="reel-role" data-r="role"></p>' +
              '<p class="reel-tagline" data-r="tagline"></p>' +
            '</div>' +
            '<div class="reel-side">' +
              '<ul class="reel-facts" data-r="facts"></ul>' +
              '<a class="btn btn--ghost" data-r="link" href="#">' + REEL_TEXT.open + '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(reelModal);

    reelPanel = $('.reel-panel', reelModal);
    reelPanel3d = $('.reel-panel-3d', reelModal);
    reelParts = {};
    $$('[data-r]', reelModal).forEach(function (el) { reelParts[el.dataset.r] = el; });

    $('.reel-scrim', reelModal).addEventListener('click', closeModal);
    $('.reel-close', reelModal).addEventListener('click', closeModal);
    reelParts.posterbtn.addEventListener('click', function () {
      reelParts.posterbtn.hidden = true;
      reelParts.video.play().catch(function () {});
      reelParts.video.focus();
    });
    reelModal.addEventListener('keydown', onModalKey);

    /* Neigung + Lichtreflex. Während der Zeiger über dem Panel liegt, dämpft
       der rAF-Loop selbst — die CSS-Transition wird dafür abgeschaltet, sonst
       glättet sie ein zweites Mal und die Neigung läuft sichtbar hinterher. */
    reelPanel3d.addEventListener('pointerenter', function (e) {
      if (reduce || e.pointerType === 'touch') return;
      reelPanel3d.style.transition = 'none';
      reelPanel3d.setAttribute('data-lit', 'true');
    });
    reelPanel3d.addEventListener('pointermove', function (e) {
      if (reduce || e.pointerType === 'touch') return;
      var r = reelPanel3d.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      var ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      tiltTY = Math.max(-1, Math.min(1, nx));
      tiltTX = Math.max(-1, Math.min(1, -ny));
      reelPanel3d.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      reelPanel3d.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    });
    reelPanel3d.addEventListener('pointerleave', function () {
      tiltTX = 0; tiltTY = 0;
      reelPanel3d.style.transition = '';
      reelPanel3d.removeAttribute('data-lit');
      reelPanel3d.style.setProperty('--tilt-x', '0');
      reelPanel3d.style.setProperty('--tilt-y', '0');
      tiltX = 0; tiltY = 0;
    });
  }

  function tiltFrame() {
    if (!modalOpen) { tiltRaf = 0; return; }
    tiltX += (tiltTX - tiltX) * 0.12;
    tiltY += (tiltTY - tiltY) * 0.12;
    reelPanel3d.style.setProperty('--tilt-x', tiltX.toFixed(4));
    reelPanel3d.style.setProperty('--tilt-y', tiltY.toFixed(4));
    tiltRaf = window.requestAnimationFrame(tiltFrame);
  }

  function modalFocusables() {
    return $$('a[href], button:not([disabled]), video[controls]', reelPanel)
      .filter(function (el) { return !el.hidden && el.offsetParent !== null; });
  }

  function onModalKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    var f = modalFocusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }

  function openModal(card) {
    buildModal();
    var d = card.dataset;
    if (!d.video) return false;

    modalLastFocus = document.activeElement;
    modalOrigin = card;

    reelParts.tag.textContent = REEL_TEXT.trailer + (d.modus ? ' · ' + d.modus : '');
    reelParts.title.textContent = d.titel || '';
    reelParts.role.textContent = d.rolle || '';
    reelParts.role.hidden = !d.rolle;
    reelParts.tagline.textContent = d.aufgabe || '';
    reelParts.tagline.hidden = !d.aufgabe;
    reelParts.link.href = card.getAttribute('href') || '#';

    var facts = [];
    if (d.kategorie) facts.push('<li>' + d.kategorie + '</li>');
    if (d.jahr) facts.push('<li>' + REEL_TEXT.year + ' <b>' + d.jahr + '</b></li>');
    if (d.typ) facts.push('<li><b>' + d.typ + '</b></li>');
    if (d.kunde) facts.push('<li>' + REEL_TEXT.client + ' <b>' + d.kunde + '</b></li>');
    reelParts.facts.innerHTML = facts.join('');

    var stageEl = $('.reel-stage', reelModal);
    var oldBadge = $('.badge-real, .badge-ki, .badge-hy, .badge-cgi', stageEl);
    if (oldBadge) oldBadge.remove();
    if (d.modus && d.modusCss) {
      var badge = document.createElement('span');
      badge.className = d.modusCss;
      badge.textContent = d.modus;
      stageEl.appendChild(badge);
    }

    reelParts.posterbtn.hidden = false;
    if (d.poster) { reelParts.posterimg.src = d.poster; reelParts.posterimg.hidden = false; }
    else { reelParts.posterimg.removeAttribute('src'); reelParts.posterimg.hidden = true; }
    reelParts.video.poster = d.poster || '';
    reelParts.video.src = d.video;

    modalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    reelModal.hidden = false;
    modalOpen = true;

    /* FLIP: das Panel startet exakt auf der Kachel und wächst auf seine
       echte Layout-Position. Gleichmäßige Skalierung über das Breiten-
       verhältnis, damit nichts verzerrt. */
    var mediaEl = card.querySelector('.card-media') || card;
    var from = mediaEl.getBoundingClientRect();
    reelPanel.style.transition = 'none';
    reelPanel.style.transform = 'none';
    reelPanel.style.opacity = '1';
    var to = reelPanel.getBoundingClientRect();
    /* data-open sofort setzen, nicht erst im rAF: sonst hängt das Fenster in
       einem gedrosselten Tab (Hintergrund, Energiesparmodus) für immer in
       Kachelgröße fest und der Schleier blendet nie ein. */
    reelModal.setAttribute('data-open', 'true');
    if (!reduce && to.width > 0) {
      var s = Math.max(0.05, from.width / to.width);
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      reelPanel.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
      reelPanel.style.opacity = '0.4';
      var released = false;
      var release = function () {
        if (released) return;
        released = true;
        reelPanel.style.transition =
          'transform .78s cubic-bezier(.16,1,.3,1), opacity .45s cubic-bezier(.16,1,.3,1)';
        reelPanel.style.transform = 'translate(0px,0px) scale(1)';
        reelPanel.style.opacity = '1';
      };
      /* Doppeltes rAF ist der saubere Weg (ein Frame, damit der Startzustand
         wirklich gerendert wurde). setTimeout ist nur die Reißleine, falls
         rAF gedrosselt ist — dann öffnet es weniger geschmeidig, aber es
         öffnet. */
      window.requestAnimationFrame(function () { window.requestAnimationFrame(release); });
      setTimeout(release, 120);
    }

    $('.reel-close', reelModal).focus();
    if (!reduce && !tiltRaf) tiltRaf = window.requestAnimationFrame(tiltFrame);
    return true;
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;

    var v = reelParts.video;
    v.pause();
    v.removeAttribute('src');
    v.load();

    var origin = modalOrigin;
    var finish = function () {
      reelModal.hidden = true;
      reelModal.removeAttribute('data-open');
      reelPanel.style.transition = 'none';
      reelPanel.style.transform = 'none';
      reelPanel.style.opacity = '1';
      document.body.style.overflow = modalBodyOverflow;
      /* Zurück auf die Karte, aus der das Fenster gewachsen ist — nicht auf
         das, was vor dem Öffnen zufällig fokussiert war. Sonst bleibt der
         Fokus im inzwischen versteckten Panel hängen. */
      var back = (origin && document.contains(origin)) ? origin
               : (modalLastFocus && document.contains(modalLastFocus)) ? modalLastFocus
               : null;
      if (back) back.focus({ preventScroll: true });
      modalOrigin = null;
    };

    reelModal.removeAttribute('data-open');
    if (reduce || !modalOrigin || !document.contains(modalOrigin)) { finish(); return; }

    var mediaEl = modalOrigin.querySelector('.card-media') || modalOrigin;
    var from = mediaEl.getBoundingClientRect();
    var to = reelPanel.getBoundingClientRect();
    var s = Math.max(0.05, from.width / to.width);
    var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    var dy = (from.top + from.height / 2) - (to.top + to.height / 2);

    reelPanel.style.transition =
      'transform .58s cubic-bezier(.16,1,.3,1), opacity .5s cubic-bezier(.16,1,.3,1)';
    reelPanel.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
    reelPanel.style.opacity = '0';
    var done = false;
    var once = function () { if (done) return; done = true; finish(); };
    reelPanel.addEventListener('transitionend', once, { once: true });
    setTimeout(once, 700);
  }

  $$('.strip[data-reel]').forEach(function (stage) {
    var cards = $$('.card', stage);
    if (!cards.length) return;
    var viewport = stage.closest('.strip-viewport');
    var deck = viewport ? viewport.querySelector('.reel-deck') : null;
    var last = cards.length - 1;

    /* Erst ab hier ist die Bühne räumlich. Ohne JS (oder wenn JS vorher
       stirbt) greift die Klasse nicht: dann bleibt die Leiste eine normale
       Scroll-Leiste mit funktionierenden Links, statt dass alle Karten
       absolut positioniert übereinanderliegen. */
    if (viewport) viewport.classList.add('is-spatial');

    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', REEL_TEXT.carousel);
    if (!stage.hasAttribute('tabindex')) stage.tabIndex = -1;

    var pos = 0, vel = 0, snapTo = null, current = -1;
    var pointerX = 0, pointerActive = false;
    var dragging = false, dragArmed = false, dragFrom = 0, dragStartPos = 0, dragMoved = 0;
    var visible = true;
    var DEAD = 0.18, MAXV = 0.05;

    function spacing() { return (cards[0].offsetWidth || 300) * 0.74; }

    function render() {
      var sp = spacing();
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var off = i - pos;
        var a = Math.abs(off);
        if (a > 3.6) { c.style.visibility = 'hidden'; c.style.pointerEvents = 'none'; continue; }
        c.style.visibility = '';
        var scale = Math.max(0.6, 1 - a * 0.13);
        var op = Math.max(0, 1 - a * 0.3);
        var blur = reduce ? 0 : Math.min(3.2, Math.max(0, a - 0.55) * 1.9);
        c.style.transform =
          'translate(-50%,-50%) translate3d(' + (off * sp).toFixed(1) + 'px,0,' +
          (-a * 200).toFixed(1) + 'px) rotateY(' + (-off * 5).toFixed(2) + 'deg) scale(' + scale.toFixed(4) + ')';
        c.style.opacity = op.toFixed(3);
        c.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : '';
        c.style.zIndex = String(100 - Math.round(a * 10));
        c.style.pointerEvents = a < 2.6 ? 'auto' : 'none';
      }
    }

    function syncPreview() {
      cards.forEach(function (c, i) {
        var v = c.querySelector('.card-video');
        if (!v) return;
        if (i === current && visible && !reduce) {
          v.play().catch(function () {});
        } else {
          v.pause();
          try { v.currentTime = 0; } catch (err) {}
        }
      });
    }

    function updateActive() {
      var n = Math.max(0, Math.min(last, Math.round(pos)));
      if (n === current) return;
      current = n;
      cards.forEach(function (c, i) {
        c.setAttribute('data-active', String(i === current));
        if (c.tagName === 'A') c.tabIndex = i === current ? 0 : -1;
      });
      syncPreview();
      updateDeck();
    }

    function goTo(i) {
      snapTo = Math.max(0, Math.min(last, i));
      vel = 0;
      if (reduce) { pos = snapTo; snapTo = null; render(); updateActive(); }
    }

    function measure() {
      var h = 0;
      cards.forEach(function (c) { if (c.offsetHeight > h) h = c.offsetHeight; });
      if (h > 0) stage.style.setProperty('--reel-stage-h', Math.ceil(h + 72) + 'px');
    }

    function frame() {
      if (visible) {
        if (!dragging) {
          if (snapTo !== null) {
            var d = snapTo - pos;
            pos += d * 0.15;
            if (Math.abs(d) < 0.0015) { pos = snapTo; snapTo = null; }
          } else {
            var t = 0;
            if (pointerActive && !reduce) {
              var ax = Math.abs(pointerX);
              if (ax > DEAD) {
                var norm = (ax - DEAD) / (1 - DEAD);
                t = (pointerX < 0 ? -1 : 1) * norm * norm * MAXV;
              }
            }
            if (pos <= 0 && t < 0) t *= 0.12;
            if (pos >= last && t > 0) t *= 0.12;
            vel += (t - vel) * 0.07;
            pos += vel;
            if (pos < 0) pos += (0 - pos) * 0.14;
            if (pos > last) pos += (last - pos) * 0.14;
          }
          render();
          updateActive();
        }
      }
      window.requestAnimationFrame(frame);
    }

    /* --- Zeiger: Richtung und Tempo aus der horizontalen Position --- */
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || dragging) return;
      var r = stage.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      pointerActive = true;
      if (Math.abs(pointerX) > DEAD) snapTo = null;
    });
    stage.addEventListener('pointerleave', function () { pointerActive = false; pointerX = 0; });

    /* --- Ziehen (Finger und Maus) --- */
    function onDragMove(e) {
      var dx = e.clientX - dragFrom;
      if (!dragging) {
        if (Math.abs(dx) < 7) return;
        dragging = true; snapTo = null; vel = 0; pointerActive = false;
      }
      dragMoved = Math.abs(dx);
      var p = dragStartPos - dx / spacing();
      if (p < 0) p *= 0.35;
      if (p > last) p = last + (p - last) * 0.35;
      pos = p;
      render();
      updateActive();
    }
    function onDragEnd() {
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragEnd);
      window.removeEventListener('pointercancel', onDragEnd);
      dragArmed = false;
      if (dragging) { dragging = false; goTo(Math.round(pos)); }
    }
    stage.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      dragArmed = true; dragging = false; dragMoved = 0;
      dragFrom = e.clientX; dragStartPos = pos;
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup', onDragEnd);
      window.addEventListener('pointercancel', onDragEnd);
    });

    /* --- Karten: Hover-Neigung, Klick öffnet den Trailer --- */
    cards.forEach(function (card, i) {
      var inner = card.querySelector('.card-inner');
      if (inner && !reduce) {
        card.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch' || i !== current) return;
          var r = card.getBoundingClientRect();
          inner.style.setProperty('--tilt-y', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
          inner.style.setProperty('--tilt-x', (-(((e.clientY - r.top) / r.height) * 2 - 1)).toFixed(3));
          inner.style.setProperty('--hover-scale', '1.05');
        });
        card.addEventListener('pointerleave', function () {
          inner.style.setProperty('--tilt-y', '0');
          inner.style.setProperty('--tilt-x', '0');
          inner.style.setProperty('--hover-scale', '1');
        });
      }

      card.addEventListener('click', function (e) {
        if (dragMoved > 7) { e.preventDefault(); dragMoved = 0; return; }
        if (i !== current) { e.preventDefault(); goTo(i); return; }
        /* Ohne Video bleibt der Link ein Link — dann führt der Klick wie
           gewohnt auf die Projektseite, statt ein leeres Fenster zu öffnen. */
        if (!card.dataset.video) return;
        e.preventDefault();
        openModal(card);
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); card.click(); }
      });
    });

    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); focusCurrent(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); focusCurrent(); }
    });
    function focusCurrent() {
      var n = Math.max(0, Math.min(last, snapTo === null ? current : snapTo));
      if (cards[n] && cards[n].tagName === 'A') cards[n].focus({ preventScroll: true });
    }

    /* --- Deck --- */
    var indexEl, totalEl, labelEl, playBtn, dots = [];
    function updateDeck() {
      if (!deck || current < 0) return;
      if (indexEl) indexEl.textContent = String(current + 1).padStart(2, '0');
      var lbl = cards[current].querySelector('.svc-no');
      if (labelEl) labelEl.textContent = lbl ? lbl.textContent : '';
      dots.forEach(function (d, j) { d.setAttribute('aria-current', String(j === current)); });
    }

    var timer = null, playing = false;
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function startTimer() {
      stopTimer();
      timer = setInterval(function () { goTo(current + 1 > last ? 0 : current + 1); }, 4600);
    }
    function setPlaying(v) {
      playing = v;
      stopTimer();
      if (playing) startTimer();
      if (!playBtn) return;
      playBtn.innerHTML = playing ? '&#10074;&#10074;' : '&#9654;';
      playBtn.setAttribute('aria-pressed', String(playing));
    }

    if (deck) {
      indexEl = deck.querySelector('[data-reel-index]');
      totalEl = deck.querySelector('[data-reel-total]');
      labelEl = deck.querySelector('[data-reel-label]');
      playBtn = deck.querySelector('.reel-btn--play');
      var dotsWrap = deck.querySelector('[data-reel-dots]');
      if (totalEl) totalEl.textContent = String(cards.length).padStart(2, '0');

      dots = cards.map(function (c, i) {
        var isEmpty = c.classList.contains('card--empty');
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'reel-dot' + (isEmpty ? ' reel-dot--empty' : '');
        var t = c.querySelector('h3');
        dot.setAttribute('aria-label', t ? t.textContent : 'Projekt ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); setPlaying(false); });
        dotsWrap.appendChild(dot);
        return dot;
      });

      deck.querySelector('.reel-btn--prev').addEventListener('click', function () { goTo(current - 1); setPlaying(false); });
      deck.querySelector('.reel-btn--next').addEventListener('click', function () { goTo(current + 1); setPlaying(false); });
      if (playBtn) playBtn.addEventListener('click', function () { setPlaying(!playing); });
      setPlaying(!reduce);

      cards.forEach(function (c) {
        c.addEventListener('pointerenter', stopTimer);
        c.addEventListener('pointerleave', function () { if (playing) startTimer(); });
        c.addEventListener('focusin', stopTimer);
        c.addEventListener('focusout', function () { if (playing) startTimer(); });
      });
    }

    /* --- Sichtbarkeit: außerhalb des Bildschirms nichts rechnen, nichts
           abspielen. Spart Akku und Bandbreite auf langen Seiten. --- */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (!visible) { stopTimer(); } else if (playing) { startTimer(); }
        syncPreview();
      }, { threshold: 0.05 }).observe(stage);
    }

    window.addEventListener('resize', function () { measure(); render(); });
    if ('ResizeObserver' in window) {
      var lastW = 0;
      new ResizeObserver(function () {
        var w = cards[0].offsetWidth;
        if (w === lastW) return;
        lastW = w; measure(); render();
      }).observe(cards[0]);
    }
    window.addEventListener('load', function () { measure(); render(); });

    measure();
    render();
    updateActive();
    window.requestAnimationFrame(frame);
  });

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
