# CLAUDE.md — Kontext für dieses Projekt

Dieses Dokument wird von Claude Code am Anfang jeder Session automatisch gelesen.
Es fasst zusammen, was in einer vorherigen Planungssession (mit Claude im Chat, ohne
Code-Ausführung) bereits erarbeitet wurde. **Nichts davon ist in Stein gemeißelt** —
siehe Abschnitt "Was offen ist" ganz unten.

---

## 1. Wer der Nutzer ist

Videograf und Fotograf, 10+ Jahre Produktionserfahrung: Fashion, Beauty, Events,
Markenarbeit. Lebt jetzt in Deutschland und baut ein Business auf, das klassische
Kameraproduktion mit generativen KI-Workflows kombiniert.

**Priorität: schnell Umsatz.** Kein Portfolio-Projekt zum Vorzeigen — ein Werkzeug,
das in den nächsten 90 Tagen zahlende Kunden bringt.

Kommuniziert im Chat auf Russisch. Kundmaterial (Website, Angebote) auf Deutsch und
Englisch, da der Zielmarkt Deutschland/Europa ist.

Zwei Umsatz-Spuren, die parallel bedient werden sollen:
- **Fashion & Beauty** — stärkstes Portfolio, dient dem Ruf/der Positionierung
- **Lokales Business** (Praxen, Restaurants, Handwerk, Mittelstand) — schnellerer,
  kürzerer Verkaufszyklus, Cashflow

## 2. Was bereits gebaut wurde (v1)

Im Ordner `site-v1/` liegt eine vollständige, lauffähige statische Website:
18 Seiten (9 DE, 9 EN), reines HTML/CSS/JS ohne Build-Tool, ohne Framework, ohne
externe Requests (kein Google Fonts, kein Tracking, keine Embeds).

**Wichtig: das ist ein v1-Entwurf aus einem einzigen Durchlauf**, nicht das Ergebnis
eines vollen Design-Prozesses mit Bildschirmfotos, Selbstkritik und Iteration. Wenn
`frontend-design` sauber angewendet wird — Brainstorm, Kritik, zweiter Durchgang —
kann und soll dabei etwas Besseres herauskommen. v1 ist Referenzmaterial und
Startpunkt für das Interview, keine Vorgabe, die verteidigt werden muss.

### Positionierung (im Gespräch erarbeitet, testen und challengen erlaubt)
> **Gedreht, wo es echt sein muss. Erzeugt, wo es unmöglich ist.**

Kernaussage: Der Kunde muss nicht wissen, ob sein Projekt gefilmt, generiert oder
hybrid produziert werden soll. Er beschreibt das Ziel, die Produktionsmethode wählt
das Studio.

### Design-Idee (v1, zur Diskussion)
Farbtemperatur als durchgängige Metapher:
- **Warm** `#FF9E4D` = real gedreht
- **Kalt** `#7B61FF` = generativ erzeugt

Die Farbe ist nie Dekoration — sie zeigt immer, wie ein Bild entstanden ist. Das
dient gleichzeitig als Designsprache *und* als Basis für die gesetzlich
vorgeschriebene KI-Kennzeichnung (siehe Abschnitt 4). Dunkles Theme, Hintergrund
`#0B0B0D`, Text `#EDEAE4`. Signature-Element: ein per Drag bedienbarer REAL⇄KI-
Vergleichsregler.

Das ist **eine** mögliche Richtung, keine beschlossene. Im Interview prüfen, ob sie
trägt oder ob eine andere visuelle Identität besser zum Nutzer passt — siehe
`frontend-design`-Skill, insbesondere den Abschnitt zu generischen AI-Design-Defaults,
die es zu vermeiden gilt.

### Struktur v1
Home / Leistungen (4 Pakete: Fashion&Beauty, Marken-/Imagefilm, Produkt&Werbung,
Content-System) / Arbeiten (Case Studies: Aufgabe–Ansatz–Ergebnis) / Labor
(Experimente) / Über mich / Kontakt (Formular via mailto, kein Server) / Impressum /
Datenschutz / Barrierefreiheit.

## 3. Geschäftsstrategie (siehe `STRATEGIE.md`)

Kurzfassung: Der Sale kommt in den ersten 90 Tagen über Outbound, nicht über die
Website allein — die Website ist der Konverter, nicht die Quelle. Geplant: 100 kalte,
personalisierte Kontakte in Monat 1, Fokus auf Recruiting-Filme für lokale Praxen
(kurzer Entscheidungszyklus) und direkten Fashion-Kontakt vor Ort. Preise in `STRATEGIE.md`
sind Marktschätzungen, keine geprüften Zahlen — mit dem Nutzer abgleichen.

Diese Strategie beeinflusst die Website: Preise sichtbar mit "ab" als Filter,
Content-Partnerschaft/Retainer als Ziel-Angebot, keine übertriebenen Werbeaussagen
(UWG-Risiko).

## 4. Rechtlicher Rahmen — nicht verhandelbar, immer aktiv mitdenken

Zielmarkt Deutschland → **`de-website-compliance`-Skill bei jeder Änderung an der
Website anwenden**, nicht nur einmal am Anfang. Kernpunkte, die v1 bereits umsetzt
und die bei jeder Weiterentwicklung erhalten bleiben müssen:

- Keine Cookies, kein Tracking, keine externen Ressourcen (Fonts/CDN/Embeds) →
  dadurch ist **kein Cookie-Banner nötig** (§ 25 TDDDG). Sobald Analytics, Pixel oder
  ein Font von einem CDN dazukommt, kippt das — vorher mit dem Nutzer abstimmen.
- Impressum (§ 5 DDG), Datenschutzerklärung (Art. 13 DSGVO), Barrierefreiheits-
  erklärung (BFSG) als eigene Seiten, verlinkt von jeder Seite.
- **KI-Kennzeichnung nach Art. 50 KI-VO** (seit 02.08.2026 in Kraft): fotorealistische
  KI-generierte oder KI-erweiterte Inhalte müssen sichtbar am Bild markiert werden.
  Im v1-Designsystem sind dafür `.badge-ki` / `.badge-real` vorgesehen.
- WCAG 2.1 AA: Kontrast, Tastaturbedienbarkeit, Fokus-Sichtbarkeit,
  `prefers-reduced-motion`, Alt-Texte, Formular-Labels.
- Model Releases für alle erkennbaren Personen im Portfolio (§ 22 KUG) — Vorlage in
  `compliance/Model-Release.md`. Größtes rechtliches Risiko im Fashion/Beauty-Bereich.
- Musiklizenzen für jedes Showreel-Video, GEMA prüfen.
- Keine unbelegten Werbeaussagen, kein "Nr. 1", keine Erfolgsgarantien (UWG).

Vollständiger Stand: `compliance/COMPLIANCE.md` (Blocker-Liste, Lizenzregister in
`compliance/LIZENZEN.md`).

## 5. Verfügbare Skills — bewusst in dieser Reihenfolge einsetzen

1. **`discovery-interviewing`** — zuerst. Bevor irgendetwas gebaut oder v1 verändert
   wird, den Nutzer strukturiert befragen (siehe `START-PROMPT.md` für den genauen
   Ablauf, den er sich wünscht).
2. **`specifying-features`** — aus den Interview-Antworten eine klare Spezifikation
   ableiten: Seiten, Inhalte, Umfang, Abgrenzung.
3. **`architecting-software`** — nur falls über den heutigen Stand (statisches HTML)
   hinausgegangen wird (z. B. eigenes CMS, Buchungssystem, Framework). Für eine
   reine Marketing-Website vermutlich nicht nötig — Tradeoffs aber offen benennen.
4. **`frontend-design`** — voller Prozess: Brainstorm, Tokens, Kritik, erst dann
   Code. v1 als Ausgangspunkt nehmen, nicht als Ziel.
5. **`building-web-uis`** — mobile-first, Performance, Accessibility beim Bauen.
6. **`de-website-compliance`** — durchgehend, siehe Abschnitt 4.
7. **`securing-web-apps`** — Formular, evtl. spätere Backend-Anbindung absichern.
8. **`karpathy-guidelines`** — chirurgische, nachvollziehbare Änderungen statt
   Überkomplizierung.
9. **`git-committing`** — saubere Commits, sobald ein Repo initialisiert ist.
10. **`packaging-web-apps`** — erst relevant, falls die Website später als App
    verpackt werden soll (aktuell nicht geplant).

## 6. Was offen ist — im Interview klären, nicht annehmen

- Echter Name, Stadt, Kontaktdaten, Instagram-Link (in v1 nur Platzhalter:
  `{{NAME}}`, `{{STADT}}`, `{{MAIL}}` usw. — siehe `site-v1/START-HIER.md` für die
  vollständige Liste)
- Ob die Farbtemperatur-Designsprache (warm=real/kalt=KI) beibehalten oder eine
  andere visuelle Richtung entwickelt werden soll
- Ob ein Framework (Next.js o. ä.) einen echten Vorteil brächte oder ob statisches
  HTML weiterhin die richtige Wahl ist (Nutzer wollte explizit *wenig* Pflegeaufwand)
- Echtes Portfoliomaterial: welche Bilder/Videos wirklich verfügbar sind, welche
  Personen bereits eine Einwilligung haben
- Rechtsform, USt-Status (Kleinunternehmer §19 UStG oder nicht), Hosting-Anbieter
- Ob Analytics/Tracking gewünscht ist (verändert die rechtliche Lage grundlegend,
  siehe Abschnitt 4)
- Tonalität: v1 ist nüchtern-editoriell; ob das trifft oder zu kühl wirkt

## 7. Sprachregel für diese Session

Der Nutzer spricht Russisch im Chat. Rückfragen und Erklärungen auf Russisch,
Website-Inhalte auf Deutsch/Englisch.
