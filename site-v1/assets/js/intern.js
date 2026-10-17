/* Interner Bereich: entschlüsselt den Leitfaden im Browser.
   Das Repository ist öffentlich, deshalb liegt dort nur der verschlüsselte
   Text (PBKDF2-SHA256 → AES-256-GCM, siehe tools/private/encrypt-page.swift).
   Ohne den richtigen Code ist der Inhalt nicht lesbar. Es wird nichts
   gespeichert: kein Cookie, kein localStorage — nach dem Neuladen ist die
   Seite wieder gesperrt. */
(function () {
  'use strict';
  var form = document.getElementById('gate');
  if (!form || !window.crypto || !crypto.subtle) {
    if (form) {
      var m = document.getElementById('gate-msg');
      m.textContent = 'Dieser Browser unterstützt die Entschlüsselung nicht (HTTPS oder aktueller Browser nötig).';
      m.hidden = false;
    }
    return;
  }

  var input = document.getElementById('code');
  var go = document.getElementById('gate-go');
  var msg = document.getElementById('gate-msg');
  var vault = document.getElementById('vault');
  var DATA = 'assets/intern/leitfaden.enc.json';
  var IDLE_MS = 15 * 60 * 1000;
  var idleTimer = null;
  var pkgPromise = null;

  function b64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function norm(s) { return s.trim().toLowerCase().replace(/[\s-]+/g, ''); }
  function say(text) { msg.textContent = text; msg.hidden = !text; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function loadPackage() {
    if (!pkgPromise) {
      pkgPromise = fetch(DATA, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('load');
        return r.json();
      });
    }
    return pkgPromise;
  }

  function decrypt(code, pkg) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(norm(code)), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: b64(pkg.salt), iterations: pkg.iter, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      })
      .then(function (key) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(pkg.iv) }, key, b64(pkg.ct));
      })
      .then(function (buf) { return new TextDecoder().decode(buf); });
  }

  var h1 = document.querySelector('h1');

  function lock() {
    clearTimeout(idleTimer);
    h1.textContent = 'Anmelden';
    vault.hidden = true;
    vault.textContent = '';
    form.hidden = false;
    input.value = '';
    say('');
    input.focus();
  }

  function armIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(lock, IDLE_MS);
  }

  function show(html) {
    // Der Text ist authentifiziert (GCM) und stammt von uns — erst nach
    // erfolgreicher Entschlüsselung wird er eingesetzt.
    vault.innerHTML =
      '<div class="vault-bar"><p>Interner Leitfaden · Erstgespräch und Brief</p>' +
      '<button class="btn btn--ghost" type="button" id="lock">Sperren</button></div>' +
      '<div class="prose">' + html + '</div>';
    form.hidden = true;
    h1.textContent = 'Leitfaden';
    vault.hidden = false;
    document.getElementById('lock').addEventListener('click', lock);

    var tpl = document.getElementById('brief-template');
    if (tpl) {
      var row = document.createElement('div');
      row.className = 'copy-row';
      row.innerHTML = '<button class="btn" type="button" id="copy-brief">Brief kopieren</button><span></span>';
      tpl.insertAdjacentElement('afterend', row);
      var hint = row.querySelector('span');
      row.querySelector('button').addEventListener('click', function () {
        var done = function (t) { hint.textContent = t; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(tpl.textContent).then(
            function () { done('Kopiert.'); },
            function () { done('Nicht möglich — Text bitte von Hand markieren.'); });
        } else { done('Nicht möglich — Text bitte von Hand markieren.'); }
      });
    }
    ['pointerdown', 'keydown', 'scroll'].forEach(function (ev) {
      document.addEventListener(ev, armIdle, { passive: true });
    });
    armIdle();
    window.scrollTo(0, 0);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = input.value;
    if (!norm(code)) { say('Bitte Code eingeben.'); return; }
    go.disabled = true;
    say('Prüfe …');
    var started = Date.now();
    loadPackage()
      .then(function (pkg) { return decrypt(code, pkg); })
      .then(function (html) { say(''); show(html); input.value = ''; })
      .catch(function (err) {
        // Falscher Code und Ladefehler unterscheiden, aber nie verraten, wie nah man dran war.
        var text = err && err.message === 'load' ? 'Inhalt konnte nicht geladen werden.' : 'Code nicht korrekt.';
        // mindestens ~1 s Wartezeit pro Versuch bremst Probieren im Browser.
        return wait(Math.max(0, 1000 - (Date.now() - started))).then(function () { say(text); });
      })
      .then(function () { go.disabled = false; });
  });
})();
