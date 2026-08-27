#!/usr/bin/env python3
"""Erzeugt die Projektseiten aus content/projekte.json.

Ausführen aus dem Projektstamm:
    python3 tools/build-projects.py

Erzeugt:
    site-v1/projekte/<slug>.html
    site-v1/en/projects/<slug>.html
und ersetzt die Kartenliste zwischen den PROJEKTE-Markern in
site-v1/arbeiten.html und site-v1/en/work.html.

Keine Abhängigkeiten — nur Python-Standardbibliothek. Die Website bleibt
statisch: die erzeugten Dateien werden committet, der Build läuft nicht
beim Deploy.
"""

import datetime
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site-v1"
DATA = ROOT / "content" / "projekte.json"
TPL = ROOT / "tools" / "templates"

# Produktionsweise → sichtbare Kennzeichnung (Art. 50 KI-VO) je Sprache.
MODUS = {
    "real": {"css": "badge-real", "de": "Real gedreht", "en": "Shot for real"},
    "ki":   {"css": "badge-ki",   "de": "KI-generiert", "en": "AI-generated"},
    "hy":   {"css": "badge-hy",   "de": "Hybrid",       "en": "Hybrid"},
}

# Kundenname ist sprachneutral; nur der Platzhalter, wenn kein Name freigegeben
# ist, muss übersetzt werden — sonst steht Deutsch auf der englischen Seite.
KUNDE_OFFEN = {"de": "Auf Anfrage", "en": "On request"}

# Art des Projekts (compliance/PORTFOLIO-SPEZIFIKATION.md): englische Begriffe
# sind bewusst sprachneutral (Personal Project, Client Work, Spec Project,
# Selected Works, Personal Film Study) und werden unverändert in DE wie EN
# angezeigt. "typ" fehlt im Datensatz -> Default ist "Personal Project", weil
# ohne explizit gesetzten Kunden nichts anderes behauptet werden darf.
TYP_DEFAULT = "Personal Project"

# Seitenverhaeltnis-Klasse fuer den Media-Container. "landscape" ist die
# bisherige Groesse (16:9 auf der Projektseite, 4:5 in der Karte) und braucht
# deshalb keine eigene Klasse.
ORIENTATION_CLASS = {"landscape": "", "portrait": " proj-media--portrait",
                      "square": " proj-media--square"}
ORIENTATION_CARD_CLASS = {"landscape": "", "portrait": " card-media--portrait",
                           "square": " card-media--square"}

MARK_START = "<!-- PROJEKTE:START — erzeugt von tools/build-projects.py, nicht von Hand ändern -->"
MARK_END = "<!-- PROJEKTE:END -->"

SITEMAP_START = "  <!-- PROJEKTE:START -->"
SITEMAP_END = "  <!-- PROJEKTE:END -->"


def esc(value):
    """HTML-sicher escapen; None wird zu leerem String."""
    return html.escape(value or "", quote=True)


def hero_media(project, lang, depth):
    """Video wenn vorhanden, sonst Platzhalterfläche.

    depth ist das Pfad-Präfix zurück nach site-v1/ ('../' oder '../../').
    """
    placeholder = "MEDIA folgt" if lang == "de" else "MEDIA coming soon"
    video = project.get("video")
    if not video:
        return f'<div class="card-ph">{placeholder}</div>'
    poster = project.get("poster")
    poster_attr = f' poster="{depth}{esc(poster)}"' if poster else ""
    label = "Video abspielen" if lang == "de" else "Play video"
    return (
        f'<video controls playsinline preload="none"{poster_attr} aria-label="{label}">'
        f'<source src="{depth}{esc(video)}" type="video/mp4"></video>'
    )


def stills_block(project, depth, lang):
    """Stills-Reihe; leer lassen, solange kein Material vorhanden ist."""
    stills = project.get("stills") or []
    if not stills:
        return ""
    alt_base = project[lang]["titel"]
    items = []
    for i, src in enumerate(stills, 1):
        alt = esc(f"{alt_base} — {i}")
        items.append(
            f'<figure class="proj-still rv"><img src="{depth}{esc(src)}" alt="{alt}" '
            f'loading="lazy" decoding="async"></figure>'
        )
    return '<div class="proj-stills">' + "".join(items) + "</div>"


def build_page(project, nxt, lang, template):
    text = project[lang]
    depth = "../" if lang == "de" else "../../"
    modus = MODUS.get(project.get("mode", "real"), MODUS["real"])
    # Meta-Description aus der Aufgabe, auf Suchmaschinenlänge gekürzt.
    desc = text["aufgabe"]
    if len(desc) > 155:
        desc = desc[:152].rsplit(" ", 1)[0] + "…"

    values = {
        "SLUG": project["slug"],
        "TITEL": text["titel"],
        "KATEGORIE": text["kategorie"],
        "JAHR": project.get("jahr", ""),
        "KUNDE": project.get("kunde") or KUNDE_OFFEN[lang],
        "ROLLE": text.get("rolle", ""),
        "MODUS_LABEL": modus[lang],
        "TYP": project.get("typ") or TYP_DEFAULT,
        "AUFGABE": text["aufgabe"],
        "ANSATZ": text["ansatz"],
        "ERGEBNIS": text["ergebnis"],
        "BESCHREIBUNG": desc,
        "NEXT_SLUG": nxt["slug"],
        "NEXT_TITEL": nxt[lang]["titel"],
    }
    out = template
    for key, value in values.items():
        out = out.replace(f"%%{key}%%", esc(value))
    # Medienblöcke enthalten Markup, deshalb nach dem Escapen einsetzen.
    out = out.replace("%%HERO_MEDIA%%", hero_media(project, lang, depth))
    out = out.replace("%%STILLS%%", stills_block(project, depth, lang))
    ori = ORIENTATION_CLASS.get(project.get("orientation", "landscape"), "")
    out = out.replace('class="proj-media"', 'class="proj-media' + ori + '"')
    return out


def card(project, lang, prefix=""):
    """Karte für Übersicht und Startseite — verlinkt auf die eigene Projektseite."""
    text = project[lang]
    modus = MODUS.get(project.get("mode", "real"), MODUS["real"])
    href = (
        f'{prefix}projekte/{project["slug"]}.html' if lang == "de"
        else f'{prefix}projects/{project["slug"]}.html'
    )
    placeholder = "MEDIA" if not project.get("poster") else ""
    if project.get("poster"):
        depth = "" if lang == "de" else "../"
        alt = esc(text["titel"])
        media = (
            f'<img src="{depth}{esc(project["poster"])}" alt="{alt}" '
            f'loading="lazy" decoding="async">'
        )
    else:
        media = f'<div class="card-ph">{placeholder}</div>'
    ori_class = ORIENTATION_CARD_CLASS.get(project.get("orientation", "landscape"), "")
    typ = esc(project.get("typ") or TYP_DEFAULT)
    return (
        f'<a class="card rv" href="{href}">\n'
        f'  <div class="card-media{ori_class}">{media}'
        f'<span class="{modus["css"]}">{esc(modus[lang])}</span>'
        f'<span class="badge-type">{typ}</span></div>\n'
        f'  <div class="card-txt"><span class="svc-no">{esc(text["kategorie"])}</span>'
        f'<h3>{esc(text["titel"])}</h3>'
        f'<p>{esc(text["ergebnis"])}</p></div></a>'
    )


def sitemap_entries(published, domain):
    """Sitemap-Einträge für alle veröffentlichten Projekte, beide Sprachen."""
    out = []
    for p in published:
        de = f"{domain}/projekte/{p['slug']}.html"
        en = f"{domain}/en/projects/{p['slug']}.html"
        for loc in (de, en):
            out.append(
                "  <url>\n"
                f"    <loc>{loc}</loc>\n"
                f'    <xhtml:link rel="alternate" hreflang="de" href="{de}"/>\n'
                f'    <xhtml:link rel="alternate" hreflang="en" href="{en}"/>\n'
                f"    <lastmod>{datetime.date.today().isoformat()}</lastmod>\n"
                "    <priority>0.8</priority>\n"
                "  </url>"
            )
    return "\n".join(out)


def update_sitemap(published, domain):
    path = SITE / "sitemap.xml"
    source = path.read_text(encoding="utf-8")
    block = f"{SITEMAP_START}\n{sitemap_entries(published, domain)}\n{SITEMAP_END}"
    if SITEMAP_START in source and SITEMAP_END in source:
        pattern = re.compile(
            re.escape(SITEMAP_START) + ".*?" + re.escape(SITEMAP_END), re.DOTALL
        )
        source = pattern.sub(block, source)
    else:
        # Marker beim ersten Lauf direkt vor </urlset> einsetzen.
        source = source.replace("</urlset>", f"{block}\n</urlset>")
    path.write_text(source, encoding="utf-8")


def replace_between_markers(path, block):
    """Ersetzt nur den Bereich zwischen den Markern; alles andere bleibt."""
    source = path.read_text(encoding="utf-8")
    if MARK_START not in source or MARK_END not in source:
        sys.exit(
            f"FEHLER: Marker fehlen in {path.relative_to(ROOT)}.\n"
            f"Erwartet:\n  {MARK_START}\n  ... Karten ...\n  {MARK_END}"
        )
    pattern = re.compile(
        re.escape(MARK_START) + ".*?" + re.escape(MARK_END), re.DOTALL
    )
    path.write_text(
        pattern.sub(f"{MARK_START}\n{block}\n{MARK_END}", source), encoding="utf-8"
    )


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    published = [p for p in data["projekte"] if not p.get("draft")]
    if not published:
        sys.exit("FEHLER: kein einziges Projekt mit draft:false — nichts zu erzeugen.")

    templates = {
        "de": (TPL / "projekt.de.html").read_text(encoding="utf-8"),
        "en": (TPL / "projekt.en.html").read_text(encoding="utf-8"),
    }
    targets = {"de": SITE / "projekte", "en": SITE / "en" / "projects"}
    for folder in targets.values():
        folder.mkdir(parents=True, exist_ok=True)

    written = 0
    for i, project in enumerate(published):
        nxt = published[(i + 1) % len(published)]  # letztes Projekt → wieder erstes
        for lang, folder in targets.items():
            page = build_page(project, nxt, lang, templates[lang])
            (folder / f'{project["slug"]}.html').write_text(page, encoding="utf-8")
            written += 1

    for lang, page in (("de", SITE / "arbeiten.html"), ("en", SITE / "en" / "work.html")):
        block = "\n".join(card(p, lang) for p in published)
        replace_between_markers(page, block)

    # Startseite zeigt nur die hervorgehobenen Projekte — kuratiert, nicht alles.
    featured = [p for p in published if p.get("featured")] or published
    for lang, page in (("de", SITE / "index.html"), ("en", SITE / "en" / "index.html")):
        block = "\n".join(card(p, lang, prefix="") for p in featured)
        replace_between_markers(page, block)

    domain = data.get("_config", {}).get("domain", "").rstrip("/")
    if not domain:
        sys.exit("FEHLER: _config.domain fehlt in content/projekte.json.")
    update_sitemap(published, domain)

    drafts = len(data["projekte"]) - len(published)
    print(f"{written} Projektseiten erzeugt ({len(published)} Projekte x 2 Sprachen).")
    print("Karten in arbeiten.html und en/work.html aktualisiert.")
    print("sitemap.xml aktualisiert.")
    if drafts:
        print(f"{drafts} Projekt(e) als draft übersprungen — nicht veröffentlicht.")


if __name__ == "__main__":
    main()
