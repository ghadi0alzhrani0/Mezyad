# Stage 3 Report: Technical Documentation (Mazad VIP)

This document provides the comprehensive technical blueprint for the "Mazad VIP" platform, detailing user stories, system architecture, database design, sequence diagrams, API specifications, and quality assurance plans.

---

## 1. User Stories & Mockups

### Prioritized User Stories (MoSCoW)

| Priority | Role | User Story |
| :--- | :--- | :--- |
| **Must Have** | **VIP Bidder** | As a VIP bidder, I want to view real-time auction price updates instantly via WebSockets without refreshing the page, so that I never miss a bidding opportunity in the final seconds. |
| **Must Have** | **Seller** | As a seller, I want to upload high-value assets and attach verification documents, so that they can undergo the mandatory appraisal workflow before going live. |
| **Must Have** | **System / Escrow** | As the system, I want to automatically lock a security deposit in the user's virtual wallet before granting entry to the live bidding room, to completely eliminate fake bids. |
| **Should Have** | **Admin** | As an admin, I want a live moderation dashboard to oversee active auctions, review listings, and suspend suspicious activities instantly. |
| **Should Have** | **Winner** | As a winning bidder, I want an automated digital sales contract and tax invoice generated in PDF format immediately after auction closure. |

### UI Mockups & Design Methodology
* **Design System:** The user interface follows a modern, premium "Dark Mode" aesthetic using custom CSS styling, optimized for high-net-worth individuals and high-end asset presentation.
* **Architecture Pattern:** The frontend relies on Vanilla JavaScript, HTML5, and CSS3 structured as a Single Page Application (SPA)-like experience. It utilizes the asynchronous Fetch API for REST communication and Socket.io client listeners for instant DOM updates during high-stakes bidding wars.

---

## 2. System Architecture

The application uses a robust multi-tier architecture designed for high concurrency, sub-second latency, and strict transactional security.

Below is the system architecture flowchart illustrating the complete data flow from the client interface down to the databases and external integrations:

```mermaid
flowchart TD
    %% CI/CD & Security Subgraph
    subgraph CICD [CI/CD & Security]
        direction LR
        GH[GitHub Actions] -- Scanner --> Trivy[Security Scan]
        Trivy -- Approved --> PR[Deployment Pipeline]
    end

    %% User Interaction
    User((VIP User))

    %% Frontend Layer
    subgraph FrontendLayer [Frontend Layer]
        UI[Vanilla JS / HTML / CSS]
    end
    User -- HTTPS / WSS --> UI

    %% Routing & API Gateway
    subgraph APILayer [API Gateway]
        Router[Node.js Express & WebSocket Server]
    end
    UI -- REST & WebSockets --> Router

    %% Core Logic & External Services
    subgraph LogicLayer [Business Logic & Integrations]
        Engine[VIP Auction Engine]
        FinTech[Escrow & Open Banking API]
        AI[AI Price Predictor & Concierge]
        Web3[Polygon Blockchain / Digital Twins]
        Nafath[Nafath KYC Integration]

        Router --> Engine
        Router --> FinTech
        Router --> AI
        Router --> Web3
        Router --> Nafath
    end

    %% Data Storage Layer
    subgraph DataLayer [Data & Cache Layer]
        DB[(PostgreSQL - 36 Tables)]
        Redis[(Redis - Live Bids & Locks)]
    end

    Engine --> DB
    Engine --> Redis
    FinTech --> DB
    AI --> DB
    Web3 --> DB
    Nafath --> DB
```

---

## 3. Database Design & Components

### Backend Components
* **Bidding Engine Module:** Manages the Anti-Sniper logic, dynamic increments, and proxy bidding.
* **Escrow Ledger Module:** Handles the freezing, deduction, and releasing of virtual security deposits.
* **Event Sourcing Adapter:** Documents every critical system action into the `event_store` for immutable auditing and shill-bidding detection.

### Database Design (ER Diagram)

The relational schema is deeply normalized into 36 tables covering IAM, Ledger, Catalog, Auction Engine, Handover, and Event Sourcing. It relies on PostgreSQL for ACID persistence, while high-frequency read/writes (live bids, locks) are offloaded to Redis.

```mermaid
erDiagram
    %% 1. IAM & Security Module
    users {
        uuid id PK
        varchar full_name
        varchar email
        varchar phone
        varchar password_hash
        boolean is_2fa_enabled
        varchar two_factor_secret
        uuid role_id FK
    }
    roles {
        uuid id PK
        varchar name
    }
    permissions {
        uuid id PK
        varchar action_name
    }
    role_permissions {
        uuid role_id FK
        uuid permission_id FK
    }
    kyc_nafath_verifications {
        uuid id PK
        uuid user_id FK
        varchar national_id
        varchar status
        timestamp verified_at
    }
    user_badges {
        uuid id PK
        uuid user_id FK
        varchar badge_type
        timestamp awarded_at
    }

    %% 2. Ledger & Escrow Module
    wallets {
        uuid id PK
        uuid user_id FK
        decimal available_balance
        decimal escrow_frozen_balance
    }
    bank_accounts {
        uuid id PK
        uuid user_id FK
        varchar iban
        boolean is_open_banking_verified
        decimal available_liquidity
        timestamp last_funds_check_date
    }
    escrow_deposits {
        uuid id PK
        uuid user_id FK
        uuid auction_id FK
        decimal amount
        varchar status
    }
    transactions {
        uuid id PK
        uuid wallet_id FK
        decimal amount
        varchar transaction_type
        timestamp created_at
    }
    platform_fees {
        uuid id PK
        uuid category_id FK
        decimal fee_percentage
    }
    invoices {
        uuid id PK
        uuid user_id FK
        uuid auction_id FK
        varchar pdf_url
        decimal tax_amount
    }

    %% 3. Catalog & Items Module
    categories {
        uuid id PK
        varchar name
    }
    items {
        uuid id PK
        uuid seller_id FK
        uuid category_id FK
        text title
        text description
        decimal starting_price
        jsonb dynamic_attributes
        varchar smart_contract_address
        varchar digital_twin_url
    }
    item_media {
        uuid id PK
        uuid item_id FK
        varchar media_url
        varchar media_type
    }
    item_documents {
        uuid id PK
        uuid item_id FK
        varchar document_url
        text ai_summary_text
    }
    appraisal_workflows {
        uuid id PK
        uuid item_id FK
        varchar status
    }
    authenticators_reviews {
        uuid id PK
        uuid appraisal_id FK
        uuid evaluator_id FK
        text notes
        boolean is_authentic
    }

    %% 4. Auction Engine Module
    auctions {
        uuid id PK
        uuid item_id FK
        timestamp start_time
        timestamp end_time
        decimal current_price
        varchar auction_type
        jsonb auction_rules
    }
    vip_private_room_invites {
        uuid id PK
        uuid auction_id FK
        uuid invited_user_id FK
        varchar access_code
        boolean is_used
    }
    bids {
        uuid id PK
        uuid auction_id FK
        uuid bidder_id FK
        decimal amount
        timestamp created_at
    }
    proxy_bids {
        uuid id PK
        uuid auction_id FK
        uuid bidder_id FK
        decimal max_limit_amount
    }
    auction_extensions {
        uuid id PK
        uuid auction_id FK
        int extended_by_minutes
        varchar reason
    }
    auction_watchers {
        uuid id PK
        uuid auction_id FK
        uuid user_id FK
    }
    sealed_bids {
        uuid id PK
        uuid auction_id FK
        uuid bidder_id FK
        varchar encrypted_amount
    }

    %% 5. Handover & Disputes Module
    auction_results {
        uuid id PK
        uuid auction_id FK
        uuid winner_id FK
        decimal final_price
        decimal platform_commission
    }
    secure_handovers {
        uuid id PK
        uuid auction_id FK
        varchar dynamic_qr_hash
        boolean is_scanned_and_released
    }
    inspection_appointments {
        uuid id PK
        uuid auction_id FK
        varchar location_lat_lng
        timestamp scheduled_time
    }
    disputes {
        uuid id PK
        uuid auction_id FK
        varchar status
        text resolution_decision
    }
    dispute_messages {
        uuid id PK
        uuid dispute_id FK
        uuid sender_id FK
        text message
        varchar attachment_url
    }

    %% 6. AI & Event Sourcing Module
    vip_concierge_chats {
        uuid id PK
        uuid user_id FK
        text prompt_text
        text ai_response
        varchar executed_action
    }
    ai_price_predictions {
        uuid id PK
        uuid item_id FK
        decimal predicted_fair_value
        decimal confidence_score
    }
    event_store {
        uuid id PK
        uuid aggregate_id
        varchar event_type
        jsonb payload
        varchar ip_address
        timestamp created_at
    }
    notifications_log {
        uuid id PK
        uuid user_id FK
        varchar channel
        text content
        boolean is_read
    }

    %% 7. Ratings & Withdrawals
    user_reviews {
        uuid id PK
        uuid reviewer_id FK
        uuid reviewee_id FK
        uuid auction_id FK
        int rating_score
        text comment
        timestamp created_at
    }
    withdrawal_requests {
        uuid id PK
        uuid wallet_id FK
        uuid bank_account_id FK
        decimal amount
        varchar status
        timestamp requested_at
    }

    %% Relationships
    roles ||--o{ users : "has"
    roles ||--o{ role_permissions : "includes"
    permissions ||--o{ role_permissions : "granted_to"
    users ||--o{ kyc_nafath_verifications : "verifies"
    users ||--o{ user_badges : "earns"

    users ||--|| wallets : "owns"
    users ||--o{ bank_accounts : "links"
    users ||--o{ escrow_deposits : "makes"
    auctions ||--o{ escrow_deposits : "requires"
    wallets ||--o{ transactions : "logs"
    categories ||--o| platform_fees : "determines"
    users ||--o{ invoices : "receives"
    auctions ||--o{ invoices : "generates"

    categories ||--o{ items : "categorizes"
    users ||--o{ items : "sells"
    items ||--o{ item_media : "contains"
    items ||--o{ item_documents : "attached_to"
    items ||--o| appraisal_workflows : "undergoes"
    appraisal_workflows ||--o{ authenticators_reviews : "reviewed_by"
    users ||--o{ authenticators_reviews : "evaluates"

    items ||--o| auctions : "listed_as"
    auctions ||--o{ vip_private_room_invites : "invites"
    users ||--o{ vip_private_room_invites : "receives_invite"
    auctions ||--o{ bids : "receives"
    users ||--o{ bids : "places"
    auctions ||--o{ proxy_bids : "has_proxy"
    users ||--o{ proxy_bids : "sets_proxy"
    auctions ||--o{ auction_extensions : "triggers"
    auctions ||--o{ auction_watchers : "watched_by"
    users ||--o{ auction_watchers : "watches"
    auctions ||--o{ sealed_bids : "has_sealed"
    users ||--o{ sealed_bids : "places_sealed"

    auctions ||--o| auction_results : "concludes_with"
    users ||--o{ auction_results : "wins"
    auctions ||--o| secure_handovers : "requires_handover"
    auctions ||--o| inspection_appointments : "schedules"
    auctions ||--o{ disputes : "has_disputes"
    disputes ||--o{ dispute_messages : "contains_messages"
    users ||--o{ dispute_messages : "sends"

    users ||--o{ vip_concierge_chats : "interacts_with"
    items ||--o| ai_price_predictions : "predicted_by"
    users ||--o{ notifications_log : "notified_via"

    users ||--o{ user_reviews : "writes_review"
    users ||--o{ user_reviews : "receives_review"
    auctions ||--o| user_reviews : "results_in_review"

    wallets ||--o{ withdrawal_requests : "requests_withdrawal"
    bank_accounts ||--o{ withdrawal_requests : "transferred_to"
```

---

## 4. Sequence Diagrams

### 1. User Onboarding & Nafath KYC
**Role:** Illustrates the new user registration flow, connecting to the "Nafath" platform for identity verification, granting the VIP badge, and securely storing the data.

```mermaid
sequenceDiagram
    autonumber
    actor User as VIP User
    participant API as Node.js Backend
    participant Nafath as Nafath API
    participant DB as PostgreSQL

    User->>API: Submit National ID & Phone
    API->>Nafath: Init Authentication Request
    Nafath-->>User: Prompt Approval in Nafath App
    User->>Nafath: Approve Request
    Nafath-->>API: Return Success Webhook & User Data

    rect rgb(40, 44, 52)
        Note over API, DB: Secure Storage Phase
        API->>DB: Insert into users & kyc_nafath_verifications
        API->>DB: Insert into user_badges (Award VIP Badge)
    end

    API-->>User: Registration Complete (VIP Status Active)
```

### 2. Item Listing and AI Appraisal
**Role:** Represents the seller's journey in uploading an item, summarizing complex documents via AI, and routing it to a human evaluator for final approval before publishing.

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant API as Node.js Backend
    participant AI as AI Engine (Generative/Summary)
    actor Evaluator as Human Authenticator
    participant DB as PostgreSQL

    Seller->>API: Upload Item details & Documents (Deeds)
    API->>AI: Send heavy documents for summarization
    AI-->>API: Return ai_summary_text & generated staging images
    API->>DB: Save in items, item_media & item_documents

    API->>Evaluator: Assign for Appraisal (appraisal_workflows)
    Evaluator->>DB: Review AI Summary & Original Docs
    Evaluator->>DB: Approve & set is_authentic = true
    DB-->>API: Workflow Completed
    API-->>Seller: Item Approved for Auction
```

### 3. Open Banking & Escrow Processing
**Role:** Explains the mechanism of verifying the bidder's financial solvency via open banking, and freezing the escrow amount in their wallet to allow entry into the closed room.

```mermaid
sequenceDiagram
    autonumber
    actor Bidder
    participant API as Backend (Escrow Service)
    participant Bank as Open Banking API
    participant DB as PostgreSQL (Wallets)

    Bidder->>API: Request to join VIP Room (Auction ID)
    API->>Bank: Check available_liquidity via IBAN

    alt Liquidity >= Required Escrow
        Bank-->>API: Liquidity Confirmed
        API->>DB: Lock Escrow (escrow_deposits)
        API->>DB: Update wallet (escrow_frozen_balance)
        API-->>Bidder: Access Granted (vip_private_room_invites)
    else Insufficient Funds
        Bank-->>API: Liquidity Check Failed
        API-->>Bidder: Access Denied (Add funds required)
    end
```

### 4. Live Bidding Engine
**Role:** Demonstrates how the system handles live bids using Redis to prevent race conditions (Locks) and broadcasts the new price to all users in a fraction of a second.

```mermaid
sequenceDiagram
    autonumber
    actor Bidder
    participant WS as Node.js (WebSocket)
    participant Redis as Redis (In-Memory Locks)
    participant DB as PostgreSQL (event_store & bids)

    Bidder->>WS: Send Bid (Amount: X)
    WS->>Redis: Check current highest bid & Lock auction

    alt Bid > Current Price
        Redis-->>WS: Approved (Update Price in Redis)
        WS-->>Bidder: Bid Accepted
        WS->>WS: Broadcast new price to all connected clients
        WS->>DB: Async insert into bids & event_store
    else Bid <= Current Price
        Redis-->>WS: Rejected (Price too low)
        WS-->>Bidder: Error: Bid Rejected
    end
```

### 5. Auction Conclusion and Blockchain Integration
**Role:** Shows the automated procedures when time expires, from issuing invoices and registering the winner, to creating a digital ownership contract (Digital Twin) on the blockchain.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Job Scheduler
    participant API as Node.js Backend
    participant Web3 as Polygon Blockchain
    participant DB as PostgreSQL
    actor Winner

    Cron->>API: Trigger End Auction (Time Expired)
    API->>DB: Fetch highest bid & Winner ID
    API->>DB: Insert into auction_results & invoices

    rect rgb(40, 44, 52)
        Note over API, Web3: Digital Twin Minting
        API->>Web3: Deploy Smart Contract (Transfer Ownership)
        Web3-->>API: Return digital_twin_url & tx_hash
        API->>DB: Update items (smart_contract_address)
    end

    API-->>Winner: Notify Win & Send Invoice (PDF)
```

### 6. Secure Handover via QR Code
**Role:** Illustrates the face-to-face meeting protocol between buyer and seller, where a dynamic QR code is scanned to release the held funds and transfer them to the seller.

```mermaid
sequenceDiagram
    autonumber
    actor Winner as Winner (Buyer)
    actor Seller
    participant API as Node.js Backend
    participant DB as PostgreSQL

    Winner->>Seller: Meet at location & Show Dynamic QR Code
    Seller->>API: Scan QR Code via App
    API->>DB: Verify dynamic_qr_hash (secure_handovers)

    alt QR is Valid
        API->>DB: Mark is_scanned_and_released = true
        API->>DB: Release Escrow to Seller Wallet
        API->>DB: Deduct platform_commission
        API-->>Seller: Handover Confirmed & Funds Released
        API-->>Winner: Ownership Confirmed
    else QR is Invalid
        API-->>Seller: Error: Invalid or Expired QR
    end
```

### 7. Auto Proxy Bidding
**Role:** Displays how the system automatically bids on behalf of a user who set a secret maximum limit, instantly outbidding new competitors.

```mermaid
sequenceDiagram
    autonumber
    actor BidderA as Bidder A
    participant Engine as Auction Engine
    participant DB as PostgreSQL (proxy_bids)
    actor BidderB as Bidder B (Proxy User)

    BidderA->>Engine: Places manual bid (100k)
    Engine->>DB: Check active proxy_bids for this auction
    DB-->>Engine: Bidder B has proxy limit (150k)

    Engine->>Engine: Auto-calculate next increment (105k)
    Engine->>DB: Insert proxy bid for Bidder B (105k)
    Engine-->>BidderA: Bid Outbid immediately
    Engine->>BidderB: Send Push Notification (Proxy bid placed)
```

### 8. Anti-Sniper Auction Extension
**Role:** Clarifies the system's smart intervention when a bid occurs in the final seconds, automatically extending the auction time to ensure fairness and maximize profit.

```mermaid
sequenceDiagram
    autonumber
    actor Sniper
    participant Engine as Auction Engine (Redis/Node)
    participant DB as PostgreSQL (auction_extensions)
    participant Clients as All Watchers (WS)

    Sniper->>Engine: Places bid (Time remaining < 15s)
    Engine->>Engine: Accept Bid

    rect rgb(40, 44, 52)
        Note over Engine, DB: Anti-Sniper Protocol Triggered
        Engine->>Engine: Extend end_time by 3 minutes
        Engine->>DB: Log to auction_extensions
    end

    Engine-->>Clients: Broadcast (New Price + Timer Extended!)
```

### 9. Dispute Resolution
**Role:** The process of opening a dispute ticket by the buyer, freezing funds until the admin reviews evidence and issues a decision to refund or complete the sale.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    actor Admin
    participant API as Node.js Backend
    participant DB as PostgreSQL (disputes & wallets)

    Buyer->>API: Open Dispute (Item not as described) & Upload Evidence
    API->>DB: Create dispute (Status: Under_Review)
    API->>DB: Freeze Escrow (Do not release to seller)

    Admin->>API: Review dispute_messages & Evidence
    Admin->>API: Submit Resolution Decision (Refund Buyer)

    API->>DB: Update dispute (Status: Resolved)
    API->>DB: Refund wallet (Return Escrow to Buyer)
    API-->>Buyer: Dispute Resolved Notification
```

### 10. VIP AI Concierge
**Role:** Shows how the AI agent analyzes text commands from a VIP user and converts them into actual programmatic operations (like executing a bid on their behalf).

```mermaid
sequenceDiagram
    autonumber
    actor VIPUser as VIP User
    participant Chat as Concierge UI
    participant AI as AI NLP Engine
    participant Engine as Auction Engine
    participant DB as PostgreSQL

    VIPUser->>Chat: "Bid 5000 on the Porsche 911"
    Chat->>AI: Send prompt_text
    AI->>DB: Query intent & Fetch Item ID for "Porsche 911"
    AI->>Engine: Trigger Bid_Placed_By_AI function
    Engine->>DB: Validate limits & Place Bid
    Engine-->>AI: Success Response
    AI-->>Chat: "Done sir, your bid of 5000 is placed."
    Chat-->>VIPUser: Display AI Message
```

### 11. Withdrawal Requests and Compliance
**Role:** The financial security procedures when requesting large withdrawals from the platform, passing through account admin review and transferring to the bank account.

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    actor FinOps as FinOps Admin
    participant API as Node.js Backend
    participant Bank as Bank API Gateway
    participant DB as PostgreSQL (withdrawal_requests)

    Seller->>API: Request Withdrawal (1,000,000 SAR)
    API->>DB: Check wallet available_balance
    API->>DB: Create withdrawal_requests (Status: Pending)

    FinOps->>API: Review for Anti-Money Laundering (AML)
    FinOps->>API: Approve Request

    API->>Bank: Initiate Wire Transfer
    Bank-->>API: Transfer Success (Tx_ID)
    API->>DB: Deduct from wallet & Update request status
    API-->>Seller: SMS Notification (Funds Transferred)
```

---

## 5. API Specifications

### External APIs
* **Nafath Simulation API:** Used for secure national identity verification and KYC compliance.
* **Open Banking API:** Simulates proof-of-funds verification to ensure liquidity before high-value bidding.
* **Polygon Blockchain API:** Interacts with smart contracts to mint digital twin ownership certificates for rare assets.

### Internal API Endpoints

| Endpoint Path | HTTP Method | Request Body / Query | Response Format | Action Description |
|---|---|---|---|---|
| `/api/v1/auctions/{id}/bid` | POST | `{"amount": 1500000}` | JSON | Processes a new bid through the real-time engine and Redis locks. |
| `/api/v1/escrow/deposit` | POST | `{"amount": 5000, "auction_id": "uuid"}` | JSON | Programmatically locks the security deposit in the user's wallet. |
| `/api/v1/items/{id}` | GET | None | JSON | Retrieves item details, dynamic JSONB attributes, and media URLs. |
| `/api/v1/handovers/verify-qr` | POST | `{"qr_hash": "string", "auction_id": "uuid"}` | JSON | Scans the dynamic QR code during face-to-face inspection to release escrow funds. |

---

## 6. SCM and QA Plans

### Source Control Management (SCM)
* **Tool:** GitHub.
* **Branching Strategy:**
  * `main`: Production-ready code.
  * `development`: Integration branch for ongoing sprint work.
  * `feature/*`: Dedicated branches for individual modules (e.g., `feature/websocket-bidding`).
* **Quality Gate:** Mandatory Pull Request (PR) reviews. All code requires approval from at least one peer before merging.

### Quality Assurance (QA) Strategy
* **Unit & Concurrency Testing:** Backend logic and API endpoints are tested using testing suites (Mocha/Jest), with specific focus on simulating high-concurrency race conditions on Redis locks.
* **Security Scans:** Integrated automated vulnerability scanners in the CI/CD pipeline (GitHub Actions) to intercept critical security flaws prior to deployment.
* **Manual Integration Testing:** End-to-end validation of core user journeys, covering user registration via Nafath, escrow deposit locking, live WebSocket bidding with Anti-Sniper extensions, and QR code handover completion.
