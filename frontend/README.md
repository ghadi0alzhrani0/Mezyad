# Frontend account integration

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

Actual local execution results and remaining acceptance work are recorded in
[Stage 4 Testing Report](../Stage_4/Testing_Report.md). GitHub CI is configured
but has not been executed before upload.
