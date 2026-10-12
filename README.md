# Mezyad | مِزياد

Mezyad is a web auction application for high-value assets. Sellers submit listings for review; members participate in public or private auctions and receive a recorded result. [Stage 3](Stage_3/Report.MD) is the protected technical specification.

## Problem being solved

High-value auctions need clear asset information, controlled participation, reliable bid validation and an unambiguous ending. Mezyad combines these steps without implementing financial settlement or handover.

## Current MVP scope

Registration/login/logout, structured listings with images, owner editing and resubmission, admin review, public/private auctions, Bid Commitment, accepted bid history, auction results and My Activity. The UI includes Arabic RTL screens, polling, bid confirmation and an editable description suggestion.

Socket.io, Redis, anti-sniping, escrow, payments, Sold status, Nafath, Apple Pay and the earlier six-function assistant are outside the current implementation.

## User roles

**USER** is one account for selling and bidding on other members' auctions. A user cannot bid on their own auction. **ADMIN** reviews listings and monitors auctions. Public registration cannot create administrators.

## Auction workflow

Register/sign in → submit listing/images → admin review → create public/private auction → obtain private access when needed → Bid Commitment → confirm and submit a bid → auction result.

The server rejects bids at or after the deadline. Results are finalized on the next details request using the same auction-row lock as bidding. The workflow ends at the result.

## Architecture

A React client calls one Express REST backend under `/api/v1`. PostgreSQL is authoritative for permissions, prices and deadlines. Bid insertion and price updates commit together under `SELECT ... FOR UPDATE`. The UI polls; its countdown cannot authorize a bid. Banking logic sits behind a separate provider interface.

## Technology stack

Node.js 24 LTS, React/Vite, Express, PostgreSQL 16+, SQL migrations, Vitest, Supertest and Playwright. npm workspaces provide shared commands; the lockfile makes installation reproducible. Docker is optional.

## Repository structure

```text
Stage_1/        Original research and idea-development deliverables
Stage_2/        Original charter and assignment overview
Stage_3/        Protected technical report
frontend/       React screens and component tests
backend/        Express services and API/database tests
database/       PostgreSQL migrations and fictional seeds
docs/           Audit, owner-review findings and executed test results
scripts/        Development, verification and database tools
.github/        Pull-request CI
```

## Installation prerequisites

Node.js 24 LTS, npm, Git, PostgreSQL 16+ and a browser. Docker can run PostgreSQL locally but is not required for the application.

## Local setup

```bash
git clone https://github.com/ghadi0alzhrani0/Mezyad.git
cd Mezyad
git switch chore/repository-alignment
npm ci
cp .env.example .env
```

Configure your local database URL and a random session secret of at least 32 characters. Never commit `.env`. For local mock demonstrations explicitly select `BANK_ADAPTER=mock` and `ALLOW_MOCK_BANK=true`. Production rejects mock mode.

## Environment variables

| Variable | Purpose |
|---|---|
| NODE_ENV / PORT / HOST | Application mode, Express port (default 3000) and bind address (default 127.0.0.1) |
| DATABASE_URL | Runtime PostgreSQL connection |
| TEST_DATABASE_URL | Disposable test database; tests never default to the runtime URL |
| E2E_DATABASE_URL | Separate disposable browser-test database, also ending in `_test` |
| SESSION_SECRET | Session-token hashing secret; at least 32 characters |
| FRONTEND_ORIGIN | Browser origin; local development defaults to http://localhost:5173. Production must supply the deployed origin |
| UPLOAD_DIR | Ignored local image directory |
| BANK_ADAPTER | unconfigured by default; mock is local only |
| ALLOW_MOCK_BANK | Explicit opt-in for the non-financial mock |
| BANK_SANDBOX_BASE_URL | Reserved for the approved sandbox host |
| BANK_SANDBOX_CLIENT_ID / CLIENT_SECRET | Reserved credentials; unused until operation approval |
| BANK_TIMEOUT_MS | Adapter timeout |
| SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD | Supplied locally for optional fictional demo accounts |

## Database setup

Create a database, set `DATABASE_URL`, then run:

```bash
npm run db:migrate
npm run db:seed
```

The migrations create exactly the ten core ERD tables and can be run again safely. Category seeding is repeatable. Timestamps use PostgreSQL `TIMESTAMPTZ`; prices use `NUMERIC(18,2)` and decimal strings in API responses. Send monetary amounts as decimal strings to preserve exact cents. Optional fictional demonstration accounts and listings:

```bash
SEED_ADMIN_PASSWORD='choose-a-local-admin-password' \
SEED_USER_PASSWORD='choose-a-local-user-password' npm run db:seed:demo
```

Emails are `admin@example.test`, `seller@example.test` and `bidder@example.test`. No real customers or completed sales are represented. Do not seed customer databases.

Optional local PostgreSQL container:

```bash
docker run --name mezyad-postgres \
  -e POSTGRES_USER=mezyad -e POSTGRES_PASSWORD=local_only \
  -e POSTGRES_DB=mezyad -p 127.0.0.1:5432:5432 -d postgres:16-alpine
```

Use the corresponding local URL in `.env`. These credentials are disposable local examples.

## Running frontend and backend

```bash
npm run dev
```

Open http://localhost:5173. Vite proxies API and image requests to Express. Separate commands:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
npm run build
npm start
```

After building, Express serves the frontend at http://localhost:3000. Image authorization applies in both modes.

## Running tests

Create two disposable PostgreSQL databases, such as `mezyad_test` and `mezyad_e2e_test`, and set their URLs in `.env` as `TEST_DATABASE_URL` and `E2E_DATABASE_URL`. Both names must end in `_test`. Backend and browser tests apply migrations and **truncate their test database tables**; never point either variable at data you want to retain. Browser tests use port 3001 and the built frontend.

```bash
npm run verify:stage3
npm run verify:repository
npm run lint
npm run format:check
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

On Linux, use `npx playwright install --with-deps chromium` if browser system libraries are missing. Normal CI uses a PostgreSQL test service and mock banking without bank credentials. Genuine sandbox tests are separate and remain blocked without approved access.

The executed clean-environment run passed **65 tests**, with **1 genuine banking test skipped because access is blocked** and no final failures. This includes 3 real-browser journeys. The responsive check uses a 390 × 844 viewport in the rejected-listing resubmission journey; it is not a claim of testing every page on every mobile browser. See [commands, QA mapping and limitations](docs/TEST_RESULTS.md).

## Open Banking integration status

**Blocked / Not Tested:** no provider selected, no credentials obtained and no approved operation/consent/eligibility contract. SAB/SABB and Al Rajhi remain candidates. See [official research and missing approvals](docs/STAGE_3_REVIEW_NOTES.md).

A successful bank HTTP call does not automatically prove eligibility. No invented funds-hold, proof-of-funds, transfer or SMS API is implemented. The mock uses no money or banking data, is labeled in the UI/API and is refused in production.

## Project stages and links

| Stage | Deliverable |
|---|---|
| 1 — Idea Development | [Overview](Stage_1/README.MD), [original report](Stage_1/Report.MD) |
| 2 — Project Charter | [Overview](Stage_2/README.MD), [original charter](Stage_2/Report.MD) |
| 3 — Technical Documentation | [Protected report](Stage_3/Report.MD) |
| 4 — Implementation | frontend/, backend/ and database/ |
| 5 — Closure | Final academic presentation remains Planned |

## Current implementation status

| Area | Status | Evidence |
|---|---|---|
| Stage 3 protection | Tested | Original SHA-256 recorded in audit; verification checks file bytes |
| Documentation alignment | Implemented | Five baseline documents aligned while preserving historical reports |
| Application/database | Implemented / Tested | React/Express application and ten-table PostgreSQL schema; API and browser tests |
| Local banking mock | Implemented / Tested | Explicit local/test opt-in, failure tests, production rejection |
| Automated tests | Tested | 65 passed, 0 failed, 1 skipped in the recorded clean Linux run |
| CI configuration | Implemented | GitHub Actions runs database, API, React and browser checks; remote run is separate from local evidence |
| Genuine banking sandbox | Blocked | Access and contract unavailable |
| Production deployment / final academic acceptance | Planned | Neither is claimed |

See [repository audit](docs/REPOSITORY_AUDIT.md), [owner-review findings](docs/STAGE_3_REVIEW_NOTES.md) and [executed test results](docs/TEST_RESULTS.md). Genuine banking and production readiness are not claimed.

## Team members

- Ghadi Alzhrani
- Abeer Alsayari
- Tala Alhudhaybi
- Aseel Alzhrani

Historical responsibility allocations remain in the reports. Implementation is reviewed through pull requests before merging.
