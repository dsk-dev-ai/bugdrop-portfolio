# Release PR — BUG DROP v1.0.0

**Branch:** `release/v1.0.0` → `main`

## Summary

Promotes BUG DROP from the `v0.1.0` MVP to the `v1.0.0` submission build. The
portfolio, the vending-machine creative feature, the AWS backend, and the CI
pipeline are complete and tested.

## Changes

- **Tests:** new `node:test` suite (16 tests) covering the capsule dataset, the
  secret capsule, the `index.html` required sections, local asset references, and
  the backend helpers.
- **Backend refactor:** extracted pure helpers into `backend/src/lib.mjs`
  (`routeOf`, `dayOfYear`, `dailyCapsule`, `reply`) so the logic is testable
  without AWS credentials; `handler.mjs` now depends on them.
- **New graph:** added a six-axis superpower radar chart to the Skills section.
- **New feature:** "Superpower of the day" chip, served by `GET /daily` with a
  deterministic local fallback when the API is offline.
- **Docs:** added `docs/feature-flow.svg`, updated README and submission copy,
  added this PR description and the GitHub PR template.
- **CI:** the workflow now runs the test suite before linting and link checks.

## Test plan

```bash
npm test          # 16 passing
npm run lint      # HTML, JS, CSS
python3 -m http.server 8080   # manual smoke test
```

Validated locally:

- [x] JS syntax (`node --check`) for all scripts and the Lambda handler
- [x] JSON schema for frontend and backend capsule data
- [x] YAML parses for Amplify and GitHub Actions
- [x] No duplicate `id`s, no missing anchors, no missing local assets
- [x] All local assets return HTTP 200
- [x] 16/16 unit tests pass

## Risk and rollback

The change is additive; the creative feature still works with the API offline. To
roll back, redeploy the `v0.1.0` tag from Amplify or revert this merge commit.

## Checklist

- [x] No secrets or credentials committed
- [x] Public repo, MIT license
- [x] Works on desktop and mobile (manual check)
- [x] Visible hint for the creative feature
- [x] AWS usage documented in README and submission copy
