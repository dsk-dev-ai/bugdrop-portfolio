# Deploy BUG DROP — step-by-step

Everything is code-complete. This is the deployment runbook for **AWS Amplify
Hosting** (required by the hackathon) plus the optional serverless counter.

> The judged URL must be an **AWS-hosted** URL and must stay live from
> **November 7–23, 2026**. Do not delete the Amplify app after submitting.

---

## 0. Prerequisites

- [ ] AWS account (Free Tier is fine)
- [ ] MFA enabled on the AWS account
- [ ] GitHub repo: `https://github.com/dsk-dev-ai/bugdrop-portfolio` (public)
- [ ] AWS CLI + SAM CLI installed locally (only for the optional backend)

```bash
aws --version
sam --version
```

---

## 1. Create the Amplify Hosting app

1. Open **AWS Console → AWS Amplify**.
2. Choose **Create new app → Host web app**.
3. Select **GitHub** → authorize AWS Amplify → pick
   `dsk-dev-ai/bugdrop-portfolio`, branch `main`.
4. Amplify reads `amplify.yml` automatically. Leave the build settings as-is
   (this is a static site with no build step).
5. Choose **Save and deploy**.

Wait for the **Deploy** stage to turn green.

- [ ] Build succeeded
- [ ] Live URL copied (looks like `https://main.xxxxxxxx.amplifyapp.com`)

**Verify** in a logged-out browser and on your phone:

- [ ] About, Superpowers, Projects sections render
- [ ] The blinking **PULL FOR A SUPERPOWER** hint is visible
- [ ] Pulling the lever drops a capsule and opens the postmortem
- [ ] The third pull unlocks the secret capsule
- [ ] Keyboard: `Tab` to the lever, `Enter`/`Space` pulls, `Esc` closes
- [ ] `/404.html`-style fallback works for an unknown path
- [ ] No console errors

Every push to `main` now redeploys automatically.

---

## 2. Enable PR previews (recommended)

In Amplify: **App settings → Previews → Enable previews** (or turn on per-branch
auto-build). This makes pull requests produce their own preview URL — good
evidence for the CI/CD part of the submission.

---

## 3. Optional: deploy the serverless counter

The counter is an enhancement. The creative feature works without it.

```bash
cd backend
sam build
sam deploy --guided
```

Answer the prompts:

| Prompt | Value |
| --- | --- |
| Stack name | `bugdrop-api` |
| AWS Region | your region |
| AllowedOrigin | your Amplify URL, e.g. `https://main.abc123.amplifyapp.com` |
| Confirm changes | `y` |
| Allow SAM CLI IAM role creation | `y` |
| Save arguments to config | `y` |

Copy the **ApiBaseUrl** output, then edit `assets/js/config.js`:

```js
window.BUGDROP_CONFIG = {
  apiBase: "https://abc123.execute-api.us-east-1.amazonaws.com",
  github: "https://github.com/dsk-dev-ai/bugdrop-portfolio"
};
```

Commit and push — Amplify redeploys.

**Verify**

- [ ] `curl -X POST <ApiBaseUrl>/pull` returns `{"count": ...}`
- [ ] `curl <ApiBaseUrl>/stats` returns the same count
- [ ] `curl <ApiBaseUrl>/daily` returns today's superpower
- [ ] The counter appears on the site after a pull
- [ ] With `apiBase` empty or the API down, the machine still works

### Test the functions directly in the console

- [ ] Lambda → `bugdrop-api-BugDropFunction-*` → **Test** with an event:
  `{ "requestContext": { "http": { "method": "GET", "path": "/stats" } } }`
- [ ] DynamoDB → `bugdrop-capsule-stats` → item `GLOBAL` → `count` increments
- [ ] CloudWatch → Log groups → `/aws/lambda/bugdrop-api-BugDropFunction-*`

---

## 4. Cost guard

- [ ] **AWS Budgets → Create budget → $5 monthly**, alert at 80%.
- [ ] API Gateway throttling: keep default for the demo, or add a usage plan if
      you expect traffic.
- [ ] DynamoDB is on-demand (pay per request); the demo stays within Free Tier.

---

## 5. Custom domain (optional)

Amplify → **Domain management → Add domain**. Skip it unless you already own a
domain; the `amplifyapp.com` URL is perfectly valid for the submission.

---

## 6. Screenshots for the submission

Save into `docs/screenshots/` using the filenames from `docs/SUBMISSION.md`:

| File | Source |
| --- | --- |
| `01-hero.png` | Desktop hero with the machine + hint |
| `02-postmortem.png` | Open postmortem card |
| `03-amplify-console.png` | Amplify app page, live domain, green deploy |
| `04-aws-backend.png` | Lambda + DynamoDB table and counter item |
| `05-ci.png` | Green GitHub Actions run |
| `06-mobile.png` | Phone view |
| `07-secret.png` | Secret capsule after three pulls |
| `08-architecture.png` | `docs/architecture.svg` exported (optional) |

---

## 7. Submit

1. Open the hackathon → **Your project → Create a project**.
2. Fill it using **`docs/SUBMISSION.md`**:
   - Title: `BUG DROP: The Superpower Vending Machine`
   - Description, body, cover image, tags.
   - GitHub: `https://github.com/dsk-dev-ai/bugdrop-portfolio`
   - Live demo: your Amplify URL.
3. Save as draft, re-check the live URL, then publish **before
   November 6, 11:59 PM PT**.

---

## Troubleshooting

### The page loads but the machine shows fallback capsules

`capsules.json` failed to load. Confirm `assets/js/capsules.json` is deployed
and that you opened the site through HTTPS (not `file://`). The fallback is
intentional so the feature never dies.

### The counter stays hidden

`config.js` still has an empty `apiBase`, or the API call failed. Check the
browser console, then confirm the CORS `AllowedOrigin` matches the Amplify URL
exactly (scheme + host, no trailing slash).

### CORS error on `/pull`

Redeploy the backend with the correct `AllowedOrigin`:

```bash
sam deploy --parameter-overrides AllowedOrigin=https://main.abc123.amplifyapp.com
```

### An old stylesheet is showing

Amplify/CloudFront caches assets. Hard-refresh, or check the build actually
completed. If needed, invalidate the Amplify cache by redeploying.

### Amplify build fails

Open the build log. The most common cause is a filename case mismatch, which CI
(`html-validate`, ESLint, link check) catches before Amplify does.
