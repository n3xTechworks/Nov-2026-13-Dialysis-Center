# Image slot assignment (Tidewell Dialysis Centre)

Rule: every photo appears on exactly ONE page. Exceptions (enforced by `tests/qa.cjs`):
- `user-1` (dashboard avatar) appears in the app header of every dashboard page.
- `blog-N` + `author-N` appear on `blog.html` (card) AND `blog-post-N.html` (its own article), nowhere else.
Sizes: scenes `-800` / `-1600` (heroes also `-2000`), portraits `-160` / `-800`. Always `object-fit: cover`; set `object-position` per photo so faces are never cropped.

| Slot | Page | Use |
|---|---|---|
| hero-home1 | index.html | home hero (centred) |
| facility-1, facility-2, facility-3, facility-4 | index.html | Facilities cards (bays, private room, lounge, water lab) |
| testi-1, testi-2, testi-3 | index.html | testimonials (testi-1 older man, testi-2 older woman, testi-3 older man) |
| hero-home2 | home-2.html | home hero |
| visit-1, visit-2, visit-3 | home-2.html | "Your first visit" steps (consultation, health check, comfortable first session) |
| home2-feature-1, home2-feature-2 | home-2.html | feature splits (family support, comfort / hand-holding) |
| testi-4, testi-5, testi-6 | home-2.html | testimonials |
| hero-about | about.html | page hero |
| about-story, about-quality, about-community | about.html | story split, quality/lab split, community/support split |
| hero-services | services.html | page hero |
| card-haemo, card-home, card-pd, card-nocturnal | services.html | main treatment cards (photo in the card media frame, hand-written in src/pages/services.html) |
| service-access, service-nutrition, service-ckd, service-travel | services.html | supporting care cards (`{{service_cards support}}`) |
| service-haemo | service-haemodialysis.html | page hero (auto from template) |
| service-home | service-home-dialysis.html | page hero (auto) |
| service-pd | service-peritoneal.html | page hero (auto) |
| service-nocturnal | service-nocturnal.html | page hero (auto) |
| hero-care-team | care-team.html | page hero |
| doc-1..doc-4, nurse-1..nurse-4, spec-1..spec-4 | care-team.html | team cards (`{{team_cards all}}`); NOT used on any other page (Home 1 team teaser is text only) |
| hero-blog | blog.html | page hero |
| blog-1..blog-7 + author-1..author-7 | blog.html + blog-post-N.html | blog-N cover and author-N photo on card N and on article N only |
| hero-contact | contact.html | page hero |
| book-step | contact.html | "Book a visit" form side image (#book) |
| login-image | login.html | auth side image |
| signup-image | signup.html | auth side image (same frame size as login) |
| user-1 | dashboard*.html | avatar (app header partial) + profile page |

Not assigned (no photo): help.html, privacy.html, terms.html, 404.html (title band), forgot/reset password, dashboard data pages (charts, tables).

## Added (lead)
- `home-treat-1..4` -> index.html treatment cards
- `card-haemo`, `card-home`, `card-pd`, `card-nocturnal` -> services.html main treatment cards
