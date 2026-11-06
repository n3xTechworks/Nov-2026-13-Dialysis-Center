#!/usr/bin/env python3
"""Tidewell static build. Run from anywhere:  python3 scripts/build.py   (stdlib only, safe to re-run)

src/pages/<name>.html  ->  <name>.html (site root)
    Optional front matter between two '---' lines (key: value), then the page body.
    Layouts:  public (default: head + header + <main id="main"> + body + footer)
              app    (dashboard: head + sidebar + app header + <main class="app-content" id="main"> + body)
              auth   (no header/footer: head + body, you write the <main id="main"> yourself)
    See COMPONENTS.md "Build system" for every key and macro.
Also writes data/site-data.js from data/services.json + data/team.json (so pages work from file://).
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
SERVICES_LIST = json.loads((ROOT / "data" / "services.json").read_text(encoding="utf-8"))["services"]
TEAM_LIST = json.loads((ROOT / "data" / "team.json").read_text(encoding="utf-8"))["team"]
SERVICES = {x["slug"]: x for x in SERVICES_LIST}
TEAM = {x["id"]: x for x in TEAM_LIST}
esc = html.escape
LAZY = ' loading="lazy" decoding="async"'
CURRENT = ' aria-current="true"'


def inr(n):
    s = str(int(n))
    if len(s) <= 3:
        return s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return ",".join(parts + [tail])


def price(n):
    return "₹" + inr(n)


# ---------------------------------------------------------------- partials
def partial(name):
    p = SRC / "partials" / (name + ".html")
    if not p.exists():
        sys.exit("missing partial: " + name)
    return p.read_text(encoding="utf-8")


def include_partials(text, depth=0):
    def rep(m):
        return include_partials(partial(m.group(1).strip()), depth + 1) if depth < 5 else ""
    return re.sub(r"\{\{>\s*([\w\-]+)\s*\}\}", rep, text)


# ---------------------------------------------------------------- macros
ARROW = '<svg class="flip" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
ICONS = {
    "machine": '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 7h6M9 11h6"/><circle cx="12" cy="16" r="2"/>',
    "home": '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M12 13c1.6 2 2.4 3.2 2.4 4.2a2.4 2.4 0 0 1-4.8 0c0-1 .8-2.2 2.4-4.2z"/>',
    "drop": '<path d="M12 3c4 5 6.5 8.4 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 11.4 8 8 12 3z"/><path d="M9 15.5a3 3 0 0 0 3 2.5"/>',
    "moon": '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z"/><path d="M16 4.5v3M14.5 6h3"/>',
    "pulse": '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    "leaf": '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-6 10-8"/>',
    "book": '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 8h6"/>',
    "plane": '<path d="M3 13l18-7-5 15-4-6-6-1z"/><path d="M12 15l4-5"/>',
    "heart": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    "shield": '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "people": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>',
    "check": '<path d="m5 12 5 5 9-10"/>',
}


def icon(name, size=24):
    return '<svg viewBox="0 0 24 24" width="%d" height="%d" aria-hidden="true">%s</svg>' % (size, size, ICONS.get(name, ICONS["heart"]))


def pebble(name, extra=""):
    return '<span class="pebble%s">%s</span>' % (extra, icon(name))


def img_tag(slot, w, h, alt, size, lazy=True, cls=""):
    c = ' class="%s"' % cls if cls else ""
    return '<img%s src="images/%s-%s.webp" width="%d" height="%d" alt="%s"%s>' % (c, slot, size, w, h, esc(alt), LAZY if lazy else "")


def facts_dl(facts):
    return '<dl class="spec-grid">%s</dl>' % "".join("<div><dt>%s</dt><dd>%s</dd></div>" % (esc(k), esc(v)) for k, v in facts)


def pick_services(arg):
    arg = (arg or "all").strip()
    if arg in ("main", "support"):
        return [x for x in SERVICES_LIST if x["kind"] == arg]
    if arg == "all":
        return SERVICES_LIST
    out = []
    for slug in [a.strip() for a in arg.split(",") if a.strip()]:
        if slug not in SERVICES:
            sys.exit("unknown service: " + slug)
        out.append(SERVICES[slug])
    return out


def service_card(x):
    """main treatment: 6 rows = pebble / kicker / title / text / facts / actions.
       supporting service: 6 rows = photo / kicker / title / text / facts / link."""
    if x["kind"] == "main":
        return ('<article class="card card--accent service-card" id="treat-{slug}" data-service="{slug}">\n'
                '  {pebble}\n'
                '  <div class="card-kicker"><span class="badge">Treatment</span><span>{when}</span></div>\n'
                '  <h3 class="card-title"><a href="{page}">{name}</a></h3>\n'
                '  <p class="card-text">{summary}</p>\n'
                '  {facts}\n'
                '  <div class="card-actions"><a class="btn btn-secondary" href="{page}">How it works</a><a class="btn btn-primary" href="contact.html#book">Book a visit</a></div>\n'
                '</article>').format(slug=x["slug"], pebble=pebble(x["icon"]), when=esc(x["facts"][1][1]), page=x["page"], name=esc(x["name"]),
                                     summary=esc(x["summary"]), facts=facts_dl(x["facts"]))
    return ('<article class="card service-card service-card--support" id="{slug}" data-service="{slug}">\n'
            '  <div class="card-media card-media--frame">{img}</div>\n'
            '  <div class="card-kicker"><span class="badge badge--sand">Supporting care</span><span>From {price}</span></div>\n'
            '  <h3 class="card-title">{name}</h3>\n'
            '  <p class="card-text">{summary}</p>\n'
            '  {facts}\n'
            '  <a class="link" href="contact.html#book">Ask about {short} {arrow}</a>\n'
            '</article>').format(slug=x["slug"], img=img_tag(x["image"], 800, 533, x["imageAlt"], 800), price=price(x["priceFrom"]),
                                 name=esc(x["name"]), summary=esc(x["summary"]), facts=facts_dl(x["facts"]), short=esc(x["short"].lower()), arrow=ARROW)


def macro_service_cards(arg, ctx):
    return "\n".join(service_card(x) for x in pick_services(arg))


def macro_treatment_tiles(arg, ctx):
    """compact 4-row card for overviews (Home pages): pebble / title / text / link. No photos."""
    # optional second word = photo slot prefix, e.g. {{treatment_tiles main home-treat}} -> home-treat-1..N photos
    parts = (arg or "main").split()
    sel, prefix = parts[0], (parts[1] if len(parts) > 1 else None)
    out = []
    for i, x in enumerate(pick_services(sel), 1):
        if prefix:
            top = '<div class="card-media card-media--frame">%s</div>' % img_tag("%s-%d" % (prefix, i), 800, 533, x["name"] + " at Tidewell", 800)
        else:
            top = '<p class="eyebrow treat-kicker">%s</p>' % esc(x.get("short", x["name"]))
        out.append('<article class="card card--rows-4 card--accent treat-tile">\n'
                   '  %s\n  <h3 class="card-title"><a href="%s">%s</a></h3>\n  <p class="card-text">%s</p>\n'
                   '  <a class="link" href="%s">Learn about %s %s</a>\n</article>'
                   % (top, x["page"], esc(x["name"]), esc(x["tagline"]), x["page"], esc(x["short"].lower()), ARROW))
    return "\n".join(out)


GROUP_LABEL = {"doctors": "Doctor", "nurses": "Nurse", "specialists": "Specialist"}


def macro_team_cards(arg, ctx):
    """6 rows: portrait / badge / name / role / specialty / meta. data-group for the filter chips."""
    arg = (arg or "all").strip()
    if arg == "all":
        people = TEAM_LIST
    elif arg in GROUP_LABEL:
        people = [t for t in TEAM_LIST if t["group"] == arg]
    else:
        people = [TEAM[i.strip()] for i in arg.split(",") if i.strip()]
    out = []
    for t in people:
        out.append('<article class="card team-card" id="{id}" data-group="{group}">\n'
                   '  <div class="card-media card-media--portrait card-media--frame">{img}</div>\n'
                   '  <span class="badge">{label}</span>\n'
                   '  <h3 class="card-title">{name}</h3>\n'
                   '  <p class="card-sub">{role}</p>\n'
                   '  <p class="card-text">{spec}</p>\n'
                   '  <ul class="meta"><li>{clock}{years} years</li><li>{people}{langs}</li></ul>\n'
                   '</article>'.format(id=t["id"], group=t["group"], img=img_tag(t["id"], 800, 800, "%s, %s" % (t["name"], t["role"]), 800),
                                       label=GROUP_LABEL[t["group"]], name=esc(t["name"]), role=esc(t["role"]), spec=esc(t["specialty"]),
                                       clock=icon("clock", 16), years=t["years"], people=icon("people", 16), langs=esc(", ".join(t["languages"]))))
    return "\n".join(out)


def need_service(ctx):
    x = ctx.get("_service")
    if not x:
        sys.exit("%s: service macro used but no 'service:' key in front matter" % ctx["_name"])
    return x


def macro_service_facts(arg, ctx):
    x = need_service(ctx)
    return '<div class="panel panel--accent" id="facts"><h2>At a glance</h2>%s<p class="panel-note">%s</p></div>' % (facts_dl(x["facts"]), esc(x["tagline"]))


def macro_service_suits(arg, ctx):
    x = need_service(ctx)
    return '<ul class="checklist">%s</ul>' % "".join("<li>%s</li>" % esc(i) for i in x["suits"])


def macro_service_how(arg, ctx):
    x = need_service(ctx)
    return '<ol class="how-steps">%s</ol>' % "".join('<li><span class="how-num" aria-hidden="true">%d</span><p>%s</p></li>' % (i + 1, esc(t)) for i, t in enumerate(x["how"]))


def macro_service_timeline(arg, ctx):
    x = need_service(ctx)
    return '<ol class="timeline">%s</ol>' % "".join('<li><span class="tl-year">%s</span><h3>%s</h3><p>%s</p></li>' % (esc(a), esc(b), esc(c)) for a, b, c in x["timeline"])


def macro_service_bring(arg, ctx):
    x = need_service(ctx)
    return '<ul class="checklist">%s</ul>' % "".join("<li>%s</li>" % esc(i) for i in x["bring"])


def macro_service_faq(arg, ctx):
    x = need_service(ctx)
    items = "".join('<details class="faq-item" name="faq-%s"><summary>%s</summary><div class="faq-answer"><p>%s</p></div></details>' % (x["slug"], esc(q), esc(a)) for q, a in x["faqs"])
    return '<div class="faq"><div class="faq-list">%s</div></div>' % items


def macro_service_cost(arg, ctx):
    x = need_service(ctx)
    return ('<div class="panel panel--sand" id="cost"><h2>Cost and insurance</h2><p class="price"><span class="price-from">From</span> %s <span class="price-note">%s</span></p><p>%s</p></div>'
            % (price(x["priceFrom"]), esc(x["priceUnit"]), esc(x["cost"])))


def macro_service_others(arg, ctx):
    x = need_service(ctx)
    return '<div class="cards cards--trio">%s</div>' % macro_treatment_tiles(",".join(o["slug"] for o in SERVICES_LIST if o["kind"] == "main" and o["slug"] != x["slug"]), ctx)


WAVES = {
    "a": "M0 64V30C160 6 320 0 480 12s320 40 480 34 320-34 480-40v58z",
    "b": "M0 64V40C200 16 400 4 620 20s420 38 600 22 220-18 220-18v40z",
}


def macro_wave(arg, ctx):
    """{{wave bg-tint}} or {{wave tint-bg b}}: an organic divider; first word = from-to colours, optional shape a|b, add 'flip' to mirror."""
    parts = (arg or "bg-tint").split()
    shape = "b" if "b" in parts[1:] else "a"
    flip = " wave--flip" if "flip" in parts[1:] else ""
    return ('<div class="wave wave--%s%s" aria-hidden="true"><svg viewBox="0 0 1440 64" preserveAspectRatio="none" focusable="false"><path d="%s"/></svg></div>'
            % (parts[0], flip, WAVES[shape]))


MACROS = {
    "wave": macro_wave,
    "service_cards": macro_service_cards, "treatment_tiles": macro_treatment_tiles, "team_cards": macro_team_cards,
    "service_facts": macro_service_facts, "service_suits": macro_service_suits, "service_how": macro_service_how,
    "service_timeline": macro_service_timeline, "service_bring": macro_service_bring, "service_faq": macro_service_faq,
    "service_cost": macro_service_cost, "service_others": macro_service_others,
}

HERO_CURVE = '<svg class="hero-curve" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 80V40C240 8 480 0 720 18s480 46 720 22v40z"/></svg>'


def srcset(slot):
    s = "images/{s}-800.webp 800w, images/{s}-1600.webp 1600w".format(s=slot)
    if slot.startswith("hero-"):
        s += ", images/{s}-2000.webp 2000w".format(s=slot)
    return s


def page_hero(fm):
    slot = fm.get("hero")
    if not slot:
        return ""
    crumbs = [c.strip() for c in fm.get("crumbs", "").split("|") if c.strip()]
    nav = ""
    if crumbs:
        parts = ['<a href="index.html">Home</a>']
        for i, c in enumerate(crumbs):
            if "=" in c and i < len(crumbs) - 1:
                label, href = c.split("=", 1)
                parts.append('<a href="%s">%s</a>' % (href, esc(label)))
            else:
                parts.append('<span aria-current="page">%s</span>' % esc(c.split("=")[0]))
        nav = '<nav class="crumbs" aria-label="Breadcrumb">' + '<span aria-hidden="true">/</span>'.join(parts) + "</nav>\n      "
    eyebrow = '<p class="eyebrow">%s</p>\n      ' % esc(fm["eyebrow"]) if fm.get("eyebrow") else ""
    lead = '\n      <p>%s</p>' % fm["lead"] if fm.get("lead") else ""
    return ('<section class="page-hero" aria-labelledby="hero-title">\n'
            '    <img class="page-hero-bg" src="images/{s}-1600.webp" srcset="{ss}" sizes="100vw" width="1600" height="1067" alt="{alt}" fetchpriority="high">\n'
            '    <div class="hero-shade" aria-hidden="true"></div>\n'
            '    <div class="container page-hero-content">\n'
            '      {nav}{eyebrow}<h1 id="hero-title">{h1}</h1>{lead}\n'
            '    </div>\n    {curve}\n  </section>\n').format(s=slot, ss=srcset(slot), curve=HERO_CURVE, alt=esc(fm.get("hero_alt", "")), nav=nav, eyebrow=eyebrow, h1=fm.get("h1", ""), lead=lead)


# ---------------------------------------------------------------- front matter
def parse(text):
    fm = {}
    body = text
    if text.startswith("---"):
        parts = text.split("\n---", 1)
        head = parts[0][3:]
        body = parts[1].lstrip("\n") if len(parts) > 1 else ""
        for line in head.splitlines():
            if ":" in line and not line.strip().startswith("#"):
                k, v = line.split(":", 1)
                fm[k.strip()] = v.strip()
    return fm, body


NAV_HOME = {"home1", "home2"}
APP_NAV = [""]


def apply_nav(text, nav):
    text = re.sub(r'data-nav="([\w\-]+)"', lambda m: 'aria-current="page"' if m.group(1) == nav else "", text)
    text = re.sub(r' data-app="([\w\-]+)"', lambda m: ' aria-current="page"' if m.group(1) == APP_NAV[0] else "", text)
    return text


def render_vars(text, ctx):
    def macro(m):
        name, arg = m.group(1), (m.group(2) or "").strip()
        if name in MACROS:
            return MACROS[name](arg, ctx)
        return m.group(0)
    text = re.sub(r"\{\{(\w+)(?:\s+([^}]*))?\}\}", macro, text)

    def var(m):
        key = m.group(1)
        if key.startswith("s."):
            sv = ctx.get("_service") or {}
            f = key[2:]
            val = sv.get(f)
            if f == "priceFrom" and sv:
                val = price(sv["priceFrom"])
            return "" if val is None else esc(str(val))
        if key in ctx:
            return str(ctx[key])
        print("  warning: %s: unknown placeholder {{%s}}" % (ctx["_name"], key))
        return ""
    return re.sub(r"\{\{([\w\.\-]+)\}\}", var, text)


def build_page(path):
    name = path.stem
    fm, body = parse(path.read_text(encoding="utf-8"))
    layout = fm.get("layout", "public")
    if "template" in fm:
        t = SRC / "templates" / (fm["template"] + ".html")
        tfm, tbody = parse(t.read_text(encoding="utf-8"))
        fm = {**tfm, **fm}
        body = tbody
        layout = fm.get("layout", "public")
    if fm.get("service") and fm["service"] in SERVICES:
        sv = SERVICES[fm["service"]]
        fm.setdefault("hero", sv["image"])
        fm.setdefault("hero_alt", sv["imageAlt"])
        fm.setdefault("crumbs", "Services=services.html|" + sv["short"])
        fm.setdefault("eyebrow", "Treatment")
        fm.setdefault("h1", sv["name"])
        fm.setdefault("lead", sv["tagline"])
    nav = fm.get("nav", "")
    APP_NAV[0] = fm.get("app_nav", "")
    ctx = {"_name": name, "title": fm.get("title", "Tidewell Dialysis Centre | " + name), "description": fm.get("description", "Tidewell Dialysis Centre: calm, patient-focused dialysis care."),
           "css": fm.get("css", name), "js": fm.get("js", name), "body_class": fm.get("body_class", ""),
           "home_current": " is-current" if nav in NAV_HOME else "", "app_title": fm.get("app_title", ""), "year": "2026", "hero_curve": HERO_CURVE}
    for k, v in fm.items():
        if k not in ctx:
            ctx[k] = v
    if fm.get("service"):
        if fm["service"] not in SERVICES:
            sys.exit("%s: unknown service %s" % (name, fm["service"]))
        ctx["_service"] = SERVICES[fm["service"]]
    for k in ("title", "description"):
        ctx[k] = render_vars(ctx[k], ctx) if "{{" in ctx[k] else ctx[k]
    pre = fm.get("preload") or fm.get("hero")
    ctx["preload_tag"] = ('  <link rel="preload" as="image" href="images/{p}-1600.webp" imagesrcset="{ss}" imagesizes="100vw" fetchpriority="high">\n'.format(p=pre, ss=srcset(pre)) if pre else "")
    body = body.rstrip() + "\n"
    head = partial("head")
    if layout == "public":
        out = head + partial("header") + '  <main id="main">\n  ' + page_hero(fm) + body + "  </main>\n" + partial("footer")
    elif layout == "app":
        out = head + partial("app-top") + body + partial("app-bottom")
    elif layout == "auth":
        out = head + body + "</body>\n</html>\n"
    else:
        sys.exit("%s: unknown layout %s" % (name, layout))
    out = include_partials(out)
    out = render_vars(out, ctx)
    out = apply_nav(out, nav if layout == "public" else "")
    (ROOT / (name + ".html")).write_text(out, encoding="utf-8")
    return name


def main():
    js = ("/* generated by scripts/build.py from data/services.json and data/team.json: do not edit */\nwindow.TIDEWELL_SERVICES = "
          + json.dumps(SERVICES_LIST, ensure_ascii=False) + ";\nwindow.TIDEWELL_TEAM = " + json.dumps(TEAM_LIST, ensure_ascii=False) + ";\n")
    (ROOT / "data" / "site-data.js").write_text(js, encoding="utf-8")
    names = [build_page(p) for p in sorted((SRC / "pages").glob("*.html"))]
    print("built %d pages: %s" % (len(names), ", ".join(names)))


if __name__ == "__main__":
    main()
