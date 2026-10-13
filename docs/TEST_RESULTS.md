# Executed test results

Test date: **2026-10-12**, Asia/Riyadh.

Remote delivery and CI evidence reviewed: **2026-10-13**, Asia/Riyadh.

Local tested implementation commit: **`54fa8dfc7aa9ce06bf32005d34e32867fb08c15b`**. Subsequent documentation-only commits record these results; they do not change the tested application or test code. Delivery through the signed-in GitHub browser creates separate commits; repository-tree comparison and remote CI provide the corresponding delivery evidence.

Baseline main: `07549f819a5d43394753592e9beb8ab73e4f76ed`. Branch: `chore/repository-alignment`.

## Environment and execution

The final run copied the committed repository into a clean Linux environment and installed dependencies with `npm ci`: Node.js **24.21.0**, npm **11.19.0**, Linux aarch64, PostgreSQL **16**, Vitest **5.0.4** and Playwright **1.64.0** with Chromium. It used separate disposable `mezyad_test` and `mezyad_e2e_test` databases. Banking was the explicitly labeled local mock, with no real money, customer data or bank credentials. The working tree was clean after this run.

The host macOS run also passed the API/React suites, lint and build. Docker was used as an optional isolated test environment, not made an application prerequisite. Browser installation and test dependencies are not committed.

| Command executed | Actual final result |
|---|---|
| `npm ci --cache /tmp/npm-cache` | Passed: fresh dependency installation in Linux |
| `npm run verify:stage3` | Passed: protected checksum and Git diff |
| `npm run verify:repository` | Passed: relative links, generated-file exclusions and known credential-pattern checks |
| `npm run lint` | Passed |
| `npm run format:check` | Passed; stage documents excluded from formatting |
| `npm run build` | Passed: backend syntax check and Vite production build |
| `npm run db:migrate` | Passed: ten core tables created in PostgreSQL |
| `npm run db:seed` | Passed: four categories seeded |
| `npm test` | Backend 46 passed / 1 skipped; frontend 16 passed |
| `npx playwright install --with-deps chromium` | Passed in the Linux browser-test environment |
| `npm run test:e2e` | 3 passed, approximately 43.4 seconds |
| `npm audit --audit-level=high` | Found 0 vulnerabilities in the installed dependency tree at this run |
| `git diff --exit-code HEAD -- Stage_3/Report.MD` and byte comparison | Passed: no Stage 3 change |
| `git status --short` | Empty after executing checks against the tested commit |

Database URLs and test credentials were supplied through environment variables. The database and browser harness apply migrations themselves; they never fall back to the runtime database URL. See the root README for separate disposable database setup.

## Counts

| Suite | Defined | Passed | Failed in final run | Skipped |
|---|---:|---:|---:|---:|
| Backend API/PostgreSQL/banking | 47 | 46 | 0 | 1 |
| Frontend components/forms/polling | 16 | 16 | 0 | 0 |
| Browser end-to-end journeys | 3 | 3 | 0 | 0 |
| **Total** | **66** | **65** | **0** | **1** |

The single skipped genuine banking test is also the single **Blocked** test; it is not an additional case. It cannot run without an approved provider operation, access and credentials. Passing mock tests are not evidence of genuine sandbox integration.

The database rollback test deliberately raised PostgreSQL error `P0001` through a test trigger. Its expected error log accompanies a passing rollback assertion; it is not an unresolved failure.

## Stage 3 QA mapping

IDs below refer to the unchanged QA table in [Stage 3](../Stage_3/Report.MD). Test names can be found in [backend API tests](../backend/tests/api.test.js), [banking tests](../backend/tests/banking.test.js), [React tests](../frontend/tests/ui.test.jsx) and [browser journeys](../frontend/tests/e2e/journeys.spec.js).

| Stage 3 ID | Executable coverage | Actual result |
|---|---|---|
| QA-01 | Duplicate email returns 409 and keeps one user | Passed |
| QA-02 | Wrong/unknown credentials return 401 without a session | Passed |
| QA-03 | Non-admin review denied; public ADMIN registration refused | Passed |
| QA-03A | Seller cannot commit or bid on their own auction | Passed |
| QA-03B | One USER sells and bids in another user's auction | Passed |
| QA-04 | Unapproved listing cannot become an auction | Passed |
| QA-05 | Wrong private code denied; valid grant is idempotent | Passed |
| QA-06 | Direct private details/history/image/commitment/bid access denied without a grant; public discovery excludes private auctions | Passed |
| QA-07 | Provider error, timeout, authentication error and invalid payload do not approve eligibility | Passed with mock; genuine sandbox Blocked / Not Tested |
| QA-08 | Below-minimum first bid leaves price and bid records unchanged | Passed |
| QA-09 | Concurrent duplicate UUID request is accepted at most once | Passed |
| QA-10 | Two equal simultaneous bids serialize; one is accepted and the second is too low | Passed |
| QA-11 | Server rejects a bid after the deadline, including a request waiting behind a row lock | Passed |
| QA-12 | Closure without bids records CLOSED with no winner | Passed |
| QA-13 | Repeated concurrent closure records one stable highest-bid result | Passed |
| QA-14 | Loading, empty, error and retry UI states | Passed |
| QA-15 | Browser: register → upload listing → admin approval → public auction → mock commitment → confirmation/bid → winning result → activity | Passed with mock |
| QA-16 | Browser: private auction → denied direct access → wrong code → valid code → mock commitment → bid → result | Passed with mock |
| QA-17 | Owner edits rejected listing, retains its image and resubmits to PENDING_REVIEW, through API and browser | Passed |
| QA-18 | First bid exactly equals starting price | Passed |
| QA-19 | Later bid below last accepted bid plus increment is rejected | Passed |
| QA-20 | Composite foreign key rejects a winner bid from another auction | Passed |
| QA-21 | Own listing and participation in another auction both appear in activity | Passed |
| QA-22 | Disguised MIME/signature, SVG, oversized and excess uploads rejected | Passed |
| QA-23 | Late bids denied before a page visit; result finalized only on next details access | Passed |

Additional executed coverage includes session expiry and logout, password hashing, cross-origin mutation rejection, private-code rate limiting, commitment retry/idempotency, provider response validation, exact prices above JavaScript's safe integer range, database rollback, countdown, polling refresh/recovery/cleanup, selected card ID navigation, editable description suggestions and result wording without payment or handover claims.

## Responsive browser coverage

The third Playwright journey used a **390 × 844** viewport. Registration, listing creation and rejected-listing correction/resubmission were exercised at that size; the resulting listing screen was asserted to use RTL and have no horizontal document overflow. The activity screen was then visited and the listing link checked.

This is responsive website coverage, not a separate mobile application. It does not establish visual correctness for every page, viewport or browser. Safari/iOS, Firefox and a complete cross-device visual review remain untested.

## Built-application smoke check

A separate local demo database was seeded using `npm run db:seed:demo`, followed by `npm start` after a production build. Actual HTTP checks returned:

- Home 200 with Arabic RTL markup.
- Public browsing 200, with only the public demonstration auction returned.
- Same-origin login 200.
- Explicit mock commitment 201, `mode: mock`.
- Bid 201 with exact accepted amount `1000.00`.

These smoke checks are separate from the 66-case automated count. The end-to-end journeys create their own users, listings and auctions through the application; no manual database edits are needed to demonstrate those journeys.

## Earlier execution issues and fixes

- Native macOS Chromium could not start under the sandbox's Mach-port restrictions. This was an environment failure before application checks, so browser testing moved to the isolated Linux environment.
- Initial browser runs failed because test label selectors matched wrapper text containing the selected or prefilled value. The selectors were corrected to accessible combobox/textbox roles. The final browser run passed all three journeys.
- The default host npm cache was not writable; a temporary task-specific cache was used without changing ownership or escalating privileges.

Earlier failed attempts are not counted as final passes. No screenshots or results were fabricated.

## Banking, CI and outstanding work

**Genuine Open Banking: Blocked / Not Tested.** SAB/SABB and Al Rajhi are researched candidates, not selected or connected providers. No supported Bid Commitment operation, eligibility rule, consent/callback contract or test credentials have been approved. The real adapter remains unconfigured and reports an explicit error; the local mock is isolated and refused in production. See [official research and owner-review findings](STAGE_3_REVIEW_NOTES.md).

**GitHub Actions: Passed.** [Run 38241578097](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/38241578097) for [Pull Request #1](https://github.com/ghadi0alzhrani0/Mezyad/pull/1), head `14c3d4030cd4de88e2ae6dd1dedfc2f59c21fb3d`, completed successfully on 2026-10-12. The validate job used Ubuntu, Node.js 24.21.0, npm 11.19.0 and a PostgreSQL 16 service. Its logs confirm lint, formatting, build, migration/seeding, API/React tests, Chromium journeys and both protected-file checks passed. Totals were 46 backend passed / 1 skipped, 16 frontend passed, and 3 browser passed (49.2 seconds for the browser suite). Genuine banking remained skipped, not verified.

The remote head and local delivery commit `6176cd0` had an identical Git tree, `8bb73cf3015ee7a94747c58180c9d232f5e1feca`; their file diff was empty. Commit IDs differ because delivery used the signed-in GitHub browser. Subsequent documentation-only changes record this evidence without changing application/test code. This records an actual completed CI run rather than predicting later run outcomes.

**Known limitations:** no unresolved application failure was observed in the final suites. A process crash during a commitment can leave PENDING without a provider reconciliation policy (R15). Unvisited ended auctions are intentionally finalized on access (R05), following Stage 3. Genuine banking, production deployment, penetration/load testing, full cross-device visual review and final academic acceptance remain outstanding. These are not described as completed features or assessments.

## Stage 3 byte protection

The protected file remains byte-for-byte identical to the fetched baseline. Original and final SHA-256:

```text
ddee288e3f33999b62fa044a8babe3b2747596674decfdb28879c1365b492db4
```

Its architecture, APIs, schema, Mermaid diagrams and QA table were not rewritten or formatted. Findings are recorded separately for owner review.
