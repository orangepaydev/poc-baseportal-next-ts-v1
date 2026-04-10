## 2026-04-11 03:12:55 +08 - Database Query Result Limit

- Task: Check all database query implementations for a result-set size limit. If missing, add a configurable environment variable with a hard cap of 10,000 rows and add the variable to `.env.example`.

## 2026-04-11 03:18:52 +08 - Stable Query Ordering And Client Sorting

- Task: Add deterministic default ordering to query listings by including `id` as the fallback sort key, and add client-side sorting for loaded result rows without re-running the query.

## 2026-04-11 03:25:40 +08 - Descending Id Tie-Breaker

- Task: Update the default query ordering so the `id` tie-breaker sorts in descending order instead of ascending order.
