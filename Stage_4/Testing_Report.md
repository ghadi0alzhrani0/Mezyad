# Stage 4 — Quality Assurance & Execution Evidence

**Snapshot:** 13 October 2026 · **Status:** Approved Figma account UI, account integration and catalog identity tested locally; full marketplace acceptance remains pending.

**Tested source:** `feature/account-integration`, uncommitted working tree based on
`86028b4ffc703550f0f4cf185ff2e996b628ed27`. These results do not describe the
unchanged remote `main` branch or claim that a reviewed release has been delivered.

**Environment:** macOS 27.0.1 (Apple Silicon), Node.js 24.19.0, Docker Desktop
4.94.0, PostgreSQL 16.15, Vite 6.4.4 and Vitest 4.1.11. Browser checks used the
Codex in-app browser; physical-device compatibility was not tested.

## 1. Environment and commands

| Component | Prerequisite | Execution command | Verified result |
|---|---|---|---|
| DB | Disposable PostgreSQL 16.15 | Existing `database/migrations/001_schema.sql`, via `psql -v ON_ERROR_STOP=1` in the test container | PASS — ten tables and indexes created |
| DB seed | Migrated demo test DB | Existing `database/seeds/001_categories.sql`, via `psql -v ON_ERROR_STOP=1` | PASS — five categories inserted |
| Backend syntax | Node 24.19.0 + dependencies | `cd backend && npm run check` | PASS |
| Backend tests | Dedicated PostgreSQL test DB | `cd backend && TEST_DATABASE_URL=… npm test` | PASS — 22 runner entries, 0 failed, 0 skipped |
| Frontend tests | Vitest 4.1.11, jsdom | `cd frontend && npm test` | PASS — 30 tests in three files, 0 failed, 0 skipped |
| React bundle | Vite 6.4.4 | `cd frontend && npm run build` | PASS — 33 modules transformed |
| Account/browser integration | Running PostgreSQL/API/React | Register/login/logout; auction → login reload → same auction; category/gallery identity | PASS — account and browsing subset only |
| Full marketplace E2E | Complete listing/private/bidding UI + provider access | Public/private auction journeys | NOT RUN |

Lockfiles have been generated locally for both workspaces. Clean installation
using `npm ci --ignore-scripts --no-audit --no-fund` passed in each workspace;
the tests and build above passed after that installation. An earlier offline
frontend installation failed because the local npm cache lacked `yallist`;
installation with registry access resolved it. Neither lockfile is uploaded yet.

## 2. Full Stage 3 traceability

| ID | Check | Status |
|---|---|---|
| QA-01 | Duplicate email → 409 | PASS — PostgreSQL integration + Arabic UI feedback test |
| QA-02 | Wrong password → 401 | PASS — PostgreSQL integration + UI test + browser check |
| QA-03 | Non-admin review → 403 | PASS — USER denied; separately provisioned ADMIN approved test listing |
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
| QA-14 | Empty/loading/error UI states | PARTIAL — account loading/error/retry states tested; empty public list observed; other journeys pending |
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

## 4. Account and approved UI execution evidence — 13 October 2026

The backend run after catalog integration completed with `tests 22`, `pass 22`,
`fail 0`, `skipped 0` in approximately 8.4 seconds. This count includes the
parent integration test: 14 PostgreSQL subtests, five HTTP validation tests, the
health test, the money test, and the parent entry. It is not 22 independent
database scenarios.

The frontend run at 15:47 Riyadh time completed with `Test Files 3 passed`
and `Tests 30 passed`, in approximately 1.88 seconds. These component/client
tests use controlled responses; the separate browser check used a real Express
server and PostgreSQL database.

Additional verified account behavior:

- Normalized email, bcrypt password hashing, and fixed USER role on registration.
- Two simultaneous registrations for one email produce one account and one 409.
- Opaque session tokens are hashed in storage; missing, forged and expired tokens are denied.
- Logout revokes the current session without revoking another valid session.
- Passwords are cleared after registration/login and are not persisted in browser storage.
- A malformed successful response cannot produce a false registration/login success.
- Restored sessions are verified against the server before the account is shown.
- Network failures offer retry; failed logout does not claim success or discard the session.
- Public catalog records retain their own title, category and image; private metadata is excluded.
- Gallery data and description belong to the requested auction's listing.
- Category filters, item-specific navigation, return after login/reload and mismatched-response rejection are tested.
- Five-second polling updates prices; countdowns use English digits and stop at zero.
- Unavailable participation does not claim banking eligibility or submit a bid.

The plain account interface and standalone preview were removed. The application
now uses the approved Figma assets, color tokens and Arabic fonts, with local
font license texts. Twelve bundled image/font assets passed checksum checks.
At a 1440 px viewport the logo measured x=1180, y=6, width=178, height=62, and
the hero panel measured y=363, width=540, height=320, matching those reference
slots. Both fonts and all homepage images loaded. These are DOM/asset checks,
not a screenshot-based claim of pixel-perfect rendering.

The real browser journey reproduced an auction-return defect on login reload.
After fixing it, reload and login returned to the same Porsche ID, primary image
and three source thumbnails. Switching a thumbnail retained the same listing;
the property filter opened the Hittin villa with its own image and three empty
additional-photo slots. The actual participation endpoint returned its existing
503 unavailable-provider error; no commitment or bid was recorded as successful.

The three homepage examples are opt-in fictional test-database fixtures using
the approved design's images and scenario opening prices. They contain no real
bids, bank approvals, customer data or evidence of current market availability.
Phone collection and password recovery remain disabled pending approved
contracts; other listing/private/bidding journeys remain incomplete.

The browser check ran against API port `43117`, UI port `43118`, and the isolated
`mezyad_accounts_demo_test` database. It used fictional `example.invalid`
accounts, not customer data. Server-side session expiry was applied to that
fixture only, and reload returned to login with an Arabic explanation.

Responsive checks used 320, 390, 768 and 1440 px browser viewports. The measured
document width matched each viewport, and account controls stayed within it;
320 px validation focused the first invalid field correctly. This is viewport
testing, not proof of behavior on every physical phone or browser. No screenshots,
videos or browser traces were captured. The temporary viewport override was reset.

Dependency audits returned zero known vulnerabilities for backend production
dependencies and the complete frontend dependency tree on this date. This is
not a claim that the application has no security defects.

The account GitHub Actions workflow is prepared locally but has **not** been
uploaded or executed on GitHub. Ordinary account CI needs no banking credentials.

**Environment setup failures:** Native PostgreSQL initialization was blocked by
sandbox shared-memory restrictions, and the first connection attempt failed.
Docker Desktop subsequently started; all reported database passes above used
the working PostgreSQL 16.15 container, not that failed native instance.

**Protected deliverables:** Stage 1–3 and the existing database migration remain
unchanged. Stage 3 SHA-256 remains
`f41b15604e29da6f0982aa1c6367275307c80c38f8ce5c2ec3f3fd69cc40a11d`.

## 5. Test evidence entry (complete after each future real run)

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

**Release decision:** Account changes are ready for review, with local execution
evidence. The full marketplace is NOT READY — full E2E, image validation and
genuine sandbox integration are not verified. Banking remains blocked by
authorized provider access; no real banking test was executed in this work.
