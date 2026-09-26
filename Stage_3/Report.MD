Mezyad 

Stage 3 — Technical Documentation

This document provides the comprehensive technical blueprint for the Mazad VIP platform, detailing user stories, UI methodology, system architecture, database design, sequence diagrams, API specifications, source control, and quality assurance plans.

⸻

1. User Stories & Mockups

Prioritized User Stories (MoSCoW)

Priority	Role	User Story
Must Have	VIP Bidder	As a VIP bidder, I want to view real-time auction price updates instantly via WebSockets without refreshing the page, so that I never miss a bidding opportunity in the final seconds.
Must Have	Seller	As a seller, I want to upload high-value assets and attach verification documents, so that they can undergo the mandatory appraisal workflow before going live.
Must Have	System / Escrow	As the system, I want to automatically lock a security deposit in the user’s virtual wallet before granting entry to the live bidding room, to completely eliminate fake bids.
Should Have	Admin	As an admin, I want a live moderation dashboard to oversee active auctions, review listings, and suspend suspicious activities instantly.
Should Have	Winner	As a winning bidder, I want an automated digital sales contract and tax invoice generated in PDF format immediately after auction closure.

UI Mockups & Design Methodology

* Design System: The user interface follows a modern, premium Dark Mode aesthetic using custom CSS styling, optimized for high-value asset presentation.
* Architecture Pattern: The frontend relies on Vanilla JavaScript, HTML5, and CSS3 structured as a Single Page Application (SPA)-like experience.
* REST Communication: The frontend uses the asynchronous Fetch API for communication with the backend.
* Real-Time Communication: Socket.io/WebSockets are used to deliver instant auction updates and bidding events without requiring page refreshes.
* Responsive Design: The interface is designed to support desktop and mobile viewport sizes.

⸻

2. System Architecture

The application uses a multi-tier architecture designed for high concurrency, low latency, and transactional consistency.

flowchart TD
    %% CI/CD & Security
    subgraph CICD["CI/CD & Security"]
        direction LR
        GH["GitHub Actions"] --> Trivy["Security Scan"]
        Trivy --> PR["Deployment Pipeline"]
    end
    %% User
    User(("VIP User"))
    %% Frontend
    subgraph FrontendLayer["Frontend Layer"]
        UI["Vanilla JS / HTML / CSS"]
    end
    User -- "HTTPS / WSS" --> UI
    %% API
    subgraph APILayer["API Gateway"]
        Router["Node.js Express & WebSocket Server"]
    end
    UI -- "REST & WebSockets" --> Router
    %% Business Logic
    subgraph LogicLayer["Business Logic & Integrations"]
        Engine["VIP Auction Engine"]
        FinTech["Escrow & Open Banking API"]
        AI["AI Price Predictor & Concierge"]
        Web3["Polygon Blockchain / Digital Twins"]
        Nafath["Nafath KYC Integration"]
        Router --> Engine
        Router --> FinTech
        Router --> AI
        Router --> Web3
        Router --> Nafath
    end
    %% Storage
    subgraph DataLayer["Data & Cache Layer"]
        DB[("PostgreSQL - 36 Tables")]
        Redis[("Redis - Live Bids & Locks")]
    end
    Engine --> DB
    Engine --> Redis
    FinTech --> DB
    AI --> DB
    Web3 --> DB
    Nafath --> DB

Architecture Layers

Frontend Layer

Responsible for:

* User authentication interface.
* Auction browsing.
* Item details.
* Live bidding interface.
* VIP private rooms.
* Seller listing forms.
* Escrow status.
* Notifications.
* AI concierge interface.
* Secure handover interface.

API Layer

The backend API is responsible for:

* Authentication and authorization.
* REST API endpoints.
* WebSocket connections.
* Auction operations.
* Bid validation.
* Escrow operations.
* User and item management.
* Notifications.
* Administrative operations.

Business Logic Layer

Core modules include:

* VIP Auction Engine.
* Escrow Ledger.
* Appraisal Workflow.
* AI Concierge.
* AI Price Prediction.
* Blockchain Integration.
* Nafath KYC Integration.
* Secure Handover.
* Dispute Resolution.
* Event Sourcing.

Data Layer

The system uses:

* PostgreSQL for persistent relational data and ACID transactions.
* Redis for high-frequency auction operations, distributed locks, and live bidding state.

⸻

3. Database Design & Components

Backend Components

Bidding Engine Module

The Bidding Engine manages:

* Live bids.
* Minimum bid increments.
* Proxy bidding.
* Anti-sniper extensions.
* Bid validation.
* Auction state.
* Concurrent bidding protection.

Escrow Ledger Module

The Escrow Ledger handles:

* Security deposit creation.
* Deposit freezing.
* Balance validation.
* Escrow release.
* Refunds.
* Platform commissions.
* Withdrawal requests.
* Transaction records.

Event Sourcing Adapter

The Event Sourcing Adapter records critical system operations in the event_store table.

It supports:

* Immutable audit history.
* Security investigations.
* Auction event tracking.
* Suspicious bidding analysis.
* Administrative auditing.

⸻

Database ER Diagram

The relational schema is normalized into 36 tables covering:

1. IAM & Security
2. Ledger & Escrow
3. Catalog & Items
4. Auction Engine
5. Handover & Disputes
6. AI & Event Sourcing
7. Ratings & Withdrawals

PostgreSQL provides persistent ACID storage, while Redis handles high-frequency operations such as live bids and auction locks.

erDiagram
    %% =====================================================
    %% 1. IAM & SECURITY MODULE
    %% =====================================================
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
    %% =====================================================
    %% 2. LEDGER & ESCROW MODULE
    %% =====================================================
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
    %% =====================================================
    %% 3. CATALOG & ITEMS MODULE
    %% =====================================================
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
    %% =====================================================
    %% 4. AUCTION ENGINE MODULE
    %% =====================================================
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
    %% =====================================================
    %% 5. HANDOVER & DISPUTES MODULE
    %% =====================================================
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
    %% =====================================================
    %% 6. AI & EVENT SOURCING MODULE
    %% =====================================================
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
    %% =====================================================
    %% 7. RATINGS & WITHDRAWALS
    %% =====================================================
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
    %% =====================================================
    %% RELATIONSHIPS
    %% =====================================================
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

⸻

4. Sequence Diagrams

4.1 User Onboarding & Nafath KYC

Role: Illustrates the new user registration flow, connecting to the Nafath platform for identity verification, granting the VIP badge, and securely storing the verification data.

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
        API->>DB: Insert users & kyc_nafath_verifications
        API->>DB: Insert user_badges (Award VIP Badge)
    end
    API-->>User: Registration Complete (VIP Status Active)

⸻

4.2 Item Listing and AI Appraisal

Role: Represents the seller’s journey in uploading an item, summarizing complex documents via AI, and routing it to a human evaluator for final approval before publishing.

sequenceDiagram
    autonumber
    actor Seller
    participant API as Node.js Backend
    participant AI as AI Engine (Generative/Summary)
    actor Evaluator as Human Authenticator
    participant DB as PostgreSQL
    Seller->>API: Upload Item Details & Documents
    API->>AI: Send Documents for Summarization
    AI-->>API: Return ai_summary_text & Generated Staging Images
    API->>DB: Save items, item_media & item_documents
    API->>Evaluator: Assign for Appraisal
    Evaluator->>DB: Review AI Summary & Original Documents
    Evaluator->>DB: Approve & Set is_authentic = true
    DB-->>API: Workflow Completed
    API-->>Seller: Item Approved for Auction

⸻

4.3 Open Banking & Escrow Processing

Role: Explains the mechanism of verifying the bidder’s financial solvency via open banking and freezing the escrow amount before granting access to the closed bidding room.

sequenceDiagram
    autonumber
    actor Bidder
    participant API as Backend (Escrow Service)
    participant Bank as Open Banking API
    participant DB as PostgreSQL (Wallets)
    Bidder->>API: Request to Join VIP Room
    API->>Bank: Check available_liquidity via IBAN
    alt Liquidity >= Required Escrow
        Bank-->>API: Liquidity Confirmed
        API->>DB: Lock Escrow (escrow_deposits)
        API->>DB: Update wallet (escrow_frozen_balance)
        API-->>Bidder: Access Granted
    else Insufficient Funds
        Bank-->>API: Liquidity Check Failed
        API-->>Bidder: Access Denied (Add Funds Required)
    end

⸻

4.4 Live Bidding Engine

Role: Demonstrates how the system handles live bids using Redis locks to prevent race conditions and broadcasts the new price to all connected users.

sequenceDiagram
    autonumber
    actor Bidder
    participant WS as Node.js WebSocket
    participant Redis as Redis In-Memory Locks
    participant DB as PostgreSQL
    Bidder->>WS: Send Bid (Amount: X)
    WS->>Redis: Check Current Highest Bid & Lock Auction
    alt Bid > Current Price
        Redis-->>WS: Approved
        WS-->>Bidder: Bid Accepted
        WS->>WS: Broadcast New Price to Connected Clients
        WS->>DB: Async Insert into bids & event_store
    else Bid <= Current Price
        Redis-->>WS: Rejected
        WS-->>Bidder: Bid Rejected
    end

⸻

4.5 Auction Conclusion and Blockchain Integration

Role: Shows the automated procedures when an auction expires, including registering the winner, generating an invoice, and creating a digital ownership record on the blockchain.

sequenceDiagram
    autonumber
    participant Cron as Job Scheduler
    participant API as Node.js Backend
    participant Web3 as Polygon Blockchain
    participant DB as PostgreSQL
    actor Winner
    Cron->>API: Trigger End Auction
    API->>DB: Fetch Highest Bid & Winner ID
    API->>DB: Insert auction_results & invoices
    rect rgb(40, 44, 52)
        Note over API, Web3: Digital Twin Minting
        API->>Web3: Deploy Smart Contract / Transfer Ownership
        Web3-->>API: Return digital_twin_url & tx_hash
        API->>DB: Update items (smart_contract_address)
    end
    API-->>Winner: Notify Win & Send Invoice PDF

⸻

4.6 Secure Handover via QR Code

Role: Illustrates the face-to-face handover protocol between buyer and seller, where a dynamic QR code is scanned to release held funds.

sequenceDiagram
    autonumber
    actor Winner as Buyer
    actor Seller
    participant API as Node.js Backend
    participant DB as PostgreSQL
    Winner->>Seller: Meet at Location & Show Dynamic QR Code
    Seller->>API: Scan QR Code via App
    API->>DB: Verify dynamic_qr_hash
    alt QR is Valid
        API->>DB: Mark is_scanned_and_released = true
        API->>DB: Release Escrow to Seller Wallet
        API->>DB: Deduct Platform Commission
        API-->>Seller: Handover Confirmed & Funds Released
        API-->>Winner: Ownership Confirmed
    else QR is Invalid
        API-->>Seller: Error: Invalid or Expired QR
    end

⸻

4.7 Auto Proxy Bidding

Role: Displays how the system automatically bids on behalf of a user who has configured a secret maximum limit.

sequenceDiagram
    autonumber
    actor BidderA as Bidder A
    participant Engine as Auction Engine
    participant DB as PostgreSQL (proxy_bids)
    actor BidderB as Bidder B
    BidderA->>Engine: Place Manual Bid (100k)
    Engine->>DB: Check Active Proxy Bids
    DB-->>Engine: Bidder B Has Proxy Limit (150k)
    Engine->>Engine: Calculate Next Increment (105k)
    Engine->>DB: Insert Proxy Bid for Bidder B (105k)
    Engine-->>BidderA: Bidder A Outbid
    Engine->>BidderB: Send Push Notification

⸻

4.8 Anti-Sniper Auction Extension

Role: Explains the automatic auction extension when a bid is placed during the final seconds.

sequenceDiagram
    autonumber
    actor Sniper
    participant Engine as Auction Engine (Redis/Node)
    participant DB as PostgreSQL
    participant Clients as All Watchers (WebSocket)
    Sniper->>Engine: Place Bid (Time Remaining < 15s)
    Engine->>Engine: Accept Bid
    rect rgb(40, 44, 52)
        Note over Engine, DB: Anti-Sniper Protocol Triggered
        Engine->>Engine: Extend end_time by 3 Minutes
        Engine->>DB: Log Extension in auction_extensions
    end
    Engine-->>Clients: Broadcast New Price + Extended Timer

⸻

4.9 Dispute Resolution

Role: Describes the process of opening a dispute ticket, preserving the escrow state while evidence is reviewed, and applying the resulting administrative decision.

sequenceDiagram
    autonumber
    actor Buyer
    actor Admin
    participant API as Node.js Backend
    participant DB as PostgreSQL
    Buyer->>API: Open Dispute & Upload Evidence
    API->>DB: Create Dispute (Under Review)
    API->>DB: Freeze Escrow
    Admin->>API: Review Evidence & Messages
    Admin->>API: Submit Resolution Decision
    API->>DB: Update Dispute Status
    API->>DB: Apply Financial Resolution
    API-->>Buyer: Dispute Resolution Notification

⸻

4.10 VIP AI Concierge

Role: Shows how the AI concierge processes a natural-language request and converts it into a controlled auction-engine operation.

sequenceDiagram
    autonumber
    actor VIPUser as VIP User
    participant Chat as Concierge UI
    participant AI as AI NLP Engine
    participant Engine as Auction Engine
    participant DB as PostgreSQL
    VIPUser->>Chat: "Bid 5000 on the Porsche 911"
    Chat->>AI: Send prompt_text
    AI->>DB: Resolve Item & Validate Context
    AI->>Engine: Trigger Bid Operation
    Engine->>DB: Validate Limits & Place Bid
    Engine-->>AI: Success Response
    AI-->>Chat: "Bid successfully placed."
    Chat-->>VIPUser: Display AI Response

⸻

4.11 Withdrawal Requests and Compliance

Role: Describes the financial workflow for large withdrawal requests, including balance validation, administrative review, bank transfer, and transaction recording.

sequenceDiagram
    autonumber
    actor Seller
    actor FinOpsAdmin as FinOps Admin
    participant API as Node.js Backend
    participant Bank as Bank API Gateway
    participant DB as PostgreSQL
    Seller->>API: Request Withdrawal
    API->>DB: Check Wallet Available Balance
    API->>DB: Create withdrawal_request (Pending)
    FinOpsAdmin->>API: Review Request
    FinOpsAdmin->>API: Approve Request
    API->>Bank: Initiate Wire Transfer
    Bank-->>API: Transfer Success (Tx_ID)
    API->>DB: Deduct Wallet Balance
    API->>DB: Update Withdrawal Status
    API-->>Seller: Funds Transfer Notification

⸻

5. API Specifications

External APIs

Nafath Simulation API

Used for:

* National identity verification.
* KYC workflow.
* User verification.
* VIP account activation.

Open Banking API

Used for:

* Proof-of-funds verification.
* Liquidity checking.
* Security deposit validation.
* High-value auction access control.

Polygon Blockchain API

Used for:

* Smart contract interaction.
* Digital ownership records.
* Digital Twin creation.
* Transaction verification.

⸻

Internal API Endpoints

Endpoint Path	HTTP Method	Request Body / Query	Response Format	Action Description
/api/v1/auctions/{id}/bid	POST	{"amount": 1500000}	JSON	Processes a new bid through the real-time engine and Redis locks.
/api/v1/escrow/deposit	POST	{"amount": 5000, "auction_id": "uuid"}	JSON	Locks the security deposit in the user’s wallet.
/api/v1/items/{id}	GET	None	JSON	Retrieves item details, dynamic JSONB attributes, and media URLs.
/api/v1/handovers/verify-qr	POST	{"qr_hash": "string", "auction_id": "uuid"}	JSON	Verifies the dynamic QR code during handover and releases escrow funds when valid.

⸻

6. SCM and QA Plans

Source Control Management (SCM)

Tool

GitHub

Branching Strategy

main

Production-ready code.

development

Integration branch for ongoing development and sprint work.

feature/*

Dedicated branches for individual modules.

Examples:

feature/websocket-bidding
feature/escrow-system
feature/nafath-kyc
feature/ai-concierge
feature/blockchain-integration
feature/secure-handover

Pull Request Policy

All changes should be submitted through Pull Requests.

The expected workflow is:

Feature Branch
      ↓
Pull Request
      ↓
Code Review
      ↓
Automated Tests
      ↓
Security Scan
      ↓
Merge into Development
      ↓
Release Validation
      ↓
Main

At least one peer review should be required before merging production-bound changes.

⸻

Quality Assurance (QA) Strategy

6.1 Unit Testing

Backend modules and API endpoints should be covered with automated unit tests.

Potential testing frameworks include:

* Jest
* Mocha
* Supertest

Testing should cover:

* Bid validation.
* Auction state transitions.
* Escrow calculations.
* Wallet balance operations.
* Proxy bidding.
* Anti-sniper extensions.
* Authentication.
* Authorization.
* API validation.

⸻

6.2 Concurrency Testing

Because multiple users may submit bids simultaneously, concurrency testing is critical.

The test suite should simulate:

* Multiple simultaneous bids.
* Redis lock contention.
* Duplicate bid requests.
* Requests arriving within milliseconds of each other.
* Multiple proxy-bid triggers.
* Auction-ending race conditions.

The objective is to ensure that:

One auction state
        +
Many simultaneous requests
        ↓
Consistent final state

No bid should be accepted in a way that creates an invalid auction state.

⸻

6.3 Integration Testing

End-to-end testing should validate the major system workflows.

User Registration

User
 ↓
Backend
 ↓
Nafath
 ↓
KYC Verification
 ↓
VIP Account

Escrow

Bidder
 ↓
Liquidity Check
 ↓
Wallet
 ↓
Escrow Lock
 ↓
VIP Room Access

Live Auction

Bidder
 ↓
WebSocket
 ↓
Redis Lock
 ↓
Auction Engine
 ↓
PostgreSQL
 ↓
Broadcast

Auction Completion

Auction Ends
 ↓
Winner Determined
 ↓
Auction Result
 ↓
Invoice
 ↓
Blockchain Record
 ↓
Winner Notification

Secure Handover

Buyer + Seller
 ↓
Dynamic QR
 ↓
Verification
 ↓
Escrow Release
 ↓
Ownership Confirmation

⸻

7. Security Strategy

The platform handles high-value transactions and therefore requires security controls across every layer.

Authentication

The system supports:

* Secure password hashing.
* Two-factor authentication.
* Session/token validation.
* Identity verification.
* Role-based access control.

Authorization

Access should be controlled using:

User
 └── Role
      └── Permissions

The roles, permissions, and role_permissions tables provide the foundation for role-based authorization.

Financial Security

Financial operations should use:

* Transactional database operations.
* Wallet balance validation.
* Escrow states.
* Immutable transaction records.
* Withdrawal review.
* Audit events.

Auction Security

Auction operations should protect against:

* Race conditions.
* Duplicate requests.
* Unauthorized bidding.
* Bid manipulation.
* Invalid auction states.
* Concurrent bid conflicts.

Redis distributed locks are used to coordinate high-frequency auction operations.

Auditability

Critical operations should be recorded in:

event_store

Each event may contain:

* Aggregate ID.
* Event type.
* Event payload.
* IP address.
* Timestamp.

This provides a historical audit trail for important system actions.

⸻

8. Core Business Workflows

VIP Auction Workflow

User Registration
       ↓
Nafath Verification
       ↓
VIP Status
       ↓
Browse Private Auctions
       ↓
Financial Verification
       ↓
Escrow Deposit
       ↓
VIP Room Access
       ↓
Live Bidding
       ↓
Auction Completion
       ↓
Winner Selection
       ↓
Invoice Generation
       ↓
Digital Ownership Record
       ↓
Secure Handover
       ↓
Escrow Release

⸻

9. High-Level Technology Stack

Layer	Technology
Frontend	HTML5, CSS3, Vanilla JavaScript
Real-Time Communication	WebSockets / Socket.io
Backend	Node.js / Express
Primary Database	PostgreSQL
Cache & Locks	Redis
Authentication	JWT / 2FA / Nafath Verification
AI	AI NLP & Price Prediction Engine
Blockchain	Polygon
API Style	REST
Source Control	Git / GitHub
CI/CD	GitHub Actions
Security Scanning	Trivy
Testing	Jest / Mocha / Supertest

⸻

10. Non-Functional Requirements

Performance

The system should support:

* Low-latency bid processing.
* Real-time price updates.
* Efficient database queries.
* Redis-based high-frequency state management.
* WebSocket broadcasting.

Scalability

The architecture should allow horizontal scaling of:

* API servers.
* WebSocket servers.
* Background workers.
* Redis infrastructure.
* PostgreSQL read replicas where required.

Reliability

The system should maintain:

* Transactional consistency.
* Persistent auction records.
* Recoverable event history.
* Idempotent financial operations.
* Controlled failure handling.

Maintainability

The codebase should follow:

* Modular architecture.
* Separation of concerns.
* Clear API contracts.
* Consistent naming conventions.
* Automated testing.
* Pull Request review.

⸻

11. Deployment Architecture

A production deployment can follow the structure below:

flowchart LR
    User["VIP User"]
    CDN["CDN / Reverse Proxy"]
    LB["Load Balancer"]
    API1["Node.js API"]
    API2["Node.js API"]
    WS1["WebSocket Server"]
    WS2["WebSocket Server"]
    Redis[("Redis")]
    DB[("PostgreSQL")]
    Worker["Background Worker"]
    External["External Integrations"]
    User --> CDN
    CDN --> LB
    LB --> API1
    LB --> API2
    LB --> WS1
    LB --> WS2
    API1 --> Redis
    API2 --> Redis
    WS1 --> Redis
    WS2 --> Redis
    API1 --> DB
    API2 --> DB
    Worker --> DB
    Worker --> Redis
    API1 --> External
    API2 --> External

This structure allows multiple application instances to operate concurrently while Redis coordinates shared real-time auction state.

⸻

12. Example Auction State Machine

Auction lifecycle:

stateDiagram-v2
    [*] --> Draft
    Draft --> PendingApproval
    PendingApproval --> Approved
    PendingApproval --> Rejected
    Approved --> Scheduled
    Scheduled --> Live
    Live --> Extended
    Extended --> Live
    Live --> Ended
    Ended --> WinnerSelected
    WinnerSelected --> PaymentPending
    PaymentPending --> HandoverPending
    HandoverPending --> Completed
    HandoverPending --> Disputed
    Disputed --> Resolved
    Resolved --> Completed
    Completed --> [*]

⸻

13. Auction Bid Processing

The expected bidding flow is:

Client
  │
  │ WebSocket Bid
  ▼
WebSocket Server
  │
  ▼
Authentication
  │
  ▼
Auction Validation
  │
  ├── Auction Active?
  │
  ├── User Authorized?
  │
  ├── Escrow Valid?
  │
  └── Bid Amount Valid?
  │
  ▼
Redis Lock
  │
  ▼
Compare Current Price
  │
  ├── Invalid → Reject
  │
  └── Valid
       │
       ▼
    Update Redis
       │
       ▼
    Persist Bid
       │
       ▼
    Write Event
       │
       ▼
    Broadcast
       │
       ▼
    Connected Clients

⸻

14. Escrow Lifecycle

Available Balance
        │
        ▼
Security Deposit Requested
        │
        ▼
Funds Verification
        │
        ├── Failed → Request Rejected
        │
        ▼
Escrow Frozen
        │
        ├───────────────┐
        │               │
        ▼               ▼
Auction Won        Auction Lost
        │               │
        ▼               ▼
Handover           Escrow Release
        │
        ├── Successful
        │       ↓
        │   Seller Payment
        │
        └── Dispute
                ↓
          Administrative Review
                ↓
          Refund / Settlement

⸻

15. Event Sourcing

Critical events can be recorded using the following conceptual structure:

{
  "aggregate_id": "auction-uuid",
  "event_type": "BID_PLACED",
  "payload": {
    "bidder_id": "user-uuid",
    "amount": 1500000,
    "auction_id": "auction-uuid"
  },
  "ip_address": "client-ip",
  "created_at": "timestamp"
}

Possible event types include:

USER_REGISTERED
KYC_VERIFIED
ITEM_CREATED
ITEM_APPROVED
AUCTION_CREATED
AUCTION_STARTED
BID_PLACED
PROXY_BID_TRIGGERED
AUCTION_EXTENDED
AUCTION_ENDED
WINNER_SELECTED
ESCROW_LOCKED
ESCROW_RELEASED
HANDOVER_COMPLETED
DISPUTE_OPENED
DISPUTE_RESOLVED
WITHDRAWAL_REQUESTED
WITHDRAWAL_COMPLETED

⸻

16. Example API Responses

Successful Bid

{
  "success": true,
  "auction_id": "auction-uuid",
  "bid_id": "bid-uuid",
  "amount": 1500000,
  "current_price": 1500000,
  "status": "accepted"
}

Rejected Bid

{
  "success": false,
  "error": "BID_TOO_LOW",
  "message": "The submitted bid is lower than the current auction price."
}

Escrow Lock

{
  "success": true,
  "auction_id": "auction-uuid",
  "amount": 5000,
  "status": "locked"
}

Invalid QR

{
  "success": false,
  "error": "INVALID_QR",
  "message": "The QR code is invalid or expired."
}

⸻

17. Project Quality Gates

Before production deployment, the project should satisfy the following gates:

Code Implemented
      ↓
Unit Tests Passed
      ↓
Integration Tests Passed
      ↓
Concurrency Tests Passed
      ↓
Security Scan Passed
      ↓
Code Review Approved
      ↓
Build Successful
      ↓
Deployment Validation
      ↓
Production Release

⸻

18. Final System Summary

Mazad VIP is designed as a premium, real-time auction platform combining:

* Real-time WebSocket bidding.
* Redis-based concurrency control.
* PostgreSQL transactional persistence.
* Escrow and wallet management.
* VIP private auction rooms.
* Nafath identity verification.
* AI-assisted appraisal and price prediction.
* Proxy bidding.
* Anti-sniper auction extensions.
* Blockchain-backed digital ownership records.
* Secure QR-based handover.
* Dispute management.
* Event-sourced auditing.
* Automated invoices.
* Controlled financial withdrawals.
* CI/CD security scanning.
* Automated testing.

The architecture separates presentation, API routing, business logic, external integrations, and persistence layers to provide a modular foundation for future expansion.

                    MAZAD VIP
                        │
        ┌───────────────┼────────────────┐
        │               │                │
    Frontend         Backend          External
        │               │                │
  HTML/CSS/JS       Node.js           Nafath
  WebSockets        Express           Banking
        │               │              Polygon
        │        ┌──────┼──────┐
        │        │      │      │
        │      Redis   AI    PostgreSQL
        │        │             │
        └────────┴─────────────┘
                 │
          Auction Platform
                 │
       ┌─────────┼─────────┐
       │         │         │
     Bidding   Escrow   Handover
       │         │         │
       └─────────┼─────────┘
                 │
             Audit Trail
                 │
            event_store

⸻

Stage 3 Documentation Complete

Mazad VIP — Technical Documentation

Architecture • Database • User Stories • Sequence Diagrams • APIs • Security • SCM • QA • Deployment
