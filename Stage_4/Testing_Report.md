# Stage 4 — Quality Assurance & Execution Evidence

**Snapshot:** 12 October 2026 · **Status:** No verified execution logs have been supplied.

## 1. Environment and commands

| Component | Prerequisite | Execution command | Verified result |
|---|---|---|---|
| DB | PostgreSQL, DATABASE_URL | `psql "$DATABASE_URL" -f database/migrations/001_schema.sql` | Not run |
| DB seed | Migrated DB | `psql "$DATABASE_URL" -f database/seeds/001_categories.sql` | Not run |
| Backend syntax | Node + npm deps | `cd backend && npm install && npm run check` | Not run |
| Backend tests | Node + npm deps | `cd backend && npm test` | Not run |
| React bundle | Node + npm deps | `cd frontend && npm install && npm run build` | Not run |
| E2E | Running DB/API/UI | Browser journey | Not run |

**Important:** No lockfile is committed, so use `npm install` rather than `npm ci` until lockfiles are generated. The existing `backend/tests/health.test.js` is test *source*, not proof of a passing run.

## 2. Full Stage 3 traceability

| ID | Check | Status |
|---|---|---|
| QA-01 | Duplicate email → 409 | NOT RUN |
| QA-02 | Wrong password → 401 | NOT RUN |
| QA-03 | Non-admin review → 403 | NOT RUN |
| QA-03A | Seller cannot bid own auction | NOT RUN |
| QA-03B | Same account can sell and bid elsewhere | NOT RUN |
| QA-04 | Auction from unapproved item rejected | NOT RUN |
| QA-05 | Invalid private code denied | NOT RUN |
| QA-06 | Direct private GET/bid denied | NOT RUN |
| QA-07 | Sandbox timeout/error → no false approval | NOT RUN |
| QA-08 | Bid below minimum rejected | NOT RUN |
| QA-09 | Duplicate requestId accepted at most once | NOT RUN |
| QA-10 | Simultaneous bids serialize consistently | NOT RUN |
| QA-11 | Bid at/after endTime rejected | NOT RUN |
| QA-12 | Close no-bid auction → no winner | NOT RUN |
| QA-13 | Repeated closure yields same result | NOT RUN |
| QA-14 | Empty/loading/error UI states | NOT RUN |
| QA-15 | Public auction E2E | NOT RUN |
| QA-16 | Private auction E2E | NOT RUN |
| QA-17 | Rejected item edit/resubmit | NOT RUN |
| QA-18 | First bid equals starting price | NOT RUN |
| QA-19 | Later bid below increment rejected | NOT RUN |
| QA-20 | Winner from another auction prohibited | NOT RUN |
| QA-21 | Own listing + other bids appear in activity | NOT RUN |
| QA-22 | Invalid/oversized image rejected | NOT RUN — feature missing |
| QA-23 | Late bid rejected; lazy closure finalized | NOT RUN |

## 3. High-risk test design

**Concurrent bidding:** Create two users with verified commitment; issue parallel requests for same auction and same threshold; assert accepted prices serialize, no duplicate `requestId`, and DB `current_price` equals highest accepted bid.

**Private auction:** Direct GET without grant → denied; incorrect code → denied; correct code → grant; verify no cross-user data leakage; add brute-force protection test when implemented.

**Banking:** Official authorized provider success/failure/timeout; preserve redacted request ID and response; never mark a simulated success as real integration.

**Closure:** No bids → no winner; repeat finalization → stable result; endTime passed → no late bids even before lazy closure; winner must belong to same auction.

## 4. Test evidence entry (complete after each real run)

| Field | Required |
|---|---|
| Date/time + executor | Actual run |
| Commit SHA | Tested source revision |
| Runtime | Node, PostgreSQL, browser versions |
| Test ID / command | Exact reproduction |
| Result | PASS / FAIL / BLOCKED / SKIPPED |
| Observed output | Logs or screenshot link |
| Bug | Issue ID if failed |
| Retest | Commit and result after fix |

**Release decision:** NOT READY — full E2E, image validation and genuine sandbox integration not verified.
