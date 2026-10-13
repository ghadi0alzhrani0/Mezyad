# Frontend and browser QA

Requires Node.js 20+ and a running Mezyad backend. From this directory:

```sh
npm ci
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend origin if it uses another port. This value is
public client configuration; never place bank credentials or server secrets in
the frontend environment. The backend's `FRONTEND_ORIGIN` must match the Vite
origin (normally `http://localhost:5173`).

`AuthProvider` provides account access and the shared authenticated API client.
`AccountPanel` handles registration, login, logout, field validation and Arabic
feedback. Sessions survive reloads in the same tab using `sessionStorage`; a
stored session is verified with the existing protected `/api/v1/me/items`
endpoint before the account is shown. Passwords are never persisted. The stored
user summary is for display; the backend remains responsible for authorization.
Failed logout retains the session and offers a retry instead of claiming success.

## Approved interface

The only application interface follows the approved [Figma Design](https://www.figma.com/design/mbc0Qc5e0hR8dIaqQjbMMN/Mezyad-1?node-id=2-2).
Its wordmark, photographs, ivory/gold colors, El Messiri headings and Noto Sans
Arabic body text are bundled locally. Font license texts are included alongside
the fonts. Asset hashes and reference node IDs are in `public/design-assets.json`.
The previous plain interface and the standalone visual preview have been removed.

The home, browsing, auction details and account screens use the same visual
system. Auction cards, category filters and galleries read records from Express;
each card opens its own auction ID. A validated auction ID is retained in the
login/registration URL, including across reloads. There are no customer-facing
links to alternative prototypes or Figma pages.

The phone field and password recovery action appear in Figma but have no
approved Stage 3 storage/API contract. They remain visibly disabled pending owner
review; registration sends only name, email and password. The footer's policy
labels remain informational text until approved content is supplied.

Public auction and details data are polled every five seconds. A rejected or
mismatched API response produces an error instead of another item's screen.
Countdowns use English digits and do not override server-side deadlines.
Bank participation currently returns the existing unavailable-provider error;
the UI does not claim that a commitment or a bid succeeded.

For the three local design fixtures shown on the homepage, use the opt-in seed
described in the [backend guide](../backend/README.md). These fixtures are design
scenarios, not evidence of live listings, actual market prices or accepted bids.

```sh
npm test
npm run build
```

The component and API-client tests use controlled network responses. They test
UI behavior and do not replace the backend PostgreSQL integration suite or a
full browser journey against a running server.

## Marketplace workflows

The marketplace screens extend the existing approved visual system. The account
opens My Activity, listing creation, private access and, for administrators,
listing review. Approved owned listings can be used to create public or private
auctions. Each route retains its listing or auction ID through confirmation,
bidding and results; switching routes resets screen-local state.

Listing details, category fields, local image previews and the Description
Builder are implemented. Actual image submission and rejected-listing
resubmission are **blocked** by the backend's missing multipart upload handler.
The form sends the required multipart request and displays the real rejection;
it does not fall back to a text-only submission or claim publication.

Bid Commitment remains a **blocked external dependency**. The frontend only
allows bidding after the API returns SUCCESS. The bid form preserves a request
UUID across recoverable retries, asks for confirmation and waits for server
acceptance. Results use the server's auction result. Personal win/loss text is
available only when a matching accepted bid receipt is known in the current
browser session; after a reload, the result stays generic because the current
result endpoint does not identify the winning user.

## Browser tests

Install both backend and frontend dependencies first. Use a dedicated PostgreSQL
database whose name ends in `_test`, with permission to create/drop test schemas.
Do not use production data or genuine banking credentials.

```sh
npx playwright install chromium
TEST_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/frontend_qa_test npm run test:e2e
```

The harness starts the actual Express backend and Vite on ports 44017/44018,
applies the existing migration inside a disposable schema, creates synthetic
fixtures and drops that schema on normal shutdown. One fixture has a synthetic
SUCCESS commitment solely to test downstream bidding and closure. This is **not
bank verification**, and the fixture is never created in normal application use.

Screenshots, videos and traces are disabled. Results are written to
`/tmp/frontend-browser-results` by default, outside the repository. The responsive
test checks DOM geometry at 320, 390, 768 and 1440 px; it is not a visual
pixel-comparison test. See the [Frontend QA Report](../Stage_4/Frontend_QA_Report.md)
for current execution results and integration boundaries.

Actual local execution results and remaining acceptance work are recorded in
[Stage 4 Testing Report](../Stage_4/Testing_Report.md). The account workflow passed
on GitHub for the published application revision; links and results are recorded
in that report.
