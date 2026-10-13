# Frontend Implementation and Browser QA

## Baseline and scope

- Repository baseline: `46a84e7cdc9764b032b05ae29c1a937a40f71006`.
- Test date: 2026-10-13, UTC.
- Delivery: local source overlay; no commit, pull request or upload was made for this package.
- Specification: `Stage_3/Report.MD`, read-only.
- Stage 3 SHA-256: `f41b15604e29da6f0982aa1c6367275307c80c38f8ce5c2ec3f3fd69cc40a11d`.
- Existing account UI, asset files, backend, database migrations and earlier deliverables were preserved.

This work extends the existing React frontend and adds executable browser tests.
It does not implement the unavailable bank provider or backend image storage,
change the database design, or claim that the whole MVP is complete.

## UI and route coverage

| Workflow | Routes | Implemented behavior | Integration status |
|---|---|---|---|
| Accounts | `#register`, `#login`, `#account` | Reuses existing validation, session checking and logout; adds account actions and safe return routes | Tested against Express |
| My Activity | `#activity` | Own listings and auctions associated with participation/ownership, correct ID links, empty/loading/error states | Tested against Express |
| Listing creation | `#listing/new` | Details, optional category fields, description template from entered data, local image previews, review and multipart submission | Upload blocked by backend |
| Listing detail/edit | `#listing/:id`, `#listing-edit/:id` | Owner detail, review reason, rejected-listing edit and resubmission form | Multipart resubmission blocked |
| Admin review | `#admin`, `#admin/:id` | Role gate, queue, exact listing, confirmation, trimmed rejection reason and fresh queue after review | Rejection tested in browser; approval tested with controlled responses |
| Auction setup | `#auction-new/:itemId` | Approved owned listing, public/private choice, starting price, increment and UTC schedule; private code shown after creation | Private creation tested against Express |
| Private access | `#private`, `#private/:auctionId` | Link/UUID and access code; wrong code stays on the same form, success opens that auction | Tested against Express |
| Bid Commitment | `#commitment/:auctionId` | Reads status, explicit initiation and refresh, clear provider failure, no false approval | Real provider unavailable; failure path tested |
| Bidding | `#bid/:auctionId`, `#bid-success/:auctionId` | Eligibility/owner/time checks, minimum amount, confirmation, request UUID, server acceptance, same-auction receipt | Tested with synthetic eligibility only |
| Results | `#result/:auctionId` | Not ended, no bids, winner and known personal outcome; no sold/payment/handover claim | No-bid and known winner tested against Express |
| Existing browsing | `#home`, `#auctions`, `#auction/:id` | Retains approved home/cards/photos; polling, bid history, same-auction participation and result links | Existing component regressions pass |

Screen-local state is reset when the route or record ID changes. This fixes a
discovered failure when the admin returned from a reviewed item to the queue.
There is no newly introduced escrow, Anti-Sniping, WebSocket or AI integration.

## Approved design reference

[Figma Design](https://www.figma.com/design/mbc0Qc5e0hR8dIaqQjbMMN/Mezyad-1?node-id=2-2).

The existing wordmark, photographs, fonts and identity assets remain unchanged.
The new screens use the existing El Messiri heading font, Noto Sans Arabic body
font, ivory/gold palette and shared header/footer/button system. Figma contexts
were read without requesting screenshots. No Figma file was changed.

| Reference node | Screen family |
|---|---|
| `9:3` | Seller activity |
| `9:65` | Listing details/form |
| `421:2` | Admin queue |
| `421:199` | Auction setup |
| `422:176` | Private access |
| `422:289` | Commitment |
| `7:105` | Bid form |
| `424:89` | Result |

Responsive CSS supports narrower layouts. Arabic remains RTL; numeric values and
countdown digits remain English digits. Confirmation dialogs support keyboard
focus, Escape and a focus trap. Automated geometry checks passed for the private
access screen at 320/390/768/1440 px. This evidence does not establish visual
pixel equality, every screen's mobile layout, or a complete accessibility audit.

## Files

| File | Purpose |
|---|---|
| `frontend/src/App.jsx` | Routes, protected screens, account actions, route-state isolation and in-memory accepted bid receipt |
| `frontend/src/api.js` | JSON and FormData transport; safe Arabic API error messages |
| `frontend/src/ui/Auctions.jsx` | Same-auction participation, bid history polling, result and known-outbid links/messages |
| `frontend/src/marketplace/common.jsx` | Data loading, validators, feedback, shared page/field/confirmation components |
| `frontend/src/marketplace/ListingForm.jsx` | Listing details, category fields, previews, review and multipart request |
| `frontend/src/marketplace/Activity.jsx` | Activity and owned listing detail |
| `frontend/src/marketplace/AdminReview.jsx` | Review queue and confirmable decisions |
| `frontend/src/marketplace/AuctionCreate.jsx` | Public/private auction setup |
| `frontend/src/marketplace/Participation.jsx` | Access, commitment, bidding, receipt and result screens |
| `frontend/src/marketplace/workspace.css` | Layout and responsive styles using the existing identity |
| `frontend/tests/marketplace.test.jsx` | 17 additional component/API-client regression cases |
| `frontend/tests/navigation.test.jsx` | Existing navigation tests adjusted for commitment and bid-history requests |
| `frontend/vite.config.js` | Keeps browser specs separate from component tests |
| `frontend/playwright.config.js` | Chromium browser suite, JSON results, no image/video/trace recording |
| `frontend/scripts/e2e-server.js` | Disposable PostgreSQL schema and actual Express/Vite test harness |
| `frontend/e2e/journeys.spec.js` | 12 executable browser scenarios |
| `frontend/package.json`, `frontend/package-lock.json` | Reproducible browser-test dependency and script |
| `frontend/README.md` | Setup, integration status and browser-test instructions |
| `Stage_4/Frontend_QA_Report.md` | This implementation and execution record |

## Actual execution

Component/build environment: macOS arm64, Node.js 24.19.0, Vite 6.4.4 and
Vitest 4.1.11. Browser environment: Linux arm64 in the official Playwright
`v1.64.0-noble` image, Node.js 24.21.0, Chromium and PostgreSQL 16.
Both workspaces installed dependencies using `npm ci`.

| Command / run | Actual result |
|---|---|
| Frontend `npm test` | 47 passed, 0 failed, 0 skipped; 4 test files |
| Frontend `npm run build` | Passed; 40 modules compiled |
| Backend `npm run check` | Passed; existing backend syntax check, no backend changes |
| Final frontend `npm run test:e2e` in Docker | 12 passed, 0 failed, 0 skipped, 0 flaky |
| Initial Docker browser run | 11 passed, 1 failed; admin route-state defect then corrected and covered by a regression test |
| Earlier native browser attempt | 11 launch failures before page execution due macOS sandbox MachPort restrictions; replaced by the successful Docker run |

The native launch failures are environment failures, not successful UI checks.
The earlier failure evidence is retained separately from the final results.
There is no configured frontend lint script, so lint is not reported as passed.
No separate full backend regression suite or CI workflow was added/executed for
this frontend handoff. The browser tests exercise the existing live API in a
disposable test schema.

Final browser scenarios cover real registration/login/logout; same-item details
and bank failure; private wrong/right code; non-admin UI access denial; exact
pending-listing rejection; private auction creation; accepted bid/history with
synthetic eligibility; no-bid closure; activity; honest upload failure; responsive
geometry; and a known accepted bid becoming the winning result after controlled
test-only expiry. Expiry is changed only in the disposable fixture schema.

The SUCCESS commitment is inserted only by the local test harness and is marked
`LOCAL_BROWSER_FIXTURE_NOT_BANK_VERIFIED`. It tests downstream bidding behavior,
not the bank API. Normal application use still receives the real unavailable
provider response. The browser suite does not use genuine money/customer data.

## Stage 3 QA mapping

These are frontend contributions to the QA plan, not a claim that all Stage 3
acceptance criteria or backend security cases passed.

| Stage 3 ID | Executable evidence | Coverage limit |
|---|---|---|
| QA-01 / QA-02 | Existing account component cases for duplicate email and bad password | Controlled response/UI coverage |
| QA-03 | Component admin gate and browser ordinary-user admin denial | UI gate; server security tests remain separate |
| QA-04 | `auction setup refuses unapproved listing...` | Component guard |
| QA-05 | Private wrong/right code browser and component cases | Real API access-code flow |
| QA-07 | Provider unavailable component/browser cases | Real 503 handling; genuine provider timeout/API not tested |
| QA-12 | Ended no-bid browser case | Real closure on access and no-winner display |
| QA-14 | Existing loading/error tests, activity empty state, queue empty state | Component plus browser coverage |
| QA-15 | Accepted bid/history and winner browser cases | Synthetic commitment; genuine bank step blocked |
| QA-16 | Private access and private creation browser cases | Partial journey; private bidding with genuine bank not tested |
| QA-17 | Edit/resubmission UI present | End-to-end blocked by missing multipart handling |
| QA-18 | First accepted 1000 bid on 1000-start fixture | Actual backend with synthetic eligibility |
| QA-21 | Activity/browser participation case | Actual API aggregation and correct links |
| QA-22 | Component multipart transport and browser rejected upload | Upload boundary only; server MIME/size/storage acceptance not implemented |

Concurrency, database integrity, repeated closure and other backend-specific
cases require the separate API/database QA suite. No additional passing results
are inferred from that suite.

## Outstanding integration work

| Priority | Finding | Required next step |
|---|---|---|
| High | Backend accepts JSON listings but Stage 3 requires multipart files | Approve upload limits/storage and implement validation, storage and image references; rerun success/resubmission cases |
| High | Listing GET does not expose image references for owner/admin | Extend the approved contract to return listing images; review UI must not imply it inspected unavailable photos |
| High | Commitment POST returns BANK_SANDBOX_UNAVAILABLE | Obtain legitimate provider access and finish the bank adapter; execute genuine bank tests before enabling production eligibility |
| Medium | Multipart field naming is not fully defined: Stage 3 says `category`; existing JSON backend uses `categoryId` | Confirm the category identifier field for the upload handler; current form sends `categoryId` and `category_fields` |
| Medium | Results expose winning bid ID but not winning user identity | Owner review of an authenticated outcome contract; current page uses personal text only for a known matching receipt and stays generic after reload |
| Medium | `/me/auctions` mixes owned and participated auctions without ownership metadata | Current heading is deliberately combined; add approved metadata before separating them |
| Medium | Exact image-size limits and existing-image edit semantics are unspecified | Clarify before adding limits, retaining/deleting old images, or claiming server upload acceptance |
| Medium | All-screen visual/mobile/accessibility acceptance not performed | Complete human review and broader geometry/accessibility cases; current tests use no screenshots |

The Stage 3 report, backend, migration and approved static identity assets are
unchanged. Existing uploaded handoff folders in the baseline are outside the
scope of this package and were not changed. There are no deleted tracked files.
