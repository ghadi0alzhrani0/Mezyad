# Mezyad — Product Backlog & Sprint Board

**Baseline:** [Stage 3](../Stage_3/Report.MD) · **Main submission:** [Stage 4 Report](Report.MD)

**Status key:** `SOURCE` = source code exists but acceptance unverified; `TODO` = not implemented; `BLOCKED` = external dependency; `PENDING QA` = test evidence missing. None is equivalent to `DONE`.

| ID | Sprint | Priority | Work package | Owner | Dependency | Acceptance test | Status |
|---|---|---|---|---|---|---|---|
| S1-01 | 1 | Must | PostgreSQL ten-table schema and seed | Abeer, Tala | DB | Fresh migration + FK assertions | SOURCE |
| S1-02 | 1 | Must | Account register/login/logout | Abeer, Ghadi | S1-01 | QA-01/02 | SOURCE |
| S1-03 | 1 | Must | User/Admin session guard | Abeer, Ghadi | S1-02 | QA-03 | SOURCE |
| S1-04 | 1 | Must | Listing create/edit/resubmit API | Abeer, Ghadi | S1-02 | QA-17 | SOURCE |
| S1-05 | 1 | Must | Safe image upload + validation | Abeer, Ghadi; Aseel UI | S1-04 | QA-22 | TODO |
| S1-06 | 1 | Must | Registration/login/listing UI | Aseel, Ghadi | S1-02/04 | Browser flow | Partial SOURCE |
| S1-07 | 1–3 | Must | Verify real banking sandbox provider | Abeer, Ghadi | External authorization | Official request/response | BLOCKED |
| S2-01 | 2 | Must | Admin approve/reject API | Abeer, Ghadi | S1-04 | QA-03/04 | SOURCE |
| S2-02 | 2 | Must | Auction create and public discovery | Abeer, Ghadi | S2-01 | QA-04 | SOURCE |
| S2-03 | 2 | Must | Private access grant and enforcement | Abeer, Ghadi | S2-02 | QA-05/06 | SOURCE |
| S2-04 | 2 | Must | Seller + admin dashboard | Aseel, Ghadi | S2-01/02 | Browser E2E | TODO |
| S2-05 | 2 | Must | Private code UI and rate-limit review | Aseel, Ghadi; Tala QA | S2-03 | QA-05/06 | TODO |
| S3-01 | 3 | Must | Official commitment adapter | Abeer, Ghadi | S1-07 | QA-07, official evidence | BLOCKED |
| S3-02 | 3 | Must | Transactional bid validation | Abeer, Tala | S2-02, S3-01 | QA-08–11, QA-18/19 | SOURCE |
| S3-03 | 3 | Must | Idempotent request handling | Abeer, Tala | S3-02 | QA-09 | SOURCE |
| S3-04 | 3 | Must | Closure and result integrity | Abeer, Ghadi | S3-02 | QA-12/13/20/23 | SOURCE |
| S3-05 | 3 | Must | Bid/commitment/history/results UI | Aseel, Ghadi | S3-01–04 | QA-15/16 | TODO |
| S4-01 | 4 | Must | My Activity integration | Aseel, Ghadi | S1–S3 | QA-21 | Partial SOURCE |
| S4-02 | 4 | Must | Automated API + concurrency QA | Tala, Aseel | Running DB/API | QA-01–13 | TODO |
| S4-03 | 4 | Must | Browser E2E + negative cases | Tala, Aseel | Full UI | QA-14–23 | TODO |
| S4-04 | 4 | Must | Fix critical defects and regression | All | S4-02/03 | Green logs + retest | TODO |
| S4-05 | 1–4 | Must | Actual stand-ups/reviews/retros | All | Real meetings | Dated minutes and links | PENDING QA |
| S4-06 | 4 | Should | UX and accessibility polish | Aseel, Ghadi | S3-05 | UX checklist | TODO |

## Ownership & acceptance

Each task is closed only after (a) implementation, (b) reviewed PR/commit, (c) passing test evidence, and (d) documented acceptance. Actual dates and effort estimates must be entered by the team rather than backfilled.

## Sprint demo gates

- **S1:** register/login + persisted listing.
- **S2:** approved listing → public/private auction.
- **S3:** verified commitment → consistent bid → closure.
- **S4:** public/private browser E2E + QA evidence.

See [Sprint Plan](Sprint_Plan.md) and [Report Task 0](Report.MD#task-0--plan-and-define-sprints).
