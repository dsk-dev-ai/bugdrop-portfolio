# Submission copy — AWS Builder Center project

Paste these values into the hackathon **Create a project** form.
Replace every `[PLACEHOLDER]` before publishing.

---

## Title

**BUG DROP: The Superpower Vending Machine**

## Description

A portfolio where a retro vending machine dispenses the tech superpowers I earned from real bugs. Pull the lever, a capsule drops, and an incident postmortem reveals the bug, the fix, and the lesson — hosted on AWS Amplify with a serverless counter.

## Tags (max 5)

`aws-amplify` · `javascript` · `serverless` · `aws-lambda` · `student-builders`

## Cover image

A 1200 × 675 screenshot of the machine in its idle state with the blinking
**"PULL FOR A SUPERPOWER"** hint visible. (See `docs/screenshots/`.)

## GitHub repository

`https://github.com/[YOUR_GITHUB_USERNAME]/bugdrop-portfolio`

## Endpoint or live demo

`https://main.[YOUR_AMPLIFY_ID].amplifyapp.com`

## Jupyter / SageMaker notebook

_(leave empty)_

---

## Body (Markdown)

> Copy everything below into the Body field. Add your screenshots where marked.

# BUG DROP — The Superpower Vending Machine

Most portfolios tell you what someone knows. BUG DROP shows **how they learned it**.

BUG DROP is a personal portfolio where a retro vending machine dispenses the
superpowers I earned from real bugs. Every capsule opens as an **incident
postmortem**: what broke, why it broke, how I fixed it, the lesson I kept, and the
project it made possible.

![BUG DROP hero — machine with the visible "PULL FOR A SUPERPOWER" hint](docs/screenshots/01-hero.png)

## The creative feature

A blinking **"PULL FOR A SUPERPOWER"** badge and a bouncing arrow point at a
physical-looking lever. Pulling it (click, tap, `Enter`, or `Space`) shakes the
machine, drops a capsule, and opens a postmortem card.

The postmortem has five fields:

1. **Incident** — the bug in plain language
2. **Root cause** — why it actually happened
3. **Fix** — what I changed
4. **Lesson** — what I now do differently
5. **Built from it** — the project the lesson made possible

Pull three times and a **secret capsule** unlocks. The feature never blocks
navigation: it lives in its own section, the modal is dismissible with `Esc`, and
focus returns to the lever.

![The postmortem card after a pull](docs/screenshots/02-postmortem.png)

### Why failures instead of a skills list

Every submission can say "I know JavaScript." Very few can show the exact bug that
taught them to read a stack trace, or the CORS error that finally made HTTP
headers click. Being specific and honest is more memorable — and it is genuinely
mine.

## AWS implementation

![Architecture](docs/architecture.svg)

| Service | Role |
| --- | --- |
| **AWS Amplify Hosting** | Builds and deploys the static site from GitHub, provides HTTPS and the live URL |
| **Amazon CloudFront** | Global CDN in front of Amplify Hosting |
| **Amazon API Gateway (HTTP API)** | Exposes `/pull`, `/stats`, and `/daily` |
| **AWS Lambda (Node.js 20)** | Increments the counter and computes the daily superpower |
| **Amazon DynamoDB** | `capsule_stats` table with an atomic `ADD` counter |
| **AWS IAM** | Least-privilege role created by the SAM template |
| **Amazon CloudWatch** | Lambda logs for debugging |
| **AWS Budgets** | $5 cost alarm to keep the project inside the free tier |

The creative feature is deliberately **resilient**: if the API is slow or offline,
the machine falls back to a local count, so the core interaction always works.

![AWS Amplify console after deployment](docs/screenshots/03-amplify-console.png)
![Lambda and DynamoDB in the AWS console](docs/screenshots/04-aws-backend.png)

## CI/CD

- **Amplify continuous deployment:** every push to `main` builds and deploys.
- **GitHub Actions:** HTML validation, ESLint, Stylelint, broken-link check, and
  Lighthouse CI on every push and pull request.

![GitHub Actions CI passing](docs/screenshots/05-ci.png)

## What I learned

- How Amplify Hosting turns a GitHub repo into a globally served HTTPS site, and
  why the CDN changes how you think about caching.
- How to wire API Gateway → Lambda → DynamoDB with SAM, and why an atomic
  `ADD` is safer than read-modify-write for a shared counter.
- How CORS and preflight requests actually work — the error that inspired one of
  the capsules.
- How to make an interaction work for keyboard and screen-reader users, and how
  `prefers-reduced-motion` changes animation design.
- That documentation and screenshots are part of the product, not an afterthought.

## Challenges (and how I fixed them)

- **CORS blocked the first API call.** Fixed by configuring the HTTP API's
  `CorsConfiguration` for the Amplify origin and handling `OPTIONS`.
- **The counter raced under repeated clicks.** Fixed with a DynamoDB atomic
  `ADD` instead of read-modify-write.
- **The reveal broke if the API was down.** Fixed with a local fallback so the
  creative feature never depends on the network.
- **Case-sensitive file names broke a deploy.** Fixed by matching import casing
  exactly and adding CI to catch it next time.
- **The modal trapped nothing.** Fixed with an explicit focus trap, `Esc` to
  close, and focus restoration to the lever.

## Links

- **Live site:** https://main.[YOUR_AMPLIFY_ID].amplifyapp.com
- **Source:** https://github.com/[YOUR_GITHUB_USERNAME]/bugdrop-portfolio
- **Demo video:** [OPTIONAL LINK]

---

## Screenshot checklist (add these files to `docs/screenshots/`)

| File | What to capture |
| --- | --- |
| `01-hero.png` | Desktop hero with the machine and the blinking hint |
| `02-postmortem.png` | Open postmortem card, including the lesson |
| `03-amplify-console.png` | Amplify app page showing the live domain and a successful deploy |
| `04-aws-backend.png` | Lambda function + DynamoDB table (and the counter item) |
| `05-ci.png` | Green GitHub Actions run |
| `06-mobile.png` | Phone view of the hero and a capsule reveal |
| `07-secret.png` | The secret capsule after three pulls |
| `08-architecture.png` | Exported architecture diagram (optional if SVG renders) |
