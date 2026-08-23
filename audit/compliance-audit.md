# Compliance-Audit — site-v1 (18 Seiten, DE/EN)

Datum: 22.08.2026. Geprüft: gesamter Quellcode unter `site-v1/`.
**Das ist keine Rechtsberatung.** Finale Rechtstexte über lizenzierten Generator
(eRecht24 / IT-Recht-Kanzlei) oder Anwältin freigeben lassen, siehe `todo`-Hinweise
im Code selbst.

Legende: **Blocker** = darf nicht live gehen · **Major** = Risiko, vor Launch klären
· **Minor** = sollte behoben werden, kein Launch-Stopper.

---

## 1. Impressum (§ 5 DDG)

Status: ⚠️ Struktur korrekt, Inhalt fehlt bewusst (Platzhalter) — **das ist erwartet,
kein neuer Fund**.

- `impressum.html:46-57`, `en/imprint.html:46-52` — alle Pflichtfelder (Name, Anschrift,
  Rechtsform, Kontakt, USt) als `{{...}}`-Platzhalter vorhanden, Struktur vollständig.
- Kein `§ 5 TMG`, keine OS-Plattform-Verlinkung — korrekt entfernt/nie vorhanden.
- `§ 36 VSBG`-Hinweis vorhanden (`impressum.html:59-61`).
- **Blocker (bekannt, nicht neu):** `{{NAME_VOLL}}`, `{{STRASSE}}`, `{{PLZ}}`, `{{STADT}}`,
  `{{TEL_RAW}}`, `{{MAIL}}`, `{{RECHTSFORM}}`, `{{USTID}}` müssen vor Livegang ersetzt und
  von lizenziertem Generator/Anwältin geprüft werden.
- **Major:** `impressum.html:56` — Hinweistext zu USt-IdNr. sagt korrekt, dass der Absatz
  bei Kleinunternehmer zu ersetzen ist mit „Gemäß § 19 UStG wird keine Umsatzsteuer
  berechnet." **Das ist noch nicht final entschieden** — hängt an derselben offenen
  Frage wie Punkt 6 unten (Kleinunternehmer ja/nein noch nicht mit Nutzer geklärt).

## 2. Datenschutzerklärung (Art. 13 DSGVO)

Status: ⚠️ Struktur inhaltlich sehr vollständig, Platzhalter erwartet.

- `datenschutz.html` / `en/privacy.html` decken ab: Verantwortlicher, keine
  Cookies/Tracking (§25 TDDDG), Hosting/Logfiles, Kontaktaufnahme, Formular (client-side
  mailto, keine Serverübertragung — korrekt beschrieben und **stimmt mit dem Code
  überein**, siehe Abschnitt 4), Social-Media-Links, Aufnahmen von Personen (§22 KUG),
  KI-generierte Inhalte, Betroffenenrechte inkl. **explizitem Art. 21-Absatz**
  (`datenschutz.html:107-111`), Beschwerderecht mit Aufsichtsbehörde-Platzhalter.
- **Blocker (bekannt):** `{{HOSTER}}`, `{{HOSTER_ANSCHRIFT}}`, `{{LOG_TAGE}}`,
  `{{BUNDESLAND}}`, `{{AUFSICHTSBEHOERDE}}`, `{{SOCIAL_LISTE}}` fehlen — ohne Hoster-Angabe
  keine gültige Datenschutzerklärung.
- **Minor:** Datenschutzbeauftragter-Satz (`datenschutz.html:50`) unterstellt bereits,
  dass keine Bestellpflicht besteht — das ist nur korrekt, wenn tatsächlich < 20 Personen
  mit Datenverarbeitung betraut sind. Bei Solo-Selbstständigem plausibel, aber vor
  Livegang bestätigen, nicht automatisch übernehmen.

## 3. Barrierefreiheitserklärung (BFSG) + WCAG 2.1 AA im Code

Status: ✅ technisch überwiegend sauber, ⚠️ Erklärungstext mit Platzhaltern.

Verifiziert im Code (nicht nur behauptet):
- Sichtbarer Fokus global: `assets/css/site.css:56` `:focus-visible{outline:2px solid var(--real)...}`.
- Skip-Link vorhanden und funktional (`.skip`, alle Seiten).
- `prefers-reduced-motion` global behandelt: `assets/css/site.css:492-499` — Animationen,
  Transitions, Marquee, **und der neue Scroll-Video-Hintergrund** werden bei reduzierter
  Bewegung deaktiviert (`body.page--video-bg .bg-video{display:none}` + JS-Check
  `assets/js/site.js:84` `!reduce`). Sauber verdrahtet.
- Formular: alle Felder mit `<label for>` verknüpft, Fieldset/Legend für Radio-/Checkbox-
  Gruppen (`kontakt.html:60-93`), Consent-Checkbox verlinkt auf Datenschutz.
- `lang="de"` / `lang="en"` korrekt pro Seite gesetzt.
- Kein Autoplay mit Ton; Video ist `muted`.

Offene Punkte:
- `barrierefreiheit.html:60` / `en/accessibility.html:50` — `{{EINSCHRAENKUNGEN}}`,
  `{{MARKTUEBERWACHUNG}}` als Platzhalter, erwartet, aber **Blocker** vor Launch.
- **Major — Kontrast des neuen KI-Badges auf Video-Hintergrund nicht verifizierbar per
  Code-Review:** `.bg-video-badge` (`assets/css/site.css:249-253,309`) hat Text `#7B61FF`
  auf `rgba(11,11,13,.82)` — das ergibt bei rein schwarzem Hintergrund ca. 4,5:1
  (Grenzwert), aber der Hintergrund ist ein **abspielendes Video mit wechselnden,
  teils hellen Frames durchscheinend bei 82% Deckkraft**, nicht garantiert dunkel.
  Kontrast kann pro Frame unter 4,5:1 fallen → WCAG 1.4.3 kann an einzelnen Scrollpunkten
  verletzt sein. Braucht visuelle Prüfung über die volle Scroll-Strecke, nicht nur
  Code-Review; ggf. Badge-Hintergrund auf volle Deckkraft setzen.
- **Minor:** `.wrap.veil` Overlay (`site.css:311`) dimmt Text-Sektionen ausreichend ab,
  gut gelöst für Fließtext-Kontrast — aber gilt nicht für den Badge selbst (eigener,
  kleinerer Backdrop).

## 4. § 25 TDDDG — „keine Cookies/kein Tracking" auf Faktizität geprüft

Status: ✅ **Behauptung stimmt mit dem Code überein**, geprüft per grep über den
gesamten Quellbaum:

- Keine `fetch(`/`XMLHttpRequest`-Aufrufe im gesamten JS.
- Keine externen `http(s)://`-Referenzen in HTML/CSS/JS außer der (harmlosen,
  nicht ladenden) Schema-URL `sitemaps.org/schemas/...` im Sitemap-Namespace und dem
  Regex-Pattern in `.htaccess:4` (HTTPS-Redirect, kein externer Request).
- Keine `preconnect`/`dns-prefetch`-Hints.
- Keine `@font-face`/`@import`/externen `url()` in `assets/css/site.css` — Schriften
  sind Systemschriften (`--display`/`--body`: `"Helvetica Neue", Helvetica, Inter,
  "Segoe UI", Arial, sans-serif` — reine Fallback-Kette, kein Webfont-Download).
- Kontaktformular sendet clientseitig per `mailto:`-Draft, kein POST an eigenen/fremden
  Server (`kontakt.html:97`, JS baut `mailto:`-Link zusammen) — Datenschutztext
  (Abschnitt 5 in `datenschutz.html`) beschreibt das korrekt, keine Lücke zwischen
  Text und Code.
- **Fazit: Cookie-Banner-Verzicht ist aktuell sachlich gedeckt.** Muss bei jeder
  zukünftigen Änderung (Analytics, Font-CDN, Embed) neu geprüft werden — nicht nur
  einmalig.

## 5. KI-Kennzeichnung (Art. 50 KI-VO)

### 5a. Bestehender Mechanismus (`.badge-ki` / `.badge-real`)
Funktioniert korrekt auf `index.html`, `arbeiten.html`, `labor.html` und EN-Pendants
für die dort vorhandenen Platzhalter-Medienkarten (`card-ph">MEDIA`).

### 5b. **Blocker — `.badge-hy` ist nicht gestylt**
`grep` bestätigt: Klasse `badge-hy` wird in **10 Instanzen über 5 Dateien**
(`arbeiten.html:47,51`; `index.html:138,142`; `labor.html:56`; `en/work.html:47,51`;
`en/index.html:124,128`; `en/lab.html:56`) verwendet — **es existiert keine einzige
CSS-Regel `.badge-hy` in `assets/css/site.css`.** Ohne `position:absolute` (wie bei
`.badge-ki`/`.badge-real`) rendert das Element als unpositionierter Inline-Text statt
als sichtbares Label direkt auf dem Bild/Video. Das bricht den technischen Mechanismus,
auf dem Art. 50 KI-VO-Konformität hier beruht.

### 5c. **Blocker — Label-Text bei Hybrid-Content ist irreführend**
Alle `.badge-hy`-Elemente tragen den Text **„Real gedreht"** — auch auf der
englischsprachigen Seite (`en/work.html:47` etc., unübersetzt). Das steht im
Widerspruch zur eigenen Case-Study-Beschreibung: `arbeiten.html:66` beschreibt exakt
dieses erste Projekt als „Die Umgebung wurde anschließend generativ ergänzt" und taggt
es explizit `<li>Hybrid</li>` (`arbeiten.html:63`). Ein Werk, das laut eigenem Text
KI-generativ erweitert wurde, mit „Real gedreht" zu labeln:
- verfehlt die Sichtbarkeits-Pflicht aus Art. 50 KI-VO für den KI-Anteil,
- ist zusätzlich ein eigenständiges UWG-Irreführungsrisiko (§ 5 UWG) — es wird
  wahrheitswidrig „nur real" behauptet.
- **Handlungsbedarf:** eigene Badge-Variante für Hybrid (Text z. B. „Real + KI" oder
  „Hybrid", eigene CSS-Regel analog `.badge-ki`) statt Wiederverwendung von
  „Real gedreht".

### 5d. Neues Element: Scroll-Video-Hintergrund `leistungen.html`
- Badge vorhanden: `leistungen.html:31` `<span class="badge-ki bg-video-badge">
  KI-generiert</span>`, CSS `bg-video-badge{position:fixed; left:16px; bottom:16px;
  z-index:2}` (`site.css:309`).
- **Positiv:** `position:fixed` hält den Badge während der gesamten Scrollstrecke sichtbar
  (nicht nur im Header-Bereich) — passt zum Zweck, weil das Video über die komplette
  Seite als Hintergrund läuft (`site.css:294-299` Kommentar bestätigt: ganze Seite, nicht
  nur Hero).
- **Major (offene Sachfrage, nicht im Code lösbar):** Ist das Hintergrundvideo
  vollständig KI-generiert oder ein Hybrid aus echtem und generiertem Material?
  `compliance/LIZENZEN.md:11` listet „KI-Kadres" nur generisch, `leistungen-bg.mp4`
  selbst ist nicht im Lizenzregister erfasst. Falls das Video (auch nur teilweise)
  reales Filmmaterial enthält, ist ein pauschaler „KI-generiert"-Badge für die gesamte
  Seite ungenau — entweder Video vollständig KI, oder differenzierte Kennzeichnung
  nötig. **PLACEHOLDER — vom Nutzer klären, was tatsächlich im Video steckt, und Eintrag
  in `LIZENZEN.md` nachtragen.**
- **Major — mobile Sichtbarkeit nicht verifiziert:** Fixed-Position-Badge bei `left:16px;
  bottom:16px` wurde nicht gegen mobile Viewports mit Software-Tastatur, Safari-Bottom-Bar
  oder das mobile Burger-Drawer (`site.css:157`, `position:fixed; z-index:99`) getestet.
  Das Drawer deckt im geöffneten Zustand ohnehin den ganzen Screen ab (unproblematisch,
  da Overlay-Zustand), aber die reale Lesbarkeit/Größe (`font-size:.6rem` ≈ 9,6px) auf
  kleinen Phones sollte visuell geprüft werden, nicht nur am Desktop.

## 6. Preis-/USt-Formulierung `leistungen.html` — **Fix ist NICHT angewendet**

Bestätigt am aktuellen Dateistand:

- `leistungen.html:86,88,90,92` — alle vier Preise tragen weiterhin `<small>netto, ...</small>`.
- `leistungen.html:93` — Fließtext lautet weiterhin **„Richtwerte, netto zzgl.
  gesetzlicher Umsatzsteuer."**
- `en/services.html:86` — **derselbe Fehler auf der englischen Seite**: „Guide values,
  net, plus statutory VAT." (im Auftrag nur die DE-Seite genannt, aber der Fehler ist
  auf beiden Sprachversionen vorhanden).
- **Blocker:** Wenn der Nutzer Kleinunternehmer nach § 19 UStG ist (in `CLAUDE.md` §6
  als offene Frage vermerkt, noch nicht beantwortet), ist „zzgl. Umsatzsteuer" schlicht
  falsch — es wird keine USt ausgewiesen/berechnet. Korrekte Formulierung wäre laut
  Auftrag: „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet und ausgewiesen — die
  genannten Preise sind Endpreise", plus Streichung von „netto" aus allen vier
  Preisangaben. **Diese Änderung hängt an derselben ungeklärten Statusfrage wie
  Abschnitt 1 — Kleinunternehmer ja/nein muss zuerst geklärt werden, dann greift exakt
  eine der beiden Formulierungen, nicht beide gleichzeitig offen lassen.**

## 7. UWG / Werbeaussagen — 18 Seiten gegrept

- Keine Treffer für „Nr. 1", „Marktführer", „bester/beste", „garantiert", „100%",
  „einzigartig", „weltweit führend" außer einem False Positive: `ueber-mich.html:64`
  „Am besten fangen wir an" — umgangssprachliche Redewendung („let's get started"),
  kein Werbeversprechen, **kein Fund**.
- Keine erfundenen Bewertungen/Sterne; kein `aggregateRating` im JSON-LD
  (`index.html:23-38` geprüft) — korrekt zurückhaltend.
- Preise durchgehend mit „ab" eingeleitet (Filterlogik gemäß Strategie) — passt.
- **Minor/technisch, kein UWG-Fund aber Beweis-Genauigkeit:** CSP in `.htaccess:14`
  deklariert `style-src 'self'` **ohne** `'unsafe-inline'`, während **alle 18 Seiten**
  massiv `style="..."`-Inline-Attribute verwenden (z. B. `index.html`: 25 Treffer,
  `arbeiten.html`: 27 Treffer). In Browsern, die CSP strikt durchsetzen, werden diese
  Inline-Styles geblockt → Layout bricht. Das widerspricht der in `COMPLIANCE.md:29`
  behaupteten „✅ TLS / Security-Header konfiguriert". Kein Datenschutz-/UWG-Risiko,
  aber ein technischer Widerspruch zwischen Doku-Status und Ist-Zustand, der vor Launch
  behoben werden sollte (entweder Inline-Styles entfernen oder `style-src` anpassen).

## 8. Model Release — Website-Texte vs. Anforderung

- `datenschutz.html:92-96` (Abschnitt 7) referenziert korrekt § 22 KUG + Art. 6 Abs. 1
  lit. a DSGVO, beschreibt Widerrufsprozess — Text und Vorlage in
  `compliance/Model-Release.md` sind inhaltlich konsistent (gleiche Rechtsgrundlage,
  gleicher Widerrufsmechanismus).
- `leistungen.html` FAQ (Zeile 94) „Wenn Personen erkennbar zu sehen sind, hole ich vor
  der Veröffentlichung schriftliche Einwilligungen ein" — deckt sich mit der Vorlage.
- Kein Fund von Diskrepanz zwischen Website-Aussage und Model-Release-Dokument.
- **Weiterhin offen (nicht neu, siehe `LIZENZEN.md:8-11`):** Für kein einziges reales
  Bild/Video existiert bereits ein abgelegter Nachweis — Register ist noch leer/mit
  „???" markiert. Das ist ein Datenproblem, kein Website-Code-Problem, bleibt Blocker
  bis zur Erstproduktion.

---

## Zusammenfassung: Blocker (nicht live gehen ohne Behebung)

1. Alle `{{PLATZHALTER}}` in Impressum/Datenschutz/Barrierefreiheit (bekannt, erwartet).
2. **Neu:** `.badge-hy` hat keine CSS-Regel — Hybrid-Kennzeichnung ist technisch defekt
   auf 5 Dateien / 10 Stellen.
3. **Neu:** `.badge-hy`-Text „Real gedreht" widerspricht der eigenen Hybrid-Beschreibung
   im Case-Study-Text — Art. 50 KI-VO- und UWG-Risiko gleichzeitig.
4. Preis-/USt-Formulierung auf `leistungen.html` **und** `en/services.html` noch nicht
   korrigiert — hängt an ungeklärtem Kleinunternehmer-Status.
5. Musiklizenzen + Model Releases weiterhin offen (unverändert seit letzter Prüfung).
6. Sachfrage, ob `leistungen-bg.mp4` vollständig KI oder Hybrid ist — Lizenzregister-
   Eintrag fehlt.

## Major (vor Launch klären)

- Kontrast des `bg-video-badge` über die volle Videolänge nicht verifizierbar per Code —
  visuelle Prüfung nötig.
- CSP `style-src 'self'` vs. flächendeckende Inline-`style=`-Attribute — Widerspruch
  zwischen Doku-Status ✅ und Ist-Zustand.
- Mobile Sichtbarkeit/Lesbarkeit des fixierten KI-Badges nicht getestet.

## Was noch von Nutzer/Anwalt gebraucht wird

- Kleinunternehmer §19 UStG ja/nein (entscheidet Impressum-Absatz UND Preistext
  gleichzeitig).
- Hoster-Name/Anschrift, Bundesland, zuständige Aufsichtsbehörde, Log-Speicherdauer.
- Faktische Zusammensetzung von `leistungen-bg.mp4` (rein KI oder Hybrid).
- Reale Bild-/Videodateien + zugehörige Lizenz-/Einwilligungsnachweise (noch keine
  vorhanden).

Nächste Prüfung: bei jeder inhaltlichen Änderung sowie spätestens in 6 Monaten
(22.02.2027).
