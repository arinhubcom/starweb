# GITHUB

This file covers GitHub Actions rules, GitHub plans, and GitHub cost. Read it before you add a workflow, set up environments, or choose a plan.

## Write a workflow

### Workflow rules

- Use [GitHub Actions](STACK.md#github-actions) for CI.
- Pin each action to a full commit SHA with a version comment. See [DEPS](DEPS.md#dependabot).
- Set top-level `permissions: contents: read`. Grant more only on the job that needs it.
- Set `timeout-minutes` on each job.
- Do not use `pull_request_target`. Forks get no secrets. See [DEPLOY](DEPLOY.md#pr-preview-workflow).
- Pass secrets and variables through `env`. Do not use `${{ }}` inside `run`.
- For checks, set `concurrency` with `cancel-in-progress: true`.
- For deploys, set `cancel-in-progress: false`. See [DEPLOY](DEPLOY.md#dev-deploy-workflow).

### Slow checks

- Give a slow optional check its own workflow. It runs next to the PR workflow and does not delay it.
- Add a `paths` filter on the files that can change its result.
- Skip draft pull requests.
- Use a warning annotation only. Never make it a required check. See [PERF](PERF.md).

### Scheduled workflows

- In a public repository, GitHub disables a scheduled workflow after 60 days without repository activity.
- After a pause, check in **Actions** that the workflow is still enabled.
- A forked public repository starts with scheduled workflows disabled.
- A scheduled run can start late, and GitHub can drop it under high load. No job may depend on an exact time.
- Give a scheduled check the secrets of the environment `production`, with `environment: { name: production, deployment: false }`. This creates no deployment object.
- Keep a variable that a job `if` reads at repository level. See [WHY](../WHY.md#why-github-actions-and-not-workers-builds).

## Choose a plan

- Check the plan before you set up environments. See [SETUP](SETUP.md).
- A private repository on GitHub Free has no environments, no environment secrets, no protected branches, and no repository rules.
- For a private repository, use GitHub Pro or Team. Environments and deployment branches and tags work there, as [DEPLOY](DEPLOY.md#github-environments) needs.
- In a public repository, these work on every plan.

## Check the cost

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
- For Cloudflare prices, see [CLOUDFLARE](CLOUDFLARE.md#look-up-a-price).
- The job limit is 6 hours. The Free plan allows 20 concurrent jobs.

### Check the prices again

- Check the prices in this file every 3 months, before each plan decision, and when GitHub or Google announces a pricing change.
- See [WHY](../WHY.md#why-prices-get-checked-every-3-months).
- Update the `Prices checked` date in the same commit, also when no price changed.
- Next check: 2027-02-05.
