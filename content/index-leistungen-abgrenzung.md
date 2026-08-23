# Abgrenzung Startseite ↔ Leistungen + Ton-Schärfung
Entwurf zur Freigabe · bezieht sich auf `site-v1/index.html` und `site-v1/leistungen.html` · Deutsch zuerst, EN folgt nach Freigabe

---

## 0. Entscheidung: Was passiert mit Leistungen / FAQ / Ablauf auf der Startseite

**Leistungen (4 Pakete):** bleibt auf der Startseite, aber nur als Kurzfassung —
4 Namen + 1 zugespitzter Satz je Paket, ohne Chips, ohne "Für wen". Das ist der
klassische Teaser-Fall: kurz genug, dass Google es nicht als Duplikat der
Leistungen-Seite wertet, lang genug, um zu verstehen, was angeboten wird.

**Ablauf (5 Schritte):** volle Fassung nur auf Leistungen. Auf der Startseite ersetzt
durch eine verdichtete 3-Phasen-Version (Gespräch/Angebot → Produktion → Übergabe)
mit eigener Formulierung, kein gekürztes Copy-Paste der 5 Schritte. Begründung:
Prozess-Vertrauen ist ein reales Conversion-Element auf der Startseite (viele
Besucher entscheiden hier, ob sie überhaupt zum Formular scrollen) — komplettes
Streichen wäre ein Verlust. Eine 1:1-Kurzfassung derselben 5 Überschriften wäre
aber echtes Duplicate Content. Die 3-Phasen-Version ist inhaltlich UND sprachlich
eine andere Einheit, keine Kürzung.

**FAQ (6 Fragen):** volle Fassung nur auf Leistungen. Auf der Startseite 3 Fragen,
die die häufigsten Vorbehalte vor dem ersten Klick abfangen (Preis, Echtheit/KI,
Dauer) — mit eigener Frage- und Antwortformulierung, nicht die gleichen Fragen in
kürzerer Antwort. Die restlichen 3 Fragen (Nutzungsrechte, Models/Location,
KI-Erkennung im Detail) gehören inhaltlich klarer zur Kaufentscheidungsphase auf
Leistungen und fallen auf der Startseite ganz weg.

Beide Kurzabschnitte enden mit einem Link auf die vollständige Fassung
(`leistungen.html#ablauf`, `leistungen.html#faq` — Anker beim Bau ergänzen).

---

## 1. STARTSEITE (index.html) — geänderte/neue Blöcke

### 1.1 Leistungen-Teaser (ersetzt aktuellen Block mit 4× vollem `svc`-Artikel)

```
Kicker: Leistungen
H2: Vier Wege, Sie sichtbar zu machen.

01 · Fashion & Beauty
Kampagnenfilm und Lookbook, gewachsen aus jahrelanger Arbeit mit Models und Labels.

02 · Marken- & Imagefilm
Ein Film, der zeigt, wer bei Ihnen wirklich arbeitet — kein Stockmaterial, keine Floskeln.

03 · Produkt & Werbung
Das Produkt real im Makro, die Umgebung so vielseitig, wie Ihre Kampagne es braucht.

04 · Content-System
Ein Drehtag pro Quartal, monatlich neue Schnitte für Social und Anzeigen.

→ Alle Leistungen im Detail (Link bleibt wie im bestehenden HTML)
```

Hinweis: Die vier Kurzsätze sind bewusst *keine* verkürzten Zitate der
Leistungen-Seite, sondern eigenständig formuliert — gleiche Fakten (Portfolio-
Erfahrung mit Models/Labels, kein Stock, Makro + generative Umgebung, ein Drehtag
pro Quartal), andere Sätze. Keine neuen Tatsachenbehauptungen gegenüber der
bestehenden v1-Fassung.

### 1.2 Ablauf-Kurzfassung (ersetzt aktuellen `<ol class="steps">`-Block mit 5 Punkten)

```
Kicker: Ablauf
H2: Von der Anfrage zur fertigen Datei.
Lede: Drei Phasen, ein schriftliches Angebot vor Beginn. Der vollständige Ablauf
mit allen fünf Schritten steht auf der Leistungen-Seite.

1. Gespräch & Angebot
Sie beschreiben das Ziel, ich sage innerhalb weniger Tage, wie es umsetzbar ist —
mit Preis, bevor Sie sich entscheiden müssen.

2. Produktion
Drehtag, generative Produktion oder beides. Kamera, Licht und Ton bringe ich mit.

3. Übergabe
Fertige Dateien in den Formaten, die Sie brauchen — meist innerhalb weniger Wochen.

→ Der vollständige Ablauf in fünf Schritten
```

### 1.3 FAQ-Kurzfassung (ersetzt aktuellen `<details>`-Block mit 6 Fragen)

```
Kicker: Bevor Sie schreiben
H2: Kurz vorab.

Weiß ich vorher, was es kostet?
Die Preisrahmen oben zeigen die Größenordnung. Das schriftliche Festpreisangebot
liegt vor, bevor irgendetwas beginnt.

Ist alles, was ich sehe, real gedreht?
Nicht alles — und das wird nicht versteckt. Generativ erzeugte Bilder sind direkt
am Bild gekennzeichnet, so schreibt es Artikel 50 der KI-Verordnung vor.

Wie schnell bekomme ich fertiges Material?
Ein Social-Paket meist innerhalb einer Woche nach dem Dreh, größere Projekte in
zwei bis vier Wochen bis zur Übergabe.

→ Weitere Fragen beantwortet die Leistungen-Seite
```

---

## 2. LEISTUNGEN.HTML — vollständige Version (bleibt Ort der Wahrheit)

### 2.1 Vier Leistungen — Struktur bleibt (Titel, Fließtext, Chips, "Für wen"),
Fließtexte an ein paar Stellen konkreter statt abstrakt (siehe Abschnitt 3, Punkt
"Konzept-Visualisierung"). Ansonsten bestehender Text aus v1 ist bereits
handwerklich konkret genug (Models, Stylisten, Visagisten, Makroqualität,
Packshots) — hier nicht künstlich aufblasen.

### 2.2 Ablauf — volle 5 Schritte, Formulierungen geschärft (Konzept /
Postproduktion waren die abstraktesten Stellen im ganzen Textkorpus):

```
Kicker: Ablauf
H2: So läuft ein Projekt.

1. Gespräch
20 Minuten. Sie sagen, was am Ende passieren soll. Ich sage, ob und wie ich das
löse — und was es kostet.

2. Konzept
Ein Moodboard mit Referenzbildern, eine Shotlist und ein Zeitplan: welche
Einstellung gedreht wird, welche generativ entsteht, wann Anlieferung ist. Erst
danach beginnt die Produktion.

3. Produktion
Drehtag, generative Produktion oder beides. Ich bringe Kamera, Licht und Ton mit;
Modelle, Location und Styling koordiniere ich auf Wunsch.

4. Postproduktion
Schnitt in der Timeline, Farbkorrektur Bild für Bild, Tonmischung, Retusche,
generative Erweiterung der Umgebung. Zwei Korrekturschleifen sind eingeplant.

5. Übergabe
Fertige Dateien in allen benötigten Formaten und Seitenverhältnissen, mit
Untertiteln, sofort einsetzbar.
```

Änderung gegenüber v1: Schritt 2 nennt jetzt konkrete Arbeitsergebnisse
(Moodboard, Shotlist, Zeitplan) statt des abstrakten Worts "ein Dokument".
Schritt 4 benennt die einzelnen Postproduktions-Handgriffe statt sie unter dem
Sammelbegriff "Postproduktion" zu bündeln. Keine neuen Fakten — nur konkretere
Beschreibung derselben Arbeitsschritte.

### 2.3 FAQ — volle 6 Fragen, eigenständig neu formuliert (nicht identisch zur
Startseiten-Kurzfassung, auch nicht identisch zur bisherigen v1-Fassung, die auf
beiden Seiten wortgleich stand):

```
Kicker: Häufige Fragen
H2: Kurz beantwortet.

Drehen Sie real oder entsteht alles am Rechner?
Beides, im Verhältnis, das das Projekt braucht. Menschen, Produkte, Räume und
alles, wo Vertrauen entsteht, nehme ich mit der Kamera auf. Umgebungen,
Kamerafahrten und Bildvarianten, die real zu teuer oder gar nicht drehbar wären,
entstehen generativ. Was generativ entstanden ist, wird gekennzeichnet.

Wie erkenne ich im fertigen Material, was KI ist?
An einer sichtbaren Markierung direkt am Bild. Artikel 50 der KI-Verordnung
schreibt das seit dem 2. August 2026 für fotorealistische, KI-generierte Inhalte
vor — ich halte mich daran, auch weil es die Glaubwürdigkeit Ihrer Kampagne
schützt.

Was kostet ein Film konkret?
Die Preisrahmen oben zeigen die Größenordnung. Den tatsächlichen Preis bestimmen
Drehzeit, Teamgröße, Anzahl der Endfassungen und die vereinbarten
Nutzungsrechte. Sie erhalten ein schriftliches Festpreisangebot, bevor die
Produktion beginnt.

Wie lange dauert ein Projekt von der Anfrage bis zur Datei?
Ein Social-Paket liefere ich in der Regel innerhalb einer Woche nach dem Dreh.
Marken- und Kampagnenfilme dauern von der ersten Anfrage bis zur Auslieferung
meist zwei bis vier Wochen.

Wem gehören die fertigen Aufnahmen?
Die vereinbarten Nutzungsrechte gehen nach vollständiger Zahlung an Sie über.
Umfang, Kanäle, Gebiet und Dauer der Nutzung stehen ausdrücklich im Angebot,
damit später keine Fragen offenbleiben.

Muss ich mich um Models oder Location kümmern?
Nicht zwingend — beides kann ich organisieren. Sind Personen erkennbar zu sehen,
hole ich vor der Veröffentlichung schriftliche Einwilligungen (Model Release)
ein.
```

Unterschiede zur bisherigen v1-Fassung: Fragen leicht umformuliert, letzte
Antwort nennt jetzt explizit den Fachbegriff "Model Release" (Anschluss an
`compliance/Model-Release.md`), keine neue inhaltliche Aussage.

---

## 3. Preis-Block — Umsatzsteuer-Formulierung korrigieren (beide Seiten)

Betrifft `index.html` (Zeile ~157–165) und `leistungen.html` (Zeile ~79–87),
identischer Block auf beiden Seiten — das ist unproblematisch (Preisangaben sind
keine Inhalte, bei denen Duplicate Content SEO-relevant wäre), aber die
Umsatzsteuer-Angabe ist aktuell sachlich falsch für einen Kleinunternehmer nach
§ 19 UStG.

**Jetzt (falsch für § 19 UStG):**
- `<small>netto, pro Drehtag</small>` / `<small>netto, pro Projekt</small>` /
  `<small>netto, monatlich</small>`
- Form-note: *"Richtwerte, netto zzgl. gesetzlicher Umsatzsteuer. …"*

Problem: "netto zzgl. USt" impliziert, dass zum Preis noch Umsatzsteuer
aufgeschlagen wird. Als Kleinunternehmer nach § 19 UStG wird gar keine
Umsatzsteuer berechnet und ausgewiesen — die genannte Zahl ist bereits der
Endpreis. "Netto" ist hier also nicht nur unpräzise, sondern schlicht falsch.

**Neu:**
- `<small>pro Drehtag</small>` / `<small>pro Projekt</small>` /
  `<small>monatlich</small>` — "netto" ersetzt bzw. gestrichen
- Form-note:
  > Richtwerte. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet und
  > ausgewiesen — die genannten Preise sind Endpreise. Der tatsächliche Preis
  > hängt von Umfang, Drehzeit, Team, Nutzungsrechten und Lieferfristen ab und
  > steht vor Beginn schriftlich im Angebot. Reise- und Übernachtungskosten
  > außerhalb von {{STADT}} nach Aufwand.

Diese Formulierung an beiden Fundstellen identisch einsetzen.

---

## 4. Genereller Ton-Durchgang — generische Stellen im ganzen Text (nicht nur
FAQ/Ablauf/Leistungen)

Gesamteindruck: Der Text ist bereits überwiegend konkret und in Ich-Form (gutes
Ausgangsmaterial). Folgende Stellen sind die abstraktesten im Korpus und lohnen
eine Schärfung:

| Fundstelle | Jetzt | Vorschlag | Warum |
|---|---|---|---|
| Ablauf, Schritt "Konzept" (beide Seiten) | *"Ein Dokument: Idee, Bildsprache, Ablauf, Drehtag oder Generierung, Liefertermine."* | *"Ein Moodboard mit Referenzbildern, eine Shotlist und ein Zeitplan …"* | "Ein Dokument" sagt nicht, was tatsächlich entsteht. Moodboard/Shotlist sind die realen Arbeitsmittel am Set. |
| Ablauf, Schritt "Postproduktion" (beide Seiten) | *"Schnitt, Farbe, Ton, Retusche, generative Erweiterungen."* | *"Schnitt in der Timeline, Farbkorrektur Bild für Bild, Tonmischung, Retusche, generative Erweiterung der Umgebung."* | Aufzählung von Substantiven wirkt wie eine Leistungsliste; ausformuliert wird sichtbar, dass jemand tatsächlich an der Timeline sitzt. |
| Generative Chips, Startseite + Leistungen: *"Konzept-Visualisierung"* | abstrakt, könnte jede Branche sein | *"Referenzbilder vor dem Dreh"* oder *"Look-Freigabe vor dem Dreh"* | "Konzept-Visualisierung" ist generisches Tech-Vokabular; "Referenzbilder vor dem Dreh" beschreibt den tatsächlichen Handgriff (Kunde sieht vorab, wie der Look aussehen wird). |
| Pillar "Mehr Varianten, gleiches Budget": *"andere Öffnung, anderer Schnitt, andere Formate"* | "Öffnung" ist im Kontext von Video-Ads unklar/mehrdeutig (Blende? Anfang?) | *"anderer Einstieg, anderer Schnitt, andere Formate — testbar in Anzeigen"* | "Einstieg" ist der branchenübliche Begriff für die ersten Sekunden eines Ads, die im Split-Testing variiert werden — konkreter und eindeutiger als "Öffnung". **Bitte bestätigen, ob "Öffnung" ursprünglich etwas anderes meinte** — ich wollte hier nicht ohne Rückfrage eine Bedeutung unterstellen. |
| Pillar "Ein Ansprechpartner": *"Konzept, Kamera, Licht, Schnitt, Farbe, Ton, KI."* | in einer Aufzählung von sehr konkreten Handwerksbegriffen ist "Konzept" das einzige abstrakte Wort | optional: *"Moodboard, Kamera, Licht, Schnitt, Farbe, Ton, KI."* | Konsistenz mit der Schärfung in Abschnitt 2.2 — dieselbe Konkretisierung durchgängig anwenden. |

Alles Übrige (Hero, Produktionsebenen-Grid, Compare-Slider-Text, Warum-ich-Kacheln,
Footer) ist bereits handwerklich konkret genug (Models, Stylisten, Makro,
Kran, Set-Extension, Reisekosten) und wurde nicht angetastet.

Keine der Änderungen in Abschnitt 3 und 4 führt eine neue Tatsachenbehauptung
ein — es sind ausschließlich Präzisierungen bereits vorhandener Aussagen bzw. eine
gesetzlich erforderliche Korrektur der USt-Formulierung. Keine neuen Platzhalter
nötig.
