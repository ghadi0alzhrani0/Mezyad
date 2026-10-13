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

## Verified runtime bugs

No executed runtime bug reports with reproduction evidence have been supplied. **This does not mean zero bugs.**

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
