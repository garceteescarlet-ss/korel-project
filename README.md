# KOREL — A Cocktail Portfolio

A black-and-gold, animation-heavy site for the KOREL cocktail brand. Plain HTML, CSS,
and JavaScript — no build step, no framework, no dependencies to install.

Domain: **houseofkorel.com** (already purchased — not yet connected to hosting).

## Files

```
korel-project/
├── index.html          the main site: hero pour, Behind KOREL, The Menu (8 drinks,
│                        including the free bonus "Soft Launch"), Collection, Consulting
├── gallery.html         "In the Glass" — a 3D drink carousel, all 8 drinks with real photos
├── contact.html         "Let's Talk" — the consulting inquiry form (Formspree-ready)
├── license.html         terms for using the recipes and site
├── privacy.html          what's collected and why
├── css/
│   └── style.css        every style on every page (unused rules per page are harmless)
├── js/
│   ├── main.js           shared on all five pages: scroll-position fixes, reveal-on-scroll,
│   │                     the gold veins, the header/back-to-top, the full-screen menu,
│   │                     and the tiltify() 3D-tilt helper
│   ├── home.js            index.html only: the drink data (all 8), the pour intro, the menu,
│   │                     the recipe dialog, the Volume I preview viewer, and the
│   │                     printable-edition price toggle
│   ├── gallery.js         gallery.html only: the 3D wheel (main.js already covers
│   │                     everything else this page needs)
│   └── contact.js         contact.html only: the form panel's tilt and the Formspree submit
│                         (license.html and privacy.html need no page-specific script at all —
│                         main.js alone covers everything on those two pages)
└── assets/
    ├── logo.png                    the KOREL wordmark (also sampled by the hero's pour
    │                               animation to figure out where to place each particle)
    ├── favicon.ico, favicon-32x32.png, favicon-16x16.png, apple-touch-icon.png
    ├── og-image.jpg                 the social-preview card (Slack, iMessage, X, etc.)
    ├── vol1-cover.jpg                Volume I's cover photo, shown in Collection
    ├── seasonal-cover.jpg            Seasonal Drops' cover photo, shown in Collection
    ├── gallery/                      all 8 real drink photos used in the 3D wheel
    ├── preview/                      the 6 Volume I preview pages, rendered as images
    │                               for the in-page page-flip viewer
    └── KOREL_Volume_I_Preview.pdf    the real preview PDF, linked from inside that viewer
```

Each page loads `main.js` first, then its own file (if it has one), in that order —
`main.js` defines things like `$()`, `$$()`, and `tiltify()` that the other files depend on.

## Running it locally

You can't just double-click `index.html` — browsers block some of what this site does
when a page is opened directly from disk via a `file://` URL. Serve the folder instead:

```bash
cd korel-project
python3 -m http.server 8000
# then open http://localhost:8000/
```

Or, if you have Node: `npx serve .` — or VS Code's "Live Server" extension.

## Deploying it

Static site, deploys anywhere that serves flat files — Netlify, Vercel, or GitHub Pages
all work with zero configuration. Once it's deployed, connect **houseofkorel.com** to it:
that's a couple of DNS records the host will walk you through (one for the bare domain,
one for `www.houseofkorel.com`, with one redirecting to the other).

## What's real and what's still a placeholder

- **The contact form doesn't send anywhere yet.** It correctly *tries* to submit to
  Formspree and fails gracefully (you'll see this if you test it — that's expected, not
  a bug). To make it live: sign up at [formspree.io](https://formspree.io), create a
  form, and paste your endpoint ID into `js/contact.js` in place of `"YOUR_FORM_ID"`.
  That's the only change needed.
- **"Buy Volume I" isn't wired to real payment yet.** Both buttons point to
  `https://payhip.com/YOUR_PRODUCT_LINK` — swap that for your real product link once
  you've set up Payhip (or whichever platform you land on).
- **The "+ Printable Edition (+$5)" checkbox only changes the displayed price.** It
  doesn't yet talk to checkout — that needs a second price variant set up on whichever
  platform ends up handling the real purchase.
- **Business email isn't set up.** Once you're ready, Google Workspace, Zoho Mail, or
  the free Cloudflare Email Routing option are all reasonable ways to get a real
  `@houseofkorel.com` address.

Everything else — the drink data, the recipes, the gallery photos, the preview viewer,
the legal pages — is real, finished content, not a placeholder.

## The Volume I preview, specifically

Clicking "Preview Volume I" opens an in-page viewer that flips through 6 real page
images from the book — not an embedded PDF. That's deliberate: browsers are
inconsistent about rendering PDFs handed to them this way, sometimes forcing a
download instead of actually showing the page. Rendering the pages as images sidesteps
that entirely. A "Download the PDF" link sits at the bottom of that viewer for anyone
who wants the actual file, which points at the real PDF in `assets/`.

## The Soft Launch situation

Soft Launch is the free bonus recipe shown on the site and in the preview — it is
**not** currently in the actual Volume I PDF product (the one meant to be sold). If
you want it included in what customers actually receive, that recipe needs to be added
to the book itself; that's a separate step from anything in this website project.

## Notes on the trickier parts

- **The scroll-position fixes near the top of `main.js`** are there on purpose, and
  layered for a reason: `history.scrollRestoration = "manual"` handles reloads, a
  `pageshow` listener plus a few repeated corrections in the first second after load
  handle cases where a browser or hosting environment restores an old scroll position
  after arriving from another page. Don't remove any of these without understanding
  why they're there — we hit each of these bugs for real before adding the fix for it.
- **`prefers-reduced-motion`** is respected throughout — the pour, the tilt, the
  particle effects, and the word-by-word reveals all fall back to a static version for
  anyone with that OS setting on.
- **The hero's pour animation samples `assets/logo.png`'s pixels** to figure out where
  to place each particle that spells "KOREL." If you ever replace the logo file, keep
  a similar aspect ratio and keep transparency around the letterforms.

## Browser support

Built and tested against current Chrome. Everything used (CSS custom properties, 3D
transforms, `IntersectionObserver`, `<dialog>`, canvas 2D) is well supported in current
Safari, Firefox, and Edge too. Not tested against older/legacy browsers.
