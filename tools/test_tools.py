#!/usr/bin/env python3
"""Tests für den Generator (build-projects.py) und den Site-Check (check.py).

Ausführen aus dem Projektstamm:
    python3 -m unittest discover -s tools -p 'test_*.py' -v

Nur Standardbibliothek. Die Tests fassen die echte Website nicht an: alles,
was Dateien braucht, läuft in einem temporären site-v1-Abbild.
"""

import importlib.util
import pathlib
import shutil
import sys
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


build = load("build_projects", "build-projects.py")
check = load("site_check", "check.py")


def project(**over):
    """Minimal gültiges Projekt; Felder per Keyword überschreiben."""
    base = {
        "slug": "test-film", "draft": False, "jahr": "2026", "mode": "real",
        "typ": "Personal Project", "orientation": "landscape",
        "video": "assets/video/test-film.mp4", "poster": "assets/img/test-film.jpg",
        "de": {"titel": "Testfilm", "kategorie": "Fashion", "rolle": "Regie",
               "aufgabe": "Aufgabe.", "ansatz": "Ansatz.", "ergebnis": "Ergebnis."},
        "en": {"titel": "Test film", "kategorie": "Fashion", "rolle": "Director",
               "aufgabe": "Task.", "ansatz": "Approach.", "ergebnis": "Result."},
    }
    base.update(over)
    return base


class TempSite(unittest.TestCase):
    """Leitet SITE auf ein Wegwerf-Verzeichnis mit den nötigen Mediendateien um."""

    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        (self.tmp / "assets" / "video").mkdir(parents=True)
        (self.tmp / "assets" / "img").mkdir(parents=True)
        for rel in ("assets/video/test-film.mp4", "assets/img/test-film.jpg"):
            (self.tmp / rel).write_bytes(b"x")
        self._site = build.SITE
        build.SITE = self.tmp

    def tearDown(self):
        build.SITE = self._site
        shutil.rmtree(self.tmp, ignore_errors=True)


class Derived(TempSite):
    def test_falls_back_to_original_when_no_derivative(self):
        self.assertEqual(build.derived("assets/video/test-film.mp4", "-preview"),
                         "assets/video/test-film.mp4")

    def test_uses_derivative_when_present(self):
        (self.tmp / "assets/video/test-film-preview.mp4").write_bytes(b"x")
        self.assertEqual(build.derived("assets/video/test-film.mp4", "-preview"),
                         "assets/video/test-film-preview.mp4")

    def test_empty_and_extensionless_paths_pass_through(self):
        self.assertEqual(build.derived("", "-sm"), "")
        self.assertIsNone(build.derived(None, "-sm"))
        self.assertEqual(build.derived("assets/img/noext", "-sm"), "assets/img/noext")


class Validate(TempSite):
    def errors(self, *projects):
        errs, _ = build.validate({"projekte": list(projects)})
        return "\n".join(errs)

    def test_valid_project_has_no_errors(self):
        self.assertEqual(self.errors(project()), "")

    def test_bad_slug(self):
        self.assertIn("slug muss", self.errors(project(slug="Test Film")))

    def test_duplicate_slug(self):
        self.assertIn("slug doppelt", self.errors(project(), project()))

    def test_unknown_mode_and_orientation(self):
        out = self.errors(project(mode="magic", orientation="round"))
        self.assertIn("mode 'magic'", out)
        self.assertIn("orientation 'round'", out)

    def test_missing_language_block_and_texts(self):
        out = self.errors(project(en=None))
        self.assertIn("Block 'en' fehlt", out)
        out = self.errors(project(de={"titel": "", "kategorie": "Fashion"}))
        self.assertIn("de.titel fehlt", out)
        self.assertIn("de.aufgabe fehlt", out)

    def test_draft_only_needs_category(self):
        out = self.errors(project(draft=True, video="", poster="",
                                  de={"titel": "", "kategorie": "Beauty"},
                                  en={"titel": "", "kategorie": "Beauty"}))
        self.assertEqual(out, "")

    def test_missing_media_file(self):
        out = self.errors(project(video="assets/video/nope.mp4", stills=["assets/img/nope.jpg"]))
        self.assertIn("video 'assets/video/nope.mp4' liegt nicht", out)
        self.assertIn("still 'assets/img/nope.jpg' liegt nicht", out)

    def test_published_without_media_is_only_a_warning(self):
        errs, warns = build.validate({"projekte": [project(video="", poster="")]})
        self.assertEqual(errs, [])
        self.assertTrue(any("ohne video/poster" in w for w in warns))

    def test_client_on_personal_project_is_a_warning(self):
        errs, warns = build.validate({"projekte": [project(kunde="Marke X")]})
        self.assertEqual(errs, [])
        self.assertTrue(any("kein Auftrag" in w for w in warns))

    def test_empty_list(self):
        errs, _ = build.validate({"projekte": []})
        self.assertTrue(errs)


class Card(TempSite):
    def test_card_uses_derivatives_but_keeps_full_media_for_modal(self):
        (self.tmp / "assets/video/test-film-preview.mp4").write_bytes(b"x")
        (self.tmp / "assets/img/test-film-sm.jpg").write_bytes(b"x")
        out = build.card(project(), "de")
        self.assertIn('src="assets/video/test-film-preview.mp4"', out)
        self.assertIn('poster="assets/img/test-film-sm.jpg"', out)
        self.assertIn('data-thumb="assets/img/test-film-sm.jpg"', out)
        self.assertIn('data-video="assets/video/test-film.mp4"', out)
        self.assertIn('data-poster="assets/img/test-film.jpg"', out)

    def test_no_data_thumb_without_derivative(self):
        out = build.card(project(), "de")
        self.assertNotIn("data-thumb", out)
        self.assertIn('poster="assets/img/test-film.jpg"', out)

    def test_english_card_uses_parent_paths(self):
        out = build.card(project(), "en")
        self.assertIn('href="projects/test-film.html"', out)
        self.assertIn('src="../assets/video/test-film.mp4"', out)
        self.assertIn('data-video="../assets/video/test-film.mp4"', out)

    def test_escapes_markup_in_texts(self):
        p = project(de={"titel": "<b>Böse</b> & Co", "kategorie": "Fashion", "rolle": "",
                        "aufgabe": "a", "ansatz": "b", "ergebnis": "c"})
        out = build.card(p, "de")
        self.assertNotIn("<b>Böse", out)
        self.assertIn("&lt;b&gt;Böse&lt;/b&gt; &amp; Co", out)

    def test_personal_project_hides_client_field(self):
        out = build.card(project(), "de")
        self.assertNotIn("data-kunde", out)
        out = build.card(project(typ="Client Work"), "de")
        self.assertIn('data-kunde="Auf Anfrage"', out)
        out = build.card(project(typ="Client Work"), "en")
        self.assertIn('data-kunde="On request"', out)

    def test_placeholder_card_has_no_link(self):
        out = build.card_placeholder(project(draft=True), "de")
        self.assertNotIn("<a ", out)
        self.assertIn("card--empty", out)


class Pages(TempSite):
    def test_description_is_truncated_at_word_boundary(self):
        long = "Wort " * 60
        p = project(de=dict(project()["de"], aufgabe=long))
        tpl = '<meta name="description" content="%%BESCHREIBUNG%%">'
        out = build.build_page(p, p, "de", tpl)
        desc = out.split('content="')[1].split('"')[0]
        self.assertLessEqual(len(desc), 156)
        self.assertTrue(desc.endswith("…"))
        self.assertNotIn("Wort …", desc.replace("Wort…", ""))

    def test_media_blocks_are_inserted_after_escaping(self):
        p = project()
        tpl = "%%HERO_MEDIA%%|%%TITEL%%"
        out = build.build_page(p, p, "de", tpl)
        self.assertIn("<video controls", out)
        self.assertIn('<source src="../assets/video/test-film.mp4"', out)


class Sitemap(TempSite):
    def test_static_lastmod_is_refreshed_from_file_change(self):
        (self.tmp / "faq.html").write_text("x")
        build.last_change = lambda path: "2030-01-02"
        src = ('<url>\n<loc>https://x.test/site/faq.html</loc>\n'
               '<xhtml:link rel="alternate" hreflang="de" href="https://x.test/site/faq.html"/>\n'
               '<lastmod>2020-01-01</lastmod>\n</url>\n'
               '<url>\n<loc>https://x.test/site/missing.html</loc>\n<lastmod>2020-01-01</lastmod>\n</url>')
        out = build.refresh_static_lastmod(src, "https://x.test/site")
        self.assertIn("<lastmod>2030-01-02</lastmod>", out)
        self.assertIn("<lastmod>2020-01-01</lastmod>", out)  # fehlende Datei bleibt unverändert

    def test_project_entries_cover_both_languages(self):
        out = build.sitemap_entries([project()], "https://x.test/site")
        self.assertIn("https://x.test/site/projekte/test-film.html", out)
        self.assertIn("https://x.test/site/en/projects/test-film.html", out)
        self.assertEqual(out.count("<url>"), 2)


class Checker(unittest.TestCase):
    def parse(self, html):
        p = check.Page()
        p.feed(html)
        p.close()
        return p

    def test_clean_document(self):
        p = self.parse('<html lang="de"><head><title>T</title></head>'
                       '<body><h1>H</h1><img src="a.jpg" alt=""><p>x</p></body></html>')
        self.assertEqual(p.stack, [])
        self.assertEqual(p.unbalanced, [])
        self.assertEqual(p.h1, 1)
        self.assertEqual(p.imgs_without_alt, 0)
        self.assertEqual(p.lang, "de")
        self.assertEqual(p.title, "T")

    def test_unclosed_and_stray_tags(self):
        p = self.parse("<div><p>x</div>")
        self.assertIn("p", p.unbalanced)
        p = self.parse("<div>x</div></span>")
        self.assertIn("/span", p.unbalanced)
        p = self.parse("<div><section>")
        self.assertEqual(p.stack, ["div", "section"])

    def test_duplicate_ids_and_missing_alt(self):
        p = self.parse('<a id="x"></a><b id="x"></b><img src="a.jpg">')
        self.assertEqual(p.ids["x"], 2)
        self.assertEqual(p.imgs_without_alt, 1)

    def test_meta_and_refs_collected(self):
        p = self.parse('<meta name="description" content="d">'
                       '<meta http-equiv="Content-Security-Policy" content="c">'
                       '<a href="a.html"></a><video poster="p.jpg"><source src="v.mp4"></video>')
        self.assertEqual(p.meta["description"], "d")
        self.assertIn("Content-Security-Policy", p.meta)
        self.assertEqual(sorted(u for _, u in p.refs), ["a.html", "p.jpg", "v.mp4"])

    def test_resolve_skips_external_and_special(self):
        page = check.SITE / "index.html"
        for url in ("https://x.test", "mailto:a@b", "tel:+1", "#top", "%23g",
                    "data:image/png;base64,AA", "{{INSTAGRAM}}", "javascript:void(0)"):
            self.assertIsNone(check.resolve(page, url), url)
        self.assertEqual(check.resolve(page, "assets/css/site.css#x?v=1"),
                         (check.SITE / "assets/css/site.css").resolve())
        self.assertEqual(check.resolve(check.SITE / "en" / "faq.html", "/arbeiten.html"),
                         check.SITE / "arbeiten.html")


if __name__ == "__main__":
    unittest.main()
