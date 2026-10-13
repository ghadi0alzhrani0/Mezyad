# Sprint Plan — Four One-Week Iterations

Duration: **one week per sprint**. Calendar dates must be agreed by the team; no dates are fabricated. Source: Stage 3 §8.1.

| Sprint | Priority | Tasks and acceptance checkpoint | Owner(s) | Dependencies |
|---|---|---|---|---|
| 1 — Foundation | Must | PostgreSQL schema and seeds; Express/React setup; registration/login; initial listing form. Demo: sign in and save listing. | Abeer + Tala DB; Abeer + Ghadi backend; Aseel + Ghadi UI | PostgreSQL and environment setup |
| 1 — Banking discovery | Must (dependency) | Verify real sandbox documentation, access and supported operation; record blockers. | Abeer + Ghadi | Provider approval |
| 2 — Auctions | Must | Admin review; approved listings; public/private auction creation and access. Demo: seller → admin → auction. | Abeer + Ghadi backend; Aseel + Ghadi UI; Tala QA | Sprint 1 auth and listings |
| 3 — Bidding | Must | Commitment adapter, atomic bids, bid history, closure and results. Demo: two concurrent bids consistent. | Abeer + Ghadi backend; Tala DB/QA; Aseel UI | Sprint 2; bank access for real integration |
| 4 — QA | Must | End-to-end public/private flows, accessibility, bug fixes, demo rehearsal. | All; Tala + Aseel QA | Sprints 1–3 |
| Later | Should | UI polish and extended test coverage | Aseel + Ghadi | Core flow |
| Deferred | Won't | Anti-sniping, push updates, real payments, escrow, KYC, handover | — | Out of current Stage 3 MVP |

## Definition of Done
Merged reviewed code, working acceptance scenario, passing relevant tests, documented failures, no secrets, and updated evidence. Unrun tests do not count as passed.

## SCM
Feature branches → pull request → at least one teammate review → merge to main after CI. Owner and reviewer assigned per task.
