# Backend account development

Requires Node.js 20+ and PostgreSQL. From this directory:

```sh
npm ci
cp ../.env.example .env
# Set DATABASE_URL for your local development database.
psql "$DATABASE_URL" -f ../database/migrations/001_schema.sql
npm run dev
```

The `.env` file is loaded by the server. For the `psql` command, export the same
`DATABASE_URL` in the terminal first; `psql` does not read `.env` automatically.

Account endpoints are `POST /api/v1/auth/register`, `/login` and `/logout`.
Protected requests use `Authorization: Bearer <token>`. Existing unversioned
URLs are retained for compatibility. Registration always creates `USER`;
administrators must be provisioned separately. Passwords are hashed with bcrypt,
and only hashed session tokens are stored in PostgreSQL. Logout revokes the
current session. Successful sessions expire after seven days.

Names are required and limited to 160 characters. Email addresses are normalized
and limited to 254 characters. Registration passwords must contain at least
eight characters and fit within bcrypt's 72-byte UTF-8 limit.

## Tests

```sh
npm run check
npm test
```

Without `TEST_DATABASE_URL`, the database account suite is explicitly skipped.
To execute it, create a separate PostgreSQL database with a name ending in
`_test`, then run:

```sh
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mezyad_accounts_test npm test
```

The suite applies the existing migration and creates temporary test accounts.
It covers duplicate email (QA-01), invalid credentials (QA-02), admin permissions
(QA-03), registration validation, concurrent registration, hashed credentials,
session expiry, protected access and session revocation. It never uses banking
credentials or tests real payments.

## Local Figma design fixtures

After applying the existing migration to a disposable database ending in
`_test`, optionally seed the three listings already present on the approved
Figma homepage:

```sh
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mezyad_demo_test DEMO_SEED_ALLOWED=true npm run seed:design-demo
```

The database must exist before running this command. The script is opt-in and
refuses other database names. It creates fictional local records for the Hittin
villa, Porsche Carrera GT and NJD 1 plate, using the approved design images and
scenario prices. Prices are opening prices; no fictitious bids, commitments,
bank approvals or real customers are created. Re-running the script preserves
existing records. It is not a production seeding command.

Auction discovery/details now return their own category and image references
from the existing tables. Private listings remain excluded from public discovery,
and direct private detail access still requires authorization.
