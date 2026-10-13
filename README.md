# Mezyad | مِزياد

Mezyad is a web-based auction platform for high-value and rare assets.

## Project stages

| Stage | Guide | Full report |
|---|---|---|
| 1 — Idea Development | [README](Stage_1/README.MD) | [Report](Stage_1/Report.MD) |
| 2 — Project Charter | [README](Stage_2/README.MD) | [Report](Stage_2/Report.MD) |
| 3 — Technical Documentation | [README](Stage_3/README.MD) | [Report](Stage_3/Report.MD) |
| 4 — MVP Development | [README](Stage_4/README.md) | [Report](Stage_4/Report.MD) |

## Platform

Sellers submit asset listings for administrator review. Approved listings may be offered through public or private auctions. Eligible participants complete a bid commitment step before bidding. The server validates bid amounts, eligibility and deadlines, then records the winner or a no-winner outcome.

## Technology

- React frontend
- Node.js / Express REST API
- PostgreSQL database
- Periodic REST polling for auction updates
- Saudi Open Banking sandbox for bid commitment, subject to authorized provider access

The MVP does not process real payments, escrow or asset handover.

## Team

Abeer Al-Saiari · Ghadi Al-Zahrani · Aseel Al-Zahrani · Tala Al-Hudaibi

## Source code

- [Backend](backend/)
- [Frontend](frontend/)
- [Database](database/)
