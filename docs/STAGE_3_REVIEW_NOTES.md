# Stage 3 review notes

The authoritative [Stage 3 report](../Stage_3/Report.MD) is read-only. These findings do not authorize a change to it. Every finding has status **Pending Owner Review**.

| ID | Stage 3 section | Issue and impact | Proposed solution for owner review | Priority | Implementation blocked? | Status |
|---|---|---|---|---|---|---|
| R01 | 2.2, 5.1 | Seller/Bidder are activities of USER, not separate accounts. Specialized profiles would change the approved schema. | Keep USER/ADMIN and ten tables. Consider profile extensions only in a later approved change. | Medium | No | Pending Owner Review |
| R02 | 9 vs Stage 2 Task 2 | Charter includes anti-sniping; Stage 3 explicitly defers it. Implementing extensions would alter auction timing. | Follow fixed Stage 3 deadlines; owner should reconcile the charter separately. | High | No | Pending Owner Review |
| R03 | 3 | Charter describes real-time updates; Stage 3 specifies polling. Polling has bounded display delay. | Keep periodic GET requests, refresh on bid acceptance, and show refresh errors. No Socket.io. | Medium | No | Pending Owner Review |
| R04 | 3.1 | Charter assumes Docker; Stage 3 makes it optional. | Support native PostgreSQL; use an isolated PostgreSQL container only for repeatable tests when Docker is available. | Medium | No | Pending Owner Review |
| R05 | 7.2, Flow 5 | Results are finalized on access, not by a background scheduler. An unvisited ended auction has no persisted result yet. | Reject late bids using database wall-clock time, and finalize on details access. A scheduler requires separate approval. | High | No | Pending Owner Review |
| R06 | 7.4 | Candidate provider selection and genuine sandbox access are unresolved. | Obtain approved sandbox registration, credentials/certificates and supported operation; retain an unconfigured real-provider interface meanwhile. | High | Genuine integration only | Pending Owner Review |
| R07 | 7.4 | A successful account-information call does not itself establish bidder eligibility or reserve funds. | Owner/provider must approve the precise consent and eligibility rule before connecting real responses to commitment approval. | High | Genuine integration only | Pending Owner Review |
| R08 | 7.2 | No category-discovery or session-profile endpoint is listed; uploaded-image delivery is implicit. | Use fixed seeded categories, include current account metadata in the existing GET /items response, and protect image URLs outside the REST prefix. Discuss dedicated contracts later; no extra business API is added. | Medium | No | Pending Owner Review |
| R09 | 5.1–5.3 | Status values, amount precision, UTC representation and category field schemas lack exact contracts. | Use constrained statuses, decimal cents and UTC-aware timestamps; keep ten tables and enforce winner-to-auction integrity with the described composite foreign key. Owner may formalize these details later. | Medium | No | Pending Owner Review |
| R10 | 3–6 | All eight Mermaid diagrams rendered in GitHub for baseline 07549f8. Rendering alone does not prove business behavior. | Keep the diagrams unchanged and rely on executable bidding/closure tests for behavior. | Low | No | Pending Owner Review |
| R11 | 2.1, 7.2 | Upload size/type/count, password policy, pagination limits and commitment error states lack acceptance criteria. | Apply documented conservative validation limits in implementation; propose formal acceptance criteria separately. | Medium | No | Pending Owner Review |
| R12 | 8.4 | QA plan omits session expiry, rollback failure, bid/closure locking race, polling recovery and provider payload validation. | Add executable tests without modifying the QA table. Map the original IDs in TEST_RESULTS.md. | High | No | Pending Owner Review |
| R13 | 5.1, 7.3 | ERD requires UUID request_id; sample strings are illustrative rather than valid UUIDs. Duplicate response semantics are unspecified. | Validate UUIDs; return 409 for duplicate bid requests without a second accepted bid. | Medium | No | Pending Owner Review |
| R14 | 2.4 vs Stage 2 Task 2 | Stage 3 permits only a client-side description template, not the charter's six assistant functions. | Implement the editable description suggestion; do not add a chatbot or other assistant functions. | Medium | No | Pending Owner Review |
| R15 | 7.4 | A process crash after persisting PENDING but before saving the adapter outcome can leave a commitment pending indefinitely. A genuine callback/reconciliation contract is unspecified. | Define provider idempotency, an approved timeout/recovery rule and reconciliation before genuine integration. Do not invent banking callbacks or approve a stale commitment automatically. | High | Genuine integration and production resilience | Pending Owner Review |

## Implementation choices requiring formal acceptance criteria

These limits make the local implementation testable; they are not retrospective changes to Stage 3:

- Registration passwords: 10–128 characters; sessions expire after 7 days.
- Listings: title 3–200 characters; description 5–10,000 characters; required category fields come from the shared four-category catalog.
- Images: 1–6 JPEG, PNG or WebP files for a new listing, at most 5 MB each, with MIME/signature validation and authorized file delivery. Rejected-listing edits retain existing images.
- Pagination: default 20 and maximum 50 entries per request.
- Money: positive decimal amounts, at most 16 integer digits and 2 decimal places; PostgreSQL stores `NUMERIC(18,2)` and the API returns decimal strings. Internal bid comparisons use integer cents.
- Bid request IDs: UUIDs; a duplicate request returns 409 without inserting another bid.
- Polling: every 3 seconds while the auction is open; deadlines and acceptance remain authoritative on the server.
- Authentication and private-code attempts are rate limited. The included credential-pattern check is not a comprehensive security assessment.

No extra tables, background closure worker, push channel, bank endpoints or settlement workflow were introduced. Missing category/session/image contracts are handled as described in R08, rather than silently adding a new business API.

## Genuine Open Banking research

Checked 2026-10-12; no developer accounts were created and no customer data was used.

- **SAB/SABB candidate:** its [official sandbox FAQ](https://developer.sandbox.sabb.com/perry/developer/documentation?document=docs%2FHelp%2F40-faqs.md&resource=tg-sabbsari-portal) describes registration with a unique organization, access to documentation/test data, and client profile/signing and transport certificates. The [portal introduction](https://developer.sandbox.sabb.com/perry/developer/welcome) links the KSA standards. No approved credentials, exact authentication contract, rate limits, consent callbacks or Bid Commitment operation were obtained. Status: **Blocked / Not Tested**.
- **Al Rajhi candidate:** its [technical guide](https://developer.alrajhibank.com.sa/open-banking/APIGuides) describes consent-based account information, OAuth client credentials and FAPI/PAR; [Getting Started](https://developer.alrajhibank.com.sa/open-banking/GettingStarted) covers app/product subscription. Its [registration guide](https://developer.alrajhibank.com.sa/open-banking/sites/open-banking.apic-prod-ptl-portal-web-cp4i-prod.apps.ocp.p4intcl02.alrajhi.bank/themes/alrajhi_new_test/css/images/Client%20Registration-ARB.pdf) limits portal access to authorized, regulated TPPs on SAMA's registry. Applicability to a student project, sandbox credentials, certificates, redirect/consent setup and rate limits need provider confirmation. Status: **Blocked / Not Tested**.

Neither candidate is selected or confirmed. Account access/balance APIs are not assumed to be escrow, a funds hold or proof of financial eligibility. A local mock can exercise Mezyad's integration interface only; its approval has no financial meaning. Production configuration must reject mock mode.
