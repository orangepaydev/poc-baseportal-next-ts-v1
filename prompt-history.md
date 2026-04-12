## 2026-04-11 03:12:55 +08 - Database Query Result Limit

- Task: Check all database query implementations for a result-set size limit. If missing, add a configurable environment variable with a hard cap of 10,000 rows and add the variable to `.env.example`.

## 2026-04-11 03:18:52 +08 - Stable Query Ordering And Client Sorting

- Task: Add deterministic default ordering to query listings by including `id` as the fallback sort key, and add client-side sorting for loaded result rows without re-running the query.

## 2026-04-11 03:25:40 +08 - Descending Id Tie-Breaker

- Task: Update the default query ordering so the `id` tie-breaker sorts in descending order instead of ascending order.

## 2026-04-11 03:29:14 +08 - Audit Log Search Event Time Range

- Task: In `src/app/(workspace)/admin/audit-log/page.tsx`, add Audit Log search filters for event time start and end range and apply them in the backing audit event query.

## 2026-04-11 07:17:46 +08 - Audit Log Browser Local Time

- Task: In the Audit Log search page, render audit event timestamps in the browser's local time and convert browser-local Event Time Start and Event Time End inputs into UTC before querying the backend.

## 2026-04-11 07:22:12 +08 - Audit Log Detail Browser Local Time

- Task: Apply the same browser-local timestamp rendering used by the Audit Log search page to the Audit Log detail page.
