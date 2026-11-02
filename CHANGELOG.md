# Changelog

All notable changes to BUG DROP are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.0] - 2026-11-02

### Added
- **Capsule cabinet** in the creative-feature panel: unlocked capsules are saved
  to `localStorage` (`bugdrop_unlocked`) and can be reopened without pulling.
- Collection progress bar with an accessible `progressbar`, live count, and
  locked/unlocked states.
- **Shareable postmortems**: every capsule updates the URL to
  `#capsule=<id>`, and the reveal card has a copy-link button with a clipboard
  fallback and status message.
- Deep links open the matching capsule on load and stay in sync with browser
  back/forward navigation.
- `assets/js/core.js` with pure, tested helpers (`parseCapsuleHash`,
  `capsuleHref`, `addUnique`, `findCapsule`, `progress`).
- `tests/core.test.mjs` (6 tests) plus a site-contract test; suite is now
  **29 tests**.

### Changed
- README and submission copy document the cabinet and deep-link sharing.
- Version bumped to `1.2.0`.

## [1.1.0] - 2026-11-02

### Added
- Branded `404.html` ("capsule not found") with a route back to the machine.
- Web app manifest (`manifest.webmanifest`), a 512×512 maskable icon, and an
  `apple-touch-icon`.
- Raster social cover `assets/img/og-cover.png` (1200×675), generated from the
  editable `og-cover.svg` source.
- `docs/DEPLOY.md`: end-to-end Amplify + SAM deployment runbook with
  verification steps, screenshot checklist, and troubleshooting.
- `tests/site.test.mjs`: six tests covering metadata, PNG dimensions, manifest
  icons, the 404 page, placeholder-free config, and the deploy runbook.
- `.nvmrc` pinning Node 20 for local/CI parity.

### Changed
- `og:image` and `twitter:image` now use the raster PNG with explicit
  width/height/alt, plus `robots` and `theme-color` metadata.
- HTML lint now validates `404.html` as well as `index.html`.

### Fixed
- Trimmed the meta description to 142 characters so it fits search snippets.

## [1.0.1] - 2026-11-02

### Added
- CI, release, and license badges in the README.

### Fixed
- Repository links in `index.html`, `config.js`, README, and the submission copy
  now point at `https://github.com/dsk-dev-ai/bugdrop-portfolio`.

## [1.0.0] - 2026-11-02

### Added
- Node `node:test` suite with 16 tests for the capsule dataset, page contract,
  local assets, and backend helpers (`tests/`).
- CI now runs the test suite before linting, link checks, and Lighthouse.
- Six-axis "superpower index" radar chart in the Skills section.
- "Superpower of the day" chip wired to `GET /daily`, with a deterministic local
  fallback when the API is offline.
- `docs/feature-flow.svg` diagram of the bug → superpower flow.
- GitHub pull request template and `docs/PULL_REQUEST_v1.0.0.md` release PR.
- `robots.txt`.

### Changed
- Extracted pure backend helpers into `backend/src/lib.mjs`
  (`routeOf`, `dayOfYear`, `dailyCapsule`, `reply`); `handler.mjs` imports them.
- README and submission copy document the test suite and release/PR flow.
- Version bumped to `1.0.0`.

## [0.1.0] - 2026-11-02

### Added
- Single-page portfolio with About Me, Tech Superpowers, and Projects sections.
- BUG DROP vending machine creative feature with lever animation, capsule drop,
  and incident-postmortem reveal cards.
- Visible blinking "PULL FOR A SUPERPOWER" hint.
- Secret capsule unlocked on the third pull.
- 12 capsule stories plus a secret capsule in `assets/js/capsules.json`.
- Graceful fallback data so the feature works if the JSON fetch fails.
- Responsive navigation, keyboard support, `aria-live` announcements, focus trap,
  and `prefers-reduced-motion` support.
- AWS Amplify Hosting build config (`amplify.yml`).
- GitHub Actions CI: HTML validation, ESLint, Stylelint, link check, Lighthouse.
- AWS SAM backend for an optional serverless pull counter
  (`/pull`, `/stats`, `/daily`) using API Gateway, Lambda, and DynamoDB.
- README, architecture diagram, submission draft, MIT license.
