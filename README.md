# latinorepublicans.org

Website for NYC Latino Republican Club Inc. Hosted on GitHub Pages and maintained with Claude.

## Pages
- `/` Home: header, hero, values, roots, Executive Board, events, Get Involved, donate, footer
- `/join/` Join the Club (memberships go to Stripe; `?rep=country` preselects the flag)
- `/welcome/` shown after a member pays (not listed on Google)

## Where things live
- `sections/` one file per section. Edit a section here; the pages pick it up automatically.
- `assets/site.js` sizes each section, runs the menu links, keeps pop-ups on screen.
- Stripe links (TEST MODE until the club goes live): `sections/join.html` (TIERS),
  `sections/header.html` and `sections/footer.html` (DONATE_LINK), `sections/donate.html` (DONATE_BY_AMOUNT).

Never put passwords, member lists or private notes in this project: it is public.
