# GITHUB

Rules for GitHub Actions, plans, and cost. CI steps → [DEPLOY](DEPLOY.md#ci). Check order → [QUALITY](QUALITY.md#order). Dependabot → [DEPS](DEPS.md). Cloudflare prices → [CLOUDFLARE](CLOUDFLARE.md#cost).

## Workflows

### [GitHub Actions](STACK.md#github-actions)

- Pin each action to a full commit SHA with a version comment. → [DEPS](DEPS.md)
- Top-level `permissions: contents: read`. Grant more only on the job that needs it.
- Set `timeout-minutes` on each job.
- No `pull_request_target`. Forks get no secrets. → [DEPLOY](DEPLOY.md#ci)
- Pass secrets and variables through `env`. No `${{ }}` inside `run`.
- Checks: `concurrency` with `cancel-in-progress: true`. Deploys: `cancel-in-progress: false`. → [DEPLOY](DEPLOY.md#ci)
- `cache: pnpm` in `actions/setup-node`.

### Slow checks

- Give a slow optional check its own workflow. It runs next to the PR workflow and does not delay it.
- Add a `paths` filter on the files that can change its result. Skip draft pull requests.
- Use a warning annotation only. Never make it a required check. → [PERF](PERF.md)

### Scheduled workflows

- Public repository: GitHub disables a scheduled workflow after 60 days without repository activity. After a pause, check that it is still enabled in **Actions**.
- A forked public repository starts with scheduled workflows disabled.
- A scheduled run can start late, and GitHub can drop it under high load. No job may depend on an exact time.
- Scheduled check: secrets of the environment `production`, with `environment: { name: production, deployment: false }` (no deployment object). A variable that a job `if` reads stays at repository level. → [WHY](../WHY.md#why-github-actions-and-not-workers-builds)

## Plans

- Check the plan before you set up environments. → [SETUP](SETUP.md)
- Private repository on GitHub Free: no environments, no environment secrets, no protected branches, no repository rules.
- Private repository: GitHub Pro or Team. Environments and deployment branches and tags work there, as [DEPLOY](DEPLOY.md#ci) needs.
- Public repository: these work on every plan.

## Cost

### Prices

Prices checked 2026-11-05, in USD, without tax.

| Service | Public repository | Private, Free | Private, Pro | Private, Team | Extra |
| --- | --- | --- | --- | --- | --- |
| GitHub plan, per user per month | Same plan price | $0 | Not shown on the pricing page | $4 | Enterprise $21 |
| Actions, standard Linux runner | Free | $12 included per month (about 2,000 minutes) | $18 included (about 3,000 minutes) | $18 included (about 3,000 minutes) | $0.006 per minute; usage stops at the included amount without a payment method |
| Actions artifacts and Packages storage | Not stated | 500 MB | 1 GB | 2 GB | $0.25 per GB-month |
| Actions cache | Not stated | 10 GB per repository | 10 GB per repository | 10 GB per repository | $0.07 per GB-month, only when you raise the limit |
| Dependabot version and security updates | Free | Free | Free | Free | None |
| Environments | Yes | No | Yes | Yes | None |
| Repository rules | Yes | No | Not stated | Not stated | None |
| Secret scanning and CodeQL | Free | No | Not stated | Paid add-on | Price not checked |
| Lighthouse CI | Free | Free | Free | Free | Uses Actions minutes |
| PageSpeed Insights API | Free | Free | Free | Free | Google's docs state no price or quota. Third-party sources say free, 25,000 queries per day. Check **Quotas** in Google Cloud Console. |

- Check before a plan decision: [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Actions limits](https://docs.github.com/en/actions/reference/limits), [GitHub pricing](https://github.com/pricing), [environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).
- Job limit: 6 hours. Free plan: 20 concurrent jobs.

### Price checks

- Check the prices in this file every 3 months, before each plan decision, and when GitHub or Google announces a pricing change. → [WHY](../WHY.md#why-prices-get-checked-every-3-months)
- Update the `Prices checked` date in the same commit, also when no price changed.
- Next check: 2027-02-05.
