# ROADMAP.md — Post-v1 Erweiterungen

Entscheidungen, die bewusst auf v2 verschoben wurden, damit sie nicht verloren gehen
und nicht neu verhandelt werden müssen. v1-Scope bleibt unberührt (siehe `CLAUDE.md`).

---

## Signature Moment: WebGL Real↔KI-Übergang

**Status:** v2, nicht v1. Entschieden am 2026-08-22 (Session mit Claude Code).

### Warum verschoben
- v1 ist Priorität #1: schnell live, 90-Tage-Outbound-Fenster nicht blockieren.
- Realistischer Aufwand: 3–6 fokussierte Tage (Szene, Asset-Loading, Scroll-
  Choreografie, Mobile-Perf-Pass, reduced-motion-Fallback, Test im Instagram-WebView).
- Design-System (warm/kalt-Farbsprache) ist zum Zeitpunkt der Entscheidung noch nicht
  final — Signature Moment sollte darauf aufbauen, nicht davor entstehen.
- v1 deckt dieselbe Metapher bereits günstiger ab: CSS/JS Drag-Slider Real⇄KI
  (kein Build-Step, keine neuen Dependencies).

### Wenn es gebaut wird — technische Leitplanken (jetzt festhalten, später nicht neu diskutieren)

**Stack:** Vanilla Three.js (nicht React Three Fiber — kein React-Runtime für eine
einzelne Komponente), GSAP ScrollTrigger (seit 2025 lizenzfrei, vor Start verifizieren),
Lenis für Smooth Scroll. Alle drei als npm-Pakete, lokal gebündelt (Vite) — **kein CDN**,
sonst kippt die Cookie-Banner-Freiheit (§25 TDDDG, siehe `de-website-compliance`).

**Scope-Isolation:** Nur die Homepage bekommt den Build-Step. Die anderen 17 Seiten
bleiben statisches HTML/CSS/JS ohne Änderung — kein Full-Site-Rewrite auf ein Framework.
3D-Modul wird lazy-loaded, nur wenn die Sektion in den Viewport scrollt.

**Mobile Performance (Instagram-WebView ist die Mehrheit des Traffics):**
- DPR auf ~1.5–2 gecappt, kein Postprocessing (Bloom/DOF).
- Feature-Detection vor dem Laden: `navigator.deviceMemory`, `connection.saveData`,
  WebGL-Verfügbarkeit → bei Negativ-Fall kein Szene-Laden.
- WebGL-Context-Loss-Handling beim App-Wechsel/Backgrounding (bekannter Instagram-
  WebView-Bug).

**Fallback (Entscheidung: CSS-Crossfade, nicht statisches Bild):**
Bei `prefers-reduced-motion: reduce`, fehlendem WebGL oder Low-End-Gerät: derselbe
warm→kalt-Übergang als reiner CSS-Crossfade, keine Animation bei reduced-motion.
Canvas ist `aria-hidden`, alle Inhalte parallel im echten DOM für Screenreader.

**Bonus:** Der Übergang kann gleichzeitig die gesetzlich vorgeschriebene
KI-Kennzeichnung (Art. 50 KI-VO) sein, statt eines separaten Badges — Compliance
und Signature Moment als ein Element denken, nicht zwei.

**Deploy:** GitHub Actions Workflow (`.github/workflows/pages.yml`) muss um
`npm ci && npm run build` erweitert werden, bevor `upload-pages-artifact` läuft.
Host bleibt GitHub Pages — kein Grund, für dieses eine Modul auf Render zu wechseln.

---

## Was offen bleibt
- Ob Fashion/Beauty-Kunden den Signature Moment tatsächlich als Kaufargument nennen,
  zeigt sich erst nach den ersten Outbound-Gesprächen — Priorität für v2 danach neu
  bewerten, nicht vorab annehmen.
