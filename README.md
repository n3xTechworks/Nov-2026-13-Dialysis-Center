# Tidewell Dialysis Centre: Website 13 (Dialysis Center with patient dashboard)

A static, frontend-only website (HTML, CSS, vanilla JavaScript) for a fictional dialysis centre in Chennai and Bengaluru. No backend and no real data:
the patient dashboard, sign-in and bookings are UI mocks backed by `localStorage`. Forms are validated in the browser only.

## Pages
Public: `index.html` (Home 1), `home-2.html`, `about.html`, `services.html`, `service-haemodialysis.html`, `service-home-dialysis.html`, `service-peritoneal.html`,
`service-nocturnal.html`, `care-team.html`, `blog.html`, `blog-post-1..7.html`, `contact.html` (booking form `#book`, FAQ, map), `help.html`, `privacy.html`, `terms.html`, `404.html`.
Auth (no header/footer): `login.html`, `signup.html`, `forgot-password.html`, `reset-password.html`.
Patient dashboard (app shell): `dashboard.html`, `dashboard-schedule.html`, `dashboard-sessions.html`, `dashboard-records.html`, `dashboard-billing.html`, `dashboard-profile.html`.

Navigation (header, mobile menu and footer): Home v (Home 1, Home 2) · About · Services · Care Team · Blog · Contact · Dashboard, plus Log in and the "Book a visit" CTA (`contact.html#book`).

## Structure
```
src/partials/   head, header, footer, logo, app-top, app-bottom      src/pages/  one file per page (front matter + body)
src/templates/  service.html (treatment detail template)             scripts/build.py  -> writes every <page>.html + data/site-data.js
css/site.css    design system (tokens light/dark, pills, pebbles, waves, subgrid cards, forms, modal, toast, app shell, ring, line chart, auth)
css/pages/ js/pages/  page-specific CSS/JS     js/site.js  theme + RTL, menus, toast, modal, tabs, filter chips, line chart, motion
js/validation.js  form validator (browser + Node)     data/services.json, data/team.json     images/  WebP photos + ASSIGNMENT.md
COMPONENTS.md   class, macro and markup guide          tests/  validation unit tests + Playwright QA
```
Edit `src/`, then run `python3 scripts/build.py` (stdlib only). The generated root `*.html` files open directly from disk (file://).
Theme and direction persist in `localStorage` (`tidewell-theme`, `tidewell-dir`) and are applied before first paint.
Fonts: Lexend (headings) and Source Sans 3 (body) from Google Fonts.

## Run
Open `index.html`, or `python3 -m http.server 8000` in this folder. Demo login: `michael.grant@example.com` / `Tidewell123`.

## Tests
```bash
node --test tests/validation.test.js                 # unit tests: name, email, phone, password, date, required
node tests/qa.cjs "$(pwd)" [--quick] [--pages index.html,services.html] [--no-clicks]
bash tests/run-tests.sh                               # build + both
```
QA checks every page at 360 to 1440px in light/dark and LTR/RTL: nav order, logo link, theme/RTL/CTA shown once with equal height and radius, Log in,
only the navbar sticky, no horizontal scroll, level card rows, contrast, images (load, alt, size, used on one page only; `user-1` and blog cover/author pairs excepted),
internal links and ids, equal inner-hero heights, Home 1 content, services (8 cards), care team (12 cards + filter chips), blog cards and articles,
auth pages without header/footer, dashboard sidebar and buttons giving feedback, form validation (name, email lower-casing, phone).
**Playwright note:** `tests/qa.cjs` requires Playwright from an absolute path on the build machine. Elsewhere: `npm i -D playwright && npx playwright install chromium`
and change the `require(...)` to `require('playwright')`.

## Credits
Photos are free-licence Unsplash photos (see `images/`). Brand, people, addresses and phone numbers are fictional.
