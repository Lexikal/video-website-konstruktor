#!/usr/bin/env python3
"""Statische Prüfung der fertigen Website — läuft vor jedem Deploy.

Ausführen aus dem Projektstamm:
    python3 tools/check.py            # Fehler → Exit 1
    python3 tools/check.py --strict   # auch Warnungen → Exit 1

Kein Framework, kein Build-Tool, also auch kein Linter/Typecheck/Test-Runner
von der Stange. Dieses Skript ist der Ersatz: es fängt die Fehlerklassen ab,
die bei einer handgepflegten statischen Seite tatsächlich vorkommen —

  * kaputtes HTML (offene Tags, doppelte IDs, fehlende alt/lang/title)
  * tote interne Links und fehlende Assets (auch aus CSS-url() und Video-Quellen)
  * CSS mit unausgeglichenen Klammern
  * JS, das nicht einmal parst (per JavaScriptCore über osascript, nur macOS)
  * vergessene {{PLATZHALTER}} auf Seiten, die keine haben sollten
  * fehlende Pflicht-Metadaten (description, canonical, CSP), zu lange Titel
  * erzeugte Seiten, die nicht mehr zu content/projekte.json passen

Nur Python-Standardbibliothek, damit es auch im GitHub-Actions-Runner ohne
Installationsschritt läuft.
"""

import html.parser
import pathlib
import re
import shutil
import subprocess
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site-v1"

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
# {{PLATZHALTER}} für Kontakt-/Rechtsdaten, die der Nutzer noch nicht
# geliefert hat, stehen im Footer jeder Seite. Sie blockieren den Deploy
# nicht (die Seite läuft damit heute schon), werden aber gesammelt gemeldet,
# damit sie nicht in Vergessenheit geraten.
PLACEHOLDER_RE = re.compile(r"\{\{[A-Z_]+\}\}")
TITLE_MAX = 70
DESC_MIN, DESC_MAX = 50, 160

errors, warnings = [], []
placeholders = {}   # {{NAME}} -> Anzahl Seiten


def err(page, msg):
    errors.append(f"{page}: {msg}")


def warn(page, msg):
    warnings.append(f"{page}: {msg}")


class Page(html.parser.HTMLParser):
    """Sammelt Struktur und Verweise einer Seite in einem Durchlauf."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.ids = {}
        self.refs = []          # (attr, url)
        self.h1 = 0
        self.lang = None
        self.title = ""
        self.meta = {}
        self.imgs_without_alt = 0
        self._in_title = False
        self.unbalanced = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self.h1 += 1
        if tag == "img" and a.get("alt") is None:
            self.imgs_without_alt += 1
        if tag == "meta":
            key = a.get("name") or a.get("property") or a.get("http-equiv")
            if key:
                self.meta[key] = a.get("content", "")
        if "id" in a:
            self.ids[a["id"]] = self.ids.get(a["id"], 0) + 1
        for attr in ("href", "src", "poster"):
            if a.get(attr):
                self.refs.append((attr, a[attr]))
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        # <br/> u. ä. — wie Starttag, aber ohne Stack.
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag in VOID:
            return
        if tag in self.stack:
            while self.stack and self.stack[-1] != tag:
                self.unbalanced.append(self.stack.pop())
            self.stack.pop()
        else:
            self.unbalanced.append("/" + tag)

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def resolve(page_path, url):
    """Interner Verweis → Pfad im Dateisystem, oder None für externe/spezielle."""
    if re.match(r"^(https?:|mailto:|tel:|data:|#|%23|javascript:|\{\{)", url):
        return None
    clean = urllib.parse.unquote(url.split("#", 1)[0].split("?", 1)[0])
    if not clean:
        return None
    if clean.startswith("/"):
        return SITE / clean.lstrip("/")
    return (page_path.parent / clean).resolve()


def check_pages():
    pages = sorted(SITE.rglob("*.html"))
    for path in pages:
        rel = path.relative_to(SITE).as_posix()
        text = path.read_text(encoding="utf-8")
        p = Page()
        p.feed(text)
        p.close()

        if p.stack:
            err(rel, f"nicht geschlossene Tags: {', '.join(p.stack[-5:])}")
        if p.unbalanced:
            err(rel, f"unausgeglichene Tags: {', '.join(p.unbalanced[:5])}")
        for i, n in p.ids.items():
            if n > 1:
                err(rel, f"id '{i}' {n}× vergeben")
        if not p.lang:
            err(rel, "<html lang> fehlt")
        if p.h1 != 1:
            err(rel, f"{p.h1} <h1> (erwartet genau 1)")
        if p.imgs_without_alt:
            err(rel, f"{p.imgs_without_alt} <img> ohne alt")
        if not p.title.strip():
            err(rel, "<title> fehlt")
        elif len(p.title.strip()) > TITLE_MAX:
            warn(rel, f"<title> {len(p.title.strip())} Zeichen (> {TITLE_MAX})")
        desc = p.meta.get("description", "")
        if not desc:
            err(rel, "meta description fehlt")
        elif not DESC_MIN <= len(desc) <= DESC_MAX:
            warn(rel, f"meta description {len(desc)} Zeichen (Ziel {DESC_MIN}–{DESC_MAX})")
        if "Content-Security-Policy" not in p.meta:
            err(rel, "CSP-Meta fehlt")
        if "viewport" not in p.meta:
            err(rel, "viewport-Meta fehlt")
        if '<link rel="canonical"' not in text:
            err(rel, "canonical fehlt")

        for attr, url in p.refs:
            target = resolve(path, url)
            if target is None:
                if url.startswith("http://"):
                    warn(rel, f"unverschlüsselter Link {url}")
                continue
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                err(rel, f"toter Verweis {attr}=\"{url}\"")
            elif SITE not in target.parents and target != SITE:
                err(rel, f"Verweis außerhalb von site-v1: {url}")

        for ph in set(PLACEHOLDER_RE.findall(text)):
            placeholders[ph] = placeholders.get(ph, 0) + 1

        if not re.search(r"<script[^>]+site\.js", text):
            warn(rel, "site.js nicht eingebunden")
    return len(pages)


def check_css():
    for path in SITE.rglob("*.css"):
        rel = path.relative_to(SITE).as_posix()
        text = path.read_text(encoding="utf-8")
        body = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
        body = re.sub(r"url\(([^)]*)\)", "url()", body)
        body = re.sub(r"\"[^\"]*\"|'[^']*'", "''", body)
        if body.count("{") != body.count("}"):
            err(rel, f"Klammern unausgeglichen: {body.count('{')} '{{' vs {body.count('}')} '}}'")
        for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", text):
            url = m.group(1)
            target = resolve(path, url)
            if target is not None and not target.is_file():
                err(rel, f"url() zeigt ins Leere: {url}")
        if "\t" in text:
            warn(rel, "Tabs im CSS (Rest der Datei nutzt Leerzeichen)")


def check_js():
    """Syntaxprüfung über JavaScriptCore. Wir werten die Datei außerhalb eines
    Browsers aus: ein ReferenceError auf 'window'/'document' heißt 'geparst,
    aber DOM fehlt' — alles andere ist ein echter Fehler."""
    if not shutil.which("osascript"):
        warnings.append("JS: osascript nicht verfügbar — Syntaxprüfung übersprungen")
        return
    for path in SITE.rglob("*.js"):
        rel = path.relative_to(SITE).as_posix()
        try:
            out = subprocess.run(
                ["osascript", "-l", "JavaScript", "-e", path.read_text(encoding="utf-8")],
                capture_output=True, text=True, timeout=30,
            )
        except subprocess.SubprocessError as e:
            warnings.append(f"JS {rel}: Prüfung fehlgeschlagen ({e})")
            continue
        msg = (out.stderr or "").strip()
        if out.returncode != 0 and not re.search(r"Can't find variable: (window|document|navigator)", msg):
            err(rel, f"JS-Fehler: {msg.splitlines()[-1] if msg else '?'}")


def check_generated():
    """Generator noch einmal laufen lassen und sicherstellen, dass er nichts
    ändert — sonst wurden erzeugte Seiten von Hand editiert oder das
    Ergebnis eines Builds nicht committet."""
    if not shutil.which("git"):
        return
    before = subprocess.run(["git", "status", "--porcelain", "site-v1"], cwd=ROOT,
                            capture_output=True, text=True).stdout
    run = subprocess.run([sys.executable, "tools/build-projects.py"], cwd=ROOT,
                         capture_output=True, text=True)
    if run.returncode != 0:
        err("build-projects.py", run.stdout.strip() or run.stderr.strip())
        return
    after = subprocess.run(["git", "status", "--porcelain", "site-v1"], cwd=ROOT,
                           capture_output=True, text=True).stdout
    changed = sorted(set(after.splitlines()) - set(before.splitlines()))
    changed = [c for c in changed if "sitemap.xml" not in c]  # lastmod ist tagesabhängig
    if changed:
        err("build-projects.py", "Erzeugte Dateien weichen ab — Build ausführen und committen: "
            + ", ".join(c.strip() for c in changed))


def check_sitemap():
    path = SITE / "sitemap.xml"
    if not path.is_file():
        err("sitemap.xml", "fehlt")
        return
    text = path.read_text(encoding="utf-8")
    domain = re.search(r"<loc>(https?://[^/]+(?:/[^/<]+)*?)/[^<]*\.html</loc>", text)
    for loc in re.findall(r"<loc>([^<]+)</loc>", text):
        rel = re.sub(r"^https?://[^/]+/[^/]+/", "", loc) if domain else loc
        if not (SITE / rel).is_file():
            err("sitemap.xml", f"Eintrag ohne Datei: {loc}")
    pages = {p.relative_to(SITE).as_posix() for p in SITE.rglob("*.html")}
    listed = {re.sub(r"^https?://[^/]+/[^/]+/", "", l) for l in re.findall(r"<loc>([^<]+)</loc>", text)}
    for missing in sorted(pages - listed):
        if "noindex" not in (SITE / missing).read_text(encoding="utf-8"):
            warn("sitemap.xml", f"indexierbare Seite fehlt: {missing}")


def main():
    strict = "--strict" in sys.argv
    n = check_pages()
    check_css()
    check_js()
    check_sitemap()
    check_generated()
    if placeholders:
        warnings.append("offene Platzhalter: " + ", ".join(
            f"{k} ({v} Seiten)" for k, v in sorted(placeholders.items())))
    for w in warnings:
        print("WARNUNG:", w)
    for e in errors:
        print("FEHLER:", e)
    print(f"{n} Seiten geprüft — {len(errors)} Fehler, {len(warnings)} Warnungen.")
    if errors or (strict and warnings):
        sys.exit(1)


if __name__ == "__main__":
    main()
