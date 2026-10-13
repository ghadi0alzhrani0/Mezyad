# Database and API QA Report

**Prepared:** 13 October 2026. **Scope:** Database validation, synthetic seed data, API authorization, bidding concurrency, closure and integration review responsibilities. The reported results come from prior local automated execution. Individual execution or teammate review is not inferred from this handoff.

**Tested application baseline:** `d34d8cea88dcb308637f3610aa8f9373252aad08`, fetched from `main`. Only QA files, two backend script entries and Stage 4 evidence are proposed in this handoff. Application source, the existing migration, frontend assets and Stage 1–3 deliverables were not changed.

**Release decision: NOT READY for complete Stage 3 acceptance.** Supported database/API scenarios pass, but seven contract checks fail and four explicit test gates are skipped. A passing `npm test` alone is not a full marketplace acceptance result.

## 1. Files and responsibility

| File | Purpose |
|---|---|
| `backend/tests/database.test.js` | Twelve executable schema, relationship, status, uniqueness, money and index checks. |
| `backend/tests/marketplace.test.js` | Fifteen listing, review, ownership, private-access, commitment-boundary and activity API scenarios. |
| `backend/tests/bidding-closure.test.js` | Twenty-four bidding, duplicate-request, rollback, concurrent-lock, deadline and result scenarios. |
| `backend/tests/helpers/qa-fixtures.js` | Per-process disposable schemas, fake accounts/sessions and controlled lock synchronization. |
| `backend/tests/acceptance/qa.contract-gaps.test.js` | Seven unmet contract checks. They fail normally until the application is corrected; failures are not suppressed. |
| `backend/tests/acceptance/qa.external-blockers.test.js` | Four explicitly skipped external/incomplete gates, with reasons. |
| `backend/scripts/seed-qa.js` | Opt-in fake seed in a new isolated schema. Never creates banking SUCCESS, bids or results. |
| `backend/scripts/run-qa.js` | Runs existing backend regression plus all new QA/acceptance files; writes stdout, stderr, JUnit and a hash-bearing JSON summary. |
| `backend/package.json` | Adds `test:qa` and `seed:qa`; no dependencies or existing commands removed. |

The package contains no replacement database design. The current `database/migrations/001_schema.sql` is executed and tested unchanged. The same USER account acts as seller and bidder; an ADMIN test fixture is provisioned directly in the isolated database, not through public registration.

## 2. Prior executed results and renamed-file verification

**Evidence provenance:** The results below are from the previously executed local QA run. This handoff changes names and labels only. Database tests were not re-executed after renaming. Commands in this table are their equivalent current names, not claims of a new run. Syntax and import paths of the delivered files were checked separately.

**Environment:** macOS / arm64; Node.js 24.19.0; PostgreSQL 16.15 in a dedicated local Docker container; Vite 6.4.4; Vitest 4.1.11. Backend full-run start: `2026-10-13T17:34:24.651Z` (20:34:24 Riyadh). No screenshots or browser recordings were taken.

| Command/check | Actual result |
|---|---|
| `cd backend && npm ci` | Successful clean dependency installation using the existing lockfile. |
| `cd frontend && npm ci` | Successful clean dependency installation using the existing lockfile. |
| `cd backend && npm run check` | PASS — existing backend syntax checks. |
| `node --check` on eight added JavaScript files | PASS — all eight parse successfully. |
| `cd backend && TEST_DATABASE_URL=… npm test` | PASS — 73 runner entries, 73 passed, 0 failed, 0 skipped. Includes existing regression and 51 new supported-scenario tests. |
| `cd backend && TEST_DATABASE_URL=… node scripts/run-qa.js <evidence-dir>` | FAIL — 84 runner entries: 73 passed, 7 failed, 4 skipped, 0 cancelled. Exit code 1 is expected while the documented application gaps remain. |
| `cd frontend && npm test` | PASS — 30 tests across three files. These are existing component/client tests, not new browser E2E evidence. |
| `cd frontend && npm run build` | PASS — 33 modules transformed and a production bundle generated. |
| `node scripts/seed-qa.js qa_seed_evidence` | PASS — four fake accounts, five categories, six listings, four auctions, one private grant, two non-success commitments. |
| Repeat seed into the same schema | PASS guard — exit 1 with PostgreSQL `42P06`; existing seed was not overwritten. |
| Seed with a database name not ending in `_test` | PASS guard — rejected before connecting, exit 1. |
| Seed row assertions | PASS — zero SUCCESS commitments, zero bids, zero results. |
| Test cleanup | PASS — no transient `qa_*` test schemas left after execution; opt-in seed schemas remain intentionally separate. |

Node's totals include the existing account integration parent entry. JUnit contains **83 leaf cases: 72 passed, 7 failed, 4 skipped**. The new QA files contribute **62 leaf cases: 51 passed, 7 failed, 4 skipped**. These are counts of executable scenarios, not counts of distinct Stage 3 QA IDs.

The previous local outputs are supplied under `evidence/`. Personal names and local paths were normalized; numeric results and failure observations were preserved. Their original hashes are recorded separately. These are historical execution records, not a new database run after renaming. The package has not been committed, pushed or run in GitHub CI.

## 3. Database review

| Area | Verified finding | Evidence |
|---|---|---|
| Core schema | Exactly ten core tables, each with a primary key. No separate seller/bidder tables. | DB-01 |
| Accounts/sessions | Unique email and token hash; role restricted to USER/ADMIN; session user FK and cascade. | DB-02/03/11 |
| Listing relationships | Seller/category references reject orphans; images reference their item and cascade when an unauctioned item is deleted. | DB-03/11 |
| Approval state | PENDING_REVIEW/APPROVED/REJECTED checks; owner and admin rules enforced by the existing API. | DB-04; LIST-03/04; QA-03/04/17 |
| Auction relationship | Unique item ID permits one auction per listing. | DB-06; AUCT-01 |
| Visibility | PUBLIC requires no code hash; PRIVATE requires one. Creation stores a bcrypt hash and returns the raw code only to the creator. | DB-06; PRIVATE-01 |
| Grants/commitments | Unique `(auction_id,user_id)` for access and commitment; commitment status check. | DB-04/07 |
| Money/schedule | Four monetary columns use numeric(14,2); positive price/increment checks; end follows start. | DB-05/08 |
| Bid identity | Global unique request UUID; composite unique `(auction_id,id)` supports the result reference. | DB-08/09; QA-09 |
| Result integrity | One result per auction; nullable winner for no bids; composite FK rejects a winner from another auction. | DB-09/10; QA-12/13/20 |
| Time/indexes | Nine timestamp fields use `timestamptz`; all four named lookup indexes exist. | DB-12 |
| Application-owned rules | Own-auction bidding, approved listing ownership and successful commitment checks remain backend responsibilities. No unapproved schema extension was introduced. | QA-03A/B/04; BID-02 |

SQL constraint tests intentionally provoke errors such as `23503`, `23505` and `23514` and assert those exact codes. Controlled failure-injection triggers exist only inside disposable test schemas and are removed; they are not migrations or application changes.

## 4. Concurrency and closure evidence

- Two clients queue behind a deliberately held auction row lock. `pg_stat_activity` confirms both are waiting before the lock is released. One same-price bid succeeds; the other receives `BID_TOO_LOW`. A subsequent valid increment succeeds.
- Two requests sharing one UUID yield one accepted bid and one duplicate response. Cross-auction UUID reuse also leaves the losing auction's price unchanged.
- A database failure after bid insertion proves the entire transaction rolls back: no saved bid and no changed price. Removing the test fault allows a fresh request to succeed.
- A bid waiting on a row lock receives updated state after release and rejects an expired deadline. Server time is evaluated after the wait.
- Ended auctions close with either the highest accepted bid or a null winner. Concurrent/repeated detail requests persist one stable result.
- Failure during result insertion rolls back CLOSED status and allows a later request to retry.
- In one controlled race, a bid and closure both proceed after the deadline: no late bid or winner is created. In another, a bid validates before the deadline and holds the row while closure waits; it commits and becomes the winning result.
- No detail visit is needed for late-bid rejection. The next detail request finalizes the result, matching Stage 3's access-triggered closure design.

Successful commitments used to reach bidding code paths are direct **synthetic database fixtures** marked `LOCAL_QA_FIXTURE_NOT_BANK_VERIFIED`. They test downstream rules only. No real provider response, balance, reservation, payment, eligibility approval or transfer is claimed.

## 5. Stage 3 QA traceability

| ID | Latest result in this handoff | Executable evidence / limitation |
|---|---|---|
| QA-01 | PASS | Existing PostgreSQL account duplicate-email regression, rerun. |
| QA-02 | PASS | Existing wrong-password/no-session regression, rerun. |
| QA-03 | PASS | USER denied, trusted ADMIN review allowed and reviewer persisted. |
| QA-03A | PASS with synthetic commitment | Own-auction bid denied. |
| QA-03B | PASS with synthetic commitment | Same USER owns one auction and bids in another. |
| QA-04 | PASS API approval/ownership boundary | Pending/rejected or another owner's listing cannot be auctioned. Image contract remains incomplete. |
| QA-05 | PASS wrong-code boundary; security gate incomplete | Wrong code saves no grant; brute-force throttling remains absent. |
| QA-06 | PARTIAL | Private data/bids denied without grant, but error differences expose existence (QA-F06). |
| QA-07 | PARTIAL / genuine integration BLOCKED | Local unavailable-provider response fails closed; no false SUCCESS. Real provider failure/timeout not tested. |
| QA-08 | PASS with synthetic commitment | Low first bid rejected; price unchanged. |
| QA-09 | PASS with synthetic commitment | Sequential/concurrent retries and cross-auction UUID collision. |
| QA-10 | PASS with synthetic commitment | Two actual PostgreSQL clients, observed row-lock waiting and consistent prices. |
| QA-11 | PASS with synthetic commitment | Scheduled/expired/closed denial, lock-wait deadline revalidation. |
| QA-12 | PASS | No-bid closure has null winner. |
| QA-13 | PASS | Repeated/concurrent closure yields one stable result. |
| QA-14 | PARTIAL existing React regression only | Account loading/error tests rerun; complete marketplace UX not tested. |
| QA-15 | NOT RUN / BLOCKED complete browser journey | API components tested separately; genuine commitment and remaining UI needed. |
| QA-16 | NOT RUN / BLOCKED complete browser journey | Private API components tested separately; not a complete browser E2E. |
| QA-17 | PARTIAL | Title/description resubmission and review reset pass; corrected category fields are ignored (QA-F02). |
| QA-18 | PASS with synthetic commitment | First bid equals starting price. |
| QA-19 | PASS with synthetic commitment | Later bid requires last price plus increment, including decimal cents. |
| QA-20 | PASS | Composite FK refuses winning bid from another auction. |
| QA-21 | PARTIAL — API PASS | `/me/items` and `/me/auctions` include own listing/auction and other bids; My Activity browser screen not tested. |
| QA-22 | BLOCKED | Real upload pipeline missing (QA-F01); MIME/extension/size limits and storage need agreement. |
| QA-23 | PASS with synthetic commitment | Late bid rejected before page access; next detail request finalizes result. |

## 6. Reproduced findings

All findings below are **OPEN**. Fix ownership follows the backend team, with the QA team verifying the relevant QA cases. No fixing PR or verified retest is claimed. `GAP-*` below names the new acceptance test; `QA-F*` is the defect namespace and does not replace the existing Bug Tracker IDs.

| Finding | Priority | Stage 3 basis | Reproduction and actual result | Expected / next action |
|---|---|---|---|---|
| QA-F01 / GAP-01 | High | §7.1–7.2 listing multipart/images | Submit a valid 1×1 PNG with listing fields. API returns 400 `INVALID_INPUT`, not a saved listing/image. | Implement the upload contract after owner chooses field names, types, sizes and storage. Then run valid/invalid image checks. |
| QA-F02 / GAP-02 | Medium | §5.3 and §7.2 rejected listing corrected fields | PATCH a rejected listing with changed `categoryFields`. Response is 200 but JSON retains the old values. | Persist validated category-specific changes on resubmission and apply corresponding image edits when available. |
| QA-F03 / GAP-03 | Medium | §7.1 validation/client errors | ADMIN reviews `/admin/items/not-a-uuid/review`. Response is 500; DB code `22P02`. | Validate identifier before SQL and return a documented safe 400. Inspect other unvalidated ID routes too. |
| QA-F04 / GAP-04 | Medium | §5.2 title storage and §7.2 listing validation | POST title of 241 characters. Response is 500; DB code `22001`. | Enforce the existing 240-character storage limit at the request boundary, return 400 and preserve no listing. |
| QA-F05 / GAP-05 | Medium | §5.3 admin rejection reason | Reject with three spaces as reason. Response is 200 and stores an empty meaningful reason. | Trim and reject blank reasons before updating review state. This is semantic validation, not a scope change. |
| QA-F06 / GAP-06 | High | §5.3 and §7.1 private existence protection | Unauthorized private bid returns 403 `NO_ACCESS`; nonexistent auction returns 404 `NOT_FOUND`. | Align safe denial envelopes so outsiders cannot distinguish private existence; retain internal audit reasons. |
| QA-F07 / GAP-07 | Medium | §7.2 public filters/status | GET `/auctions?status=CLOSED` returns an active auction too. | Implement and document server-side status filtering, validate values and define remaining filter/paging parameters. |

One additional security gap was confirmed by source inspection: no invalid-code attempt limiter is installed on `/auctions/:id/access`. No numeric throttling threshold/window is specified, so a bounded brute-force test was not invented. **QA-R01: High; Pending Owner Review** — agree the policy and implement/test 429 throttling.

## 7. Pending decisions and remaining work

| Item | State / impact | Next owner action |
|---|---|---|
| Banking provider, authorized sandbox operation, credentials and consent/result mapping | BLOCKED genuine commitment success/failure/timeout. Current API safely returns 503 and creates no approval. | Backend pair/project owner verifies the Stage 3 integration contract. The QA team then tests actual outcomes with redacted evidence. |
| Image field names, allowed MIME/extensions, byte limit and storage | Missing contract details plus missing implementation; QA-22 cannot run meaningfully. | Owner/backend pair specifies limits and storage; the frontend team connects UI. |
| Private-code limit/window and safe-denial policy | Security gap; exact throttle acceptance threshold unavailable. | Backend pair/owner agrees policy; The QA team adds executable 429 checks. |
| Public filters and bid-history paging names/defaults | Status filter currently ignored; other parameter names/defaults are unspecified. | Complete the API contract separately, preserving Stage 3 until owner review. |
| Category-specific required fields | `category_fields` accepts a JSON object but category-specific required fields/ranges are unspecified. | Owner defines each category's rules; QA adds positive/negative boundaries. |
| Browser public/private/listing/admin/bid/result journeys | NOT RUN as complete E2E here; existing React tests only provide component/client regression. | The QA team executes after remaining UI/provider work, without claiming fixture success as bank proof. |
| Reviews/stand-ups/retrospectives | No meeting evidence was generated or inferred. | Team records actual events. |

## 8. Re-run and handoff

From `backend`, set `TEST_DATABASE_URL` to a dedicated PostgreSQL database whose name ends in `_test`, then run:

```sh
npm ci
npm run check
npm test
npm run test:qa -- /tmp/database-evidence
```

The complete runner initializes the existing schema in that disposable database for account regressions, then isolates new fixtures in per-process schemas. It never falls back to `DATABASE_URL` when `TEST_DATABASE_URL` is missing. `test:qa` should currently return exit 1 because seven acceptance checks genuinely fail. Do not omit those checks or relabel them as passes.

Optional seed:

```sh
npm run seed:qa -- qa_seed
```

The seed requires the same `_test` guard, refuses an existing schema, and uses `example.invalid` identities. Its documented default password is strictly a local fake-fixture credential. Set `QA_SEED_PASSWORD` if needed; no password is printed in the generated seed output. Seed scenarios intentionally cannot bypass the genuine banking integration gate.

Before uploading, read the source, re-run against a disposable database, add evidence of the actual run, review findings with the backend team and open a reviewable change. GitHub CI was not executed for this package. Do not mark S4-02 or the entire project DONE solely from this prepared handoff.

## 9. Protected deliverables

`Stage_3/Report.MD` is byte-for-byte unchanged. SHA-256 before and after:

```text
f41b15604e29da6f0982aa1c6367275307c80c38f8ce5c2ec3f3fd69cc40a11d
```

The original application source, migrations, seeds, frontend implementation and Stage 1–3 files match the tested baseline. No files were deleted, no GitHub upload occurred and no database/schema design was changed.
