# Stage 4 — Bug Tracker & Implementation Gaps

**Evidence rule:** A known missing feature is a **gap**, not an observed runtime defect. A bug requires reproduction steps, actual output and environment.

## Implementation gaps (source review, not executed bug reports)

| ID | Severity if shipped | Gap | Owner | Verification gate | Status |
|---|---|---|---|---|---|
| GAP-01 | High | Secure listing image upload/validation missing | Backend + UI | QA-22 | Open |
| GAP-02 | High | Seller/admin/private/bidding React journeys incomplete | Aseel, Ghadi | QA-14–16/21 | Open |
| GAP-03 | Critical blocker | Genuine bank sandbox commitment unverified | Abeer, Ghadi | QA-07 + provider evidence | Blocked |
| GAP-04 | High | Concurrency and closure untested against PostgreSQL | Abeer, Tala; QA | QA-09–13/23 | Open |
| GAP-05 | Medium | Private access brute-force protection needs verification | Backend + QA | Rate-limit negative test | Open |
| GAP-06 | Owner review | Figma phone input has no Stage 3 registration/storage contract; field disabled | Project owner | Decide scope separately without altering Stage 3 here | Pending Owner Review |
| GAP-07 | Owner review | Figma password recovery action has no Stage 3 recovery API; action disabled | Project owner | Approved recovery requirements and contract | Pending Owner Review |

## Verified runtime bugs

**BUG-01 — Auction destination lost on login reload.** Observed locally on
13 October 2026 in the working tree based on `86028b4`. Steps: open the Porsche
auction as a guest, choose to bid, reload the login page, then sign in. Expected:
return to the Porsche auction. Actual: the account page opened because the
destination existed only in a React ref. Fix: retain a validated auction UUID
in the login/registration URL. Retest: the automated reload regression and the
real browser journey both returned to the same Porsche ID and image.
**Status: Verified locally; review/upload pending.**

## Defect entry template

**BUG ID / title:**  
**Severity:** Critical / High / Medium / Low  
**Environment and commit SHA:**  
**Preconditions:**  
**Steps to reproduce:**  
**Expected:**  
**Actual (log/screenshot):**  
**Owner:**  
**Fix PR/commit:**  
**Retest date/result:**  
**State:** Open / In Progress / Fixed / Verified / Closed
