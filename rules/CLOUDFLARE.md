# CLOUDFLARE

Plans and cost. Limits and budgets → [PERF](PERF.md). Plugins per plan → [CMS](CMS.md#plugins-on-workers-free-and-paid). Free plan rules → [SAAS](SAAS.md#workers-free-plan).

## Cost

### Prices

Prices checked 2026-11-04, in USD, without tax. Paid minimum: $5 per month per account.

| Service | Free | Paid included per month | Paid extra |
| --- | --- | --- | --- |
| Worker requests | 100,000 per day | 10 million | $0.30 per million |
| Worker CPU | 10 ms per invocation | 30 million ms | $0.02 per million ms |
| Static asset requests | Free, unlimited | Free, unlimited | None |
| D1 rows read | 5 million per day | 25 billion | $0.001 per million |
| D1 rows written | 100,000 per day | 50 million | $1.00 per million |
| D1 storage | 5 GB total, 500 MB per database | 5 GB, 10 GB per database | $0.75 per GB-month |
| R2 Standard storage | 10 GB-month | 10 GB-month | $0.015 per GB-month |
| R2 Class A operations | 1 million | 1 million | $4.50 per million |
| R2 Class B operations | 10 million | 10 million | $0.36 per million |
| R2 egress | Free | Free | None |
| Workers KV reads | 100,000 per day | 10 million | $0.50 per million |
| Workers KV writes | 1,000 per day | 1 million | $5.00 per million |
| Queues operations | 10,000 per day | 1 million | $0.40 per million |
| Images transformations | 5,000 unique per month, then error `9422` | See Images pricing | See Images pricing |
| Workers Logs events | 200,000 per day | 20 million | $0.60 per million; new pricing from 2026-12-01 |
| Dynamic Workers created | None | 1,000 unique | $0.002 per Dynamic Worker per day |

### Worker cost examples

Worker cost per month, with every request at the full 10 ms and no cache hits. D1, R2, and other services are extra.

| Requests per month | Requests | CPU | Total |
| --- | --- | --- | --- |
| Up to 100,000 per day | Free plan | Free plan | $0 |
| 10 million | Included | $1.40 | $6.40 |
| 30 million | $6.00 | $5.40 | $16.40 |
| 100 million | $27.00 | $19.40 | $51.40 |

- Total = $5 + requests + CPU.
- Check before a plan decision: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/), [R2](https://developers.cloudflare.com/r2/pricing/), [Workers KV](https://developers.cloudflare.com/kv/platform/pricing/), [Queues](https://developers.cloudflare.com/queues/platform/pricing/), [Images](https://developers.cloudflare.com/images/pricing/).
