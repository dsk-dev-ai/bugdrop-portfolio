# Changelog

All notable changes to BUG DROP are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
