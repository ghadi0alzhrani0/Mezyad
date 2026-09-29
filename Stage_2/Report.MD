# Stage 2 Report: Mezyad — High-Value Asset Auction Platform

## Executive Summary

**Mezyad — High-Value Asset Auction Platform** is an online auction platform for high-value assets, focused on controlled auction participation, bidder commitment, and reliable real-time bidding.

**The central problem.** High-value online auctions require clear asset information, controlled participation, a defined commitment step for bidders, dependable real-time bidding, and a predictable closing process. For assets such as vehicles or real estate, bidders need enough detail to evaluate the asset, sellers may want to decide who can enter the auction, and every participant needs to see the same live price and the same ending. When listings are unclear, participation is uncontrolled, or the live auction state is inconsistent, the auction becomes difficult to rely on.

**Why this idea was selected.** Stage 1 selected Mezyad because it addresses a meaningful problem while remaining achievable as a graduation MVP. The project concentrates its effort on the auction workflow rather than on activities surrounding a sale. This suits a four-person team working over 12 weeks and allows the team to build the auction experience in depth, especially real-time bidding, instead of spreading effort across unrelated features.

**The approved workflow.** The MVP follows one defined path:

Registration / Login → Seller Creates Listing → Structured Asset Information → Admin Review & Approval → Public or Private Auction → Bid Commitment → Bank API Integration through a Saudi Open Banking Sandbox → Live Real-Time Bidding → Anti-Sniping → Auction Closure → Winner Determination / Auction Result

**Boundaries.** Mezyad is a student graduation MVP. It does not move real money, does not use live customer banking data, does not provide production financial services or production KYC, and makes no production-grade legal, financial, or security guarantees. The bank integration uses an official sandbox/testing environment with test data. The workflow ends with a recorded winner and auction result, and nothing after that point is part of the project.

This charter defines the purpose, objectives, stakeholders, team responsibilities, scope, risks, and high-level plan that guide Stages 3 to 5.

---

## Task 0: Define Project Objectives

### Project Purpose

Mezyad provides a focused auction experience for high-value assets. Its purpose rests on five elements. Each addresses a specific need of high-value online auctions, and each belongs in the MVP because it directly supports the auction workflow.

**1. Clear asset information.** High-value assets differ widely, and a vague listing leaves bidders unable to judge what they are bidding on. Sellers enter structured, category-specific information (for example, make, model, year, mileage, and condition for a vehicle) and can use a lightweight AI Listing Assistant to prepare the listing. Administrators review each listing before it becomes an auction. This belongs in the MVP because the rest of the auction depends on bidders understanding the asset.

**2. Controlled participation.** Not every high-value asset is intended for the general public. A seller can make an auction public or restrict it through a private access code. This gives sellers a simple way to control who can enter an auction without requiring a participant-management system.

**3. A defined commitment step for bidders.** Bidders should reach the live auction through a deliberate, controlled step rather than by simply opening a page. Each bidder completes a Bid Commitment step before bidding, connected to an official Saudi Open Banking sandbox integration. Bid Commitment is a controlled participation checkpoint. It does not claim that a bidder is guaranteed to be serious or to complete any later transaction. It belongs in the MVP because it links the required bidder commitment step to the auction workflow and satisfies the project's required bank API integration.

**4. Dependable real-time bidding.** If bidders see different prices, or a bid is accepted incorrectly, the auction cannot be trusted. Bids are validated on the server, and the highest bid, bid history, and timer are updated live for all participants. Anti-sniping extends the auction when a valid bid arrives near the end. This is the core of the platform and receives the largest share of implementation effort.

**5. Predictable auction closure.** An auction needs a clear, unambiguous ending. At the final valid end time, bidding stops, the winner is determined from valid bids, and the result is recorded and displayed. This completes the auction workflow without extending into activities that happen after the auction.

**Why the combination matters.** Together, these elements make Mezyad an auction platform rather than a general marketplace. It does not support fixed-price selling, catalogues of unrelated goods, or management of what happens after the auction. Every feature exists to make the auction itself clearer, more controlled, or more reliable.

Mezyad demonstrates this workflow in a sandbox environment as a student MVP. It does not claim to eliminate fraud or to guarantee financial, legal, or security protection.

### SMART Objectives

**Objective 1 — End-to-End MVP**

By the end of Week 10, demonstrate the complete approved MVP workflow across both a public-auction scenario and a private-auction scenario, including seller listing and admin approval, bidder commitment, bank API integration, real-time bidding, anti-sniping, auction closure, and winner determination.

* *What is delivered:* one integrated MVP that runs the full workflow for both auction types.
* *Why Week 10:* Stage 4 runs from Week 6 to Week 10, so this is the point at which implementation and integration must be complete, leaving Weeks 11–12 for testing.
* *Measure:* the approved workflow is demonstrated successfully for both a public-auction scenario and a private-auction scenario without manual database changes. This criterion shows that the workflow runs through the system itself rather than through manual edits to the data.

**Objective 2 — Core Auction Functionality**

By the end of Week 9, implement and demonstrate validated bid submission, bid history, live auction updates, auction timing, and anti-sniping.

* *What is delivered:* the core auction functionality, working before the remaining features are integrated.
* *Why Week 9:* completing the core one week before the full MVP leaves Week 10 for commitment, bank API integration, AI listing assistance, closure, and winner determination, and gives early warning if the auction logic needs rework.
* *Measure:* with at least two users bidding on the same auction, valid bids are accepted and invalid bids are rejected, all users see updates live, and a valid bid placed in the final period extends the end time.

**Objective 3 — Validation**

By the end of Week 12, complete structured testing and validation covering authentication, listing creation, admin approval, public and private access, commitment, bank API integration, real-time bidding, anti-sniping, auction closure, winner determination, AI listing assistance, and relevant edge cases.

* *What is delivered:* a tested MVP with documented test results.
* *Why Week 12:* testing follows implementation, so Weeks 11–12 are reserved for it, together with bug fixing and final documentation.
* *Measure:* a documented test plan with recorded results for each listed area, with defects found in the core workflow fixed or documented.

---

## Task 1: Identify Stakeholders and Team Roles

### Product Stakeholders

Product stakeholders are the people who use Mezyad. Each has a distinct role in the auction workflow, which is why the system separates their access.

**Bidders / Buyers**
* *Role in the workflow:* they find or access auctions, review asset information, complete the commitment step and the required bank integration flow, place bids, monitor the auction, and receive the auction result.
* *Main interaction:* the live auction view, where they place bids and follow the current highest bid and timer.
* *What they need:* understandable listings, controlled participation, predictable auction state, and visible bid status.

**Sellers**
* *Role in the workflow:* they create listings, provide structured asset information, use the AI Listing Assistant, choose public or private access, submit listings for approval, and monitor the auction result.
* *Main interaction:* the listing creation form and the listing status view.
* *What they need:* simple listing creation, structured information that fits their asset category, assistance with titles and descriptions, and control over whether the auction is public or private.

**Administrators**
* *Role in the workflow:* they review submitted listings, approve or reject them, manage required platform controls, and monitor auction status where necessary.
* *Main interaction:* the listing review interface.
* *What they need:* a clear review workflow, the ability to approve or reject a listing, and visibility over relevant listing and auction status.

### Project Stakeholders

| Stakeholder | Why they matter to the project | What they need |
| :--- | :--- | :--- |
| **Project Team** | Designs, builds, tests, and documents the MVP, so the project's outcome depends on the team's ability to deliver it | A clearly defined, achievable scope and a realistic schedule |
| **Academy Instructors / Evaluators** | Assess whether the project meets the stage requirements and demonstrates technical depth | A measurable, well-scoped, and demonstrable project |
| **Project Supervisor / Mentor** | Provides project guidance and ensures required project constraints and integrations are addressed | Evidence that required constraints, such as the Saudi bank API integration, are included and progressing |

### Team Responsibilities

| Responsibility Area | Members | Responsibilities |
| :--- | :--- | :--- |
| **Database** | Abeer + Tala | Database design and data model (users, listings, auctions, commitments, bids, results); database-related integration |
| **Backend** | Abeer + Ghadi | Server-side logic, authentication, authorization, listing logic, auction rules, bid validation, anti-sniping, auction closure, bank API integration, AI integration |
| **Frontend** | Aseel + Ghadi | Responsive web interface: bidder, seller, and admin interfaces; live auction interface; real-time auction state presentation |
| **Task Review & Cross-Task Integration** | Tala + Aseel | Review completed tasks, verify consistency, check that database, backend, and frontend work together, and identify integration issues |
| **Task Allocation, Technical Approach & Docker Operation** | Abeer + Ghadi | Coordinate task allocation, guide the technical approach, coordinate implementation dependencies, and operate and maintain the Docker development environment |

Docker is used to maintain a consistent development environment across team members and support a reliable project demonstration.

These are primary responsibility areas rather than exclusive ownership. Team members may collaborate across areas when required.

**Why this structure works.** Each area has two named members, so every area has clear primary responsibility and a second person who understands it. Members also appear in more than one area: Abeer and Tala link the database to the backend, Abeer and Ghadi link the backend to task coordination, and Ghadi links the backend to the frontend. These overlaps sit at the boundaries where integration problems are most likely, such as between the database and server logic, or between the server and the live auction interface. Tala and Aseel review completed work across areas, so integration is checked by people who did not write every part. This reduces gaps between areas while keeping ownership clear.

---

## Task 2: Define Scope

Scope control is one of the main purposes of this charter. Every item below directly supports the defined Mezyad auction workflow, and anything that does not is excluded.

### In Scope

**Authentication & Access**

Registration and login give users controlled access, so listings, commitments, and bids belong to authenticated users. Role-based access separates three roles: Bidder/Buyer, Seller, and Administrator. Role separation is needed because each participant has a different responsibility: only sellers create listings, only administrators approve them, and only bidders who are permitted access to an auction can bid in it.

**Seller Listings and Structured Asset Information**

Sellers create listings with a title, category, description, images, starting price, and auction start and end times. Asset information is structured, simple, and category-specific: vehicles use make, model, year, mileage, and condition, and real estate uses property type, area, location, bedrooms, and condition. Structure matters for high-value assets because bidders decide based on specific details, and consistent fields make listings easier to compare and understand. The MVP does not build a large asset taxonomy, only the fields needed for the supported categories.

**Admin Review**

Administrators review submitted listings and approve or reject them. Only approved listings can proceed to auction. A submitted listing should not automatically become an auction, especially for high-value assets, so this step gives the platform a controlled publishing workflow. The review itself is kept simple: approve or reject.

**Public and Private Auctions**

A public auction appears in the public auction list, and authenticated users can access it and bid. A private auction does not appear in the public list. It is accessed through a private access code that the seller provides to participants outside the platform. An authenticated user must enter the correct code to access the auction and bid.

Private auctions give the seller a simple way to keep an auction out of the public list. The MVP implements this through a private access code rather than an invitation-management system, which keeps participation control within the project's time and complexity limits. The MVP implements only Private Auction → Private Access Code → Authorized Participant Access.

**Bid Commitment**

Bid Commitment is a step the bidder must complete before bidding. It works as a controlled participation checkpoint: it links the required bidder commitment step to the auction workflow so that bidders enter the live auction through a defined step. It does not hold, transfer, or represent a financial deposit. It is simply a required participation step before bidding and is not escrow, custody, payment, or settlement. It is intentionally limited so that the auction workflow remains the focus of the project. The exact implementation stays within what the selected bank sandbox supports.

**Saudi Open Banking Sandbox Integration**

Mezyad will integrate with an official Saudi Open Banking sandbox/testing environment as part of the bidder commitment flow. The integration will use test/sandbox data rather than live customer financial data. The exact API operation will be selected during Stage 3 based on the approved provider's documentation, available access, and the operation required by the commitment workflow. The bank integration will be used only for the specific account or banking interaction supported by the approved sandbox and required for the Mezyad commitment flow.

* *Why the integration is required:* it is a required project constraint, and it connects the commitment step to a real Saudi bank API rather than to a purely internal mechanism.
* *Why a sandbox:* the selected provider's official sandbox provides a non-production environment for developing and testing the required Open Banking integration, so the team can develop and test without production access. The details of the selected provider's sandbox will be confirmed against its official documentation in Stage 3.
* *Why test data:* no live customer information is involved and no real money moves.
* *What remains undecided until Stage 3:* the specific API operation. It depends on the provider's documentation and the access the team is granted, so it is not fixed here.
* *Role in the workflow:* the integration provides the required banking interaction within the bidder commitment process. The exact role of the bank response will be defined after the selected API operation is confirmed in Stage 3. It is not a payment processor and not a banking application, and Mezyad will not claim to verify funds, creditworthiness, or financial eligibility unless the selected API explicitly supports it.
* *Provider candidates:* the primary candidate is the SABB Open Banking Developer Sandbox, and the backup candidate is the Al Rajhi Bank Developer Portal / Sandbox. Sandbox access has not yet been obtained.

**Real-Time Bidding**

The auction supports bid submission, server-side bid validation, the current highest bid, bid history, an auction timer, start and end rules, live auction state, and real-time updates to participants. The server is authoritative: it validates every bid, rejects invalid bids, maintains the current highest bid and bid history, controls the auction timer, and controls bid processing so that concurrent bids are handled consistently. In an auction, the outcome depends on which bids are valid and the order in which they arrive, so the decision cannot be left to the user's browser. Real-time updates matter because bidders act on the current price, and an outdated price could lead them to bid on wrong information. This is the core of the platform and receives the majority of implementation effort.

**Anti-Sniping**

Anti-sniping addresses last-second bidding, where a bid arrives so close to the closing time that other bidders have little or no chance to respond. If a valid bid is received during the defined final period, the auction end time is automatically extended. In Mezyad, it gives active bidders additional time to respond to bids received near the scheduled closing time. The exact threshold and extension duration are left to the Stage 3 technical design, where they will be defined together with the other auction timing rules.

**Auction Closure and Winner Determination**

When an auction reaches its final valid end time, bidding stops, the winner is determined from the valid bids, the auction status changes to closed, and the result is recorded and displayed. The winner is calculated only after bidding has stopped and only from valid bids, which gives each auction a clear result. The workflow ends at the auction result and includes no payment, settlement, or later steps.

**AI Listing Assistant**

The AI Listing Assistant is one lightweight capability inside listing creation, not a separate AI project. It provides three functions:

1. **Suggest a listing title** based on the entered asset information.
2. **Generate or improve the listing description** from the structured asset information.
3. **Suggest missing information** to improve listing completeness.

Sellers may have the asset details but not know how to present them clearly, and listing quality affects how well bidders understand the asset. The three functions cover the main listing-writing needs (title, description, and completeness) and all work from information the seller has already provided. The assistant stays lightweight because it only produces suggestions during listing creation and has no role after submission.

The seller provides the underlying information and remains responsible for the final content, and the administrator still reviews every listing. AI is not used for pricing or bidding decisions, because that would turn the project into a valuation or prediction system outside the auction workflow. The assistant does not determine prices, appraise assets, predict winners, make bidding or financial decisions, perform KYC, approve listings, or act as a chatbot.

**Quality**

The MVP includes a responsive web interface, structured testing and validation, and the documentation required to support the project.

**Overall scope boundary.** The in-scope items form a single chain: a listing is created and reviewed, an auction is opened publicly or privately, bidders commit and bid in real time, and the auction closes with a recorded winner and result. Nothing in scope exists outside that chain.

### Out of Scope

These exclusions are deliberate scope controls. They prevent the MVP from becoming a full financial transaction, logistics, or asset-management platform and allow the team to concentrate implementation effort on the auction workflow.

* Real money transfer
* Real financial settlement
* Escrow and financial custody
* Production banking data
* Production KYC / Nafath
* Invoices
* Handover management
* Delivery and logistics
* Blockchain
* Tokenization
* IoT
* Drones
* Predictive pricing
* AI valuation
* AI bidding decisions
* Chatbot
* Native mobile applications
* Complex invitation-management systems
* Any feature outside the defined auction workflow

---

## Task 3: Identify Risks & Mitigation Strategies

| # | Risk | Impact | Level | Mitigation |
| :-- | :--- | :--- | :--- | :--- |
| 1 | Concurrent bids cause inconsistent auction state | Wrong highest bid or winner; unreliable auction results | High | The server remains authoritative for bid validation and auction state, so clients cannot independently decide whether a bid is valid. Simultaneous-bid scenarios will be tested to reduce the risk of inconsistent results. |
| 2 | Real-time updates are delayed or missed | Bidders see outdated prices or miss the closing | Medium | Because the server holds the true auction state, a client that falls behind can be corrected by refreshing that state. Reconnect and refresh handling lets a bidder recover after a dropped connection, and network interruption cases will be tested. |
| 3 | Bank sandbox access is delayed or the API does not support the desired operation | Commitment flow blocked or delayed | High | Access will be requested early, since approval time is outside the team's control. The provider documentation will be reviewed in Stage 3 so the commitment flow is designed around what the sandbox supports rather than what is assumed. Bank logic will sit behind one backend service, so a change of operation or provider affects one component, and Al Rajhi remains the backup candidate. |
| 4 | Unauthorized access to private auctions | Users without the code view or bid in private auctions | Medium | The access code is validated and authorization is checked on the server. The frontend is never the only protection, because hiding an item in the interface does not prevent a direct request. Unauthorized access attempts will be tested. |
| 5 | Incorrect anti-sniping timing | Unpredictable end times, or bids accepted or rejected incorrectly near closing | Medium | Time is calculated on the server only, so differences between client clocks cannot affect the end time. The rule will be defined clearly in Stage 3, and boundary conditions near the threshold and the closing time will be tested. |
| 6 | Frontend, backend, and database do not integrate smoothly | Broken workflow and late rework | Medium | Shared API contracts will be agreed in Stage 3 so each part is built against the same expectations. Parts are integrated continuously rather than only at the end, and the Task Review & Cross-Task Integration area checks that they work together. |
| 7 | Scope creep | Core auction features left incomplete | Medium | This Stage 2 scope is the baseline for all later stages. Additions that do not support the auction workflow are rejected, and scope is reviewed at each checkpoint so effort stays on the core features. |
| 8 | Demo or deployment fails | Unconvincing final presentation | Medium | Docker provides the same environment on every machine, seeded test data makes the demonstration repeatable, and the full workflow is rehearsed before the presentation. A backup demo environment and data are kept in case the primary one fails. |

---

## Task 4: Develop a High-Level Plan

### Project Timeline

| Stage | Purpose | Weeks | Deliverable |
| :--- | :--- | :--- | :--- |
| **Stage 1 — Idea Development** | Generate and evaluate ideas and select the MVP concept | Week 1 | Selected concept: Mezyad (completed) |
| **Stage 2 — Project Charter** | Fix the purpose, objectives, stakeholders, responsibilities, scope, risks, and plan before design begins | Weeks 2–3 | Project Charter (this document) |
| **Stage 3 — Requirements & Technical Design** | Decide how the approved scope will be built: user stories, UI/UX, architecture, database design, API design, auction rules, anti-sniping design, bank API design, AI Listing Assistant design, and testing strategy | Weeks 4–5 | Technical documentation set |
| **Stage 4 — Implementation & Integration** | Build and connect the approved features: authentication, listings, admin approval, public/private auctions, bidder commitment, bank API, real-time bidding, anti-sniping, AI listing assistance, auction closure, and winner determination | Weeks 6–10 | Functional Mezyad auction MVP |
| **Stage 5 — Testing, Bug Fixing, Documentation & Presentation** | Verify the MVP, fix defects, and complete documentation and the final presentation | Weeks 11–12 | Tested MVP, final documentation, presentation |

### Major Milestones

| Milestone | Outcome |
| :--- | :--- |
| **End of Week 3** | Project Charter completed |
| **End of Week 5** | Technical documentation completed |
| **End of Week 9** | Core auction functionality working: listings, admin approval, public/private auctions, bidding, bid history, real-time updates, anti-sniping (Objective 2) |
| **End of Week 10** | Full approved MVP integrated: commitment, bank API, AI listing assistance, closure, winner determination (Objective 1) |
| **End of Week 12** | Testing, bug fixing, final documentation, and presentation completed (Objective 3) |

### Why the Plan Is Sequenced This Way

The plan follows a dependency chain: requirements and design, then implementation, then integration, then testing. Design comes first because the database, backend, and frontend depend on shared decisions such as data structures and API contracts. Implementation follows so that the team builds against agreed designs rather than assumptions. Testing comes last because it needs a working, integrated MVP.

Within Stage 4, the core auction is built first (Weeks 6–9), because listings, approval, bidding, live updates, and anti-sniping form the foundation the other features attach to. Bidder commitment, bank API integration, AI listing assistance, closure, and winner determination are integrated in Week 10, since they depend on the auction core being in place. This ordering also gives the team an early check on the most demanding part of the project, real-time bidding.

Bank API access is treated as an early dependency even though the integration is implemented later. Sandbox access depends on the provider rather than on the team, and the exact API operation cannot be selected until the documentation and access are reviewed. Requesting access early and settling the operation in Stage 3 reduces the chance that the commitment flow is blocked when implementation needs it.

---

## Task 5: Project Charter Completion / Transition to Stage 3

This Project Charter is the completed Stage 2 deliverable. It establishes the project purpose, three SMART objectives, product and project stakeholders, team responsibilities, in-scope and out-of-scope boundaries, a risk register with mitigations, and a high-level 12-week schedule with milestones.

**Document Status:** Stage 2 Project Charter — Final

The charter creates a baseline for implementation. It fixes the objectives the team will be measured against, the stakeholders the system serves, the responsibilities each member holds, the scope the team will build, the risks the team will monitor, and the schedule the team will follow. Later stages work from this baseline rather than reopening these decisions.

**Stage 2 defines WHAT the project will deliver. Stage 3 defines HOW it will be designed and implemented.**

Stage 3 may specify technical details such as:

* API contracts
* database schema
* UI flows
* system architecture
* anti-sniping parameters (threshold and extension duration)
* the selected bank API operation
* the AI implementation approach
* the testing strategy

Stage 3 must not introduce major new product features that are absent from this approved Stage 2 scope. If a capability is not approved here, it does not appear as a major feature in the technical documentation.
