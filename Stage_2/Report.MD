# Stage 2 Report: Mezyad — High-Value Asset Auction Platform

## Executive Summary

**Mezyad — High-Value Asset Auction Platform** is an online auction platform for high-value assets, focused on controlled auction participation, bidder commitment, and reliable real-time bidding.

**The central problem.** High-value online auctions require clear asset information, controlled participation, a defined commitment step for bidders, dependable real-time bidding, and a predictable closing process. For assets such as vehicles or real estate, bidders need enough detail to evaluate the asset, sellers may want to decide who can enter the auction, and every participant needs to see the same live price and the same ending. When listings are unclear, participation is uncontrolled, or the live auction state is inconsistent, the auction becomes difficult to rely on.

**Why this idea was selected.** Stage 1 selected Mezyad because it addresses a meaningful problem while remaining achievable as a graduation MVP. The project concentrates its effort on the auction workflow rather than on activities surrounding a sale. This suits a four-person team working over 12 weeks and allows the team to build the auction experience in depth, especially real-time bidding, instead of spreading effort across unrelated features.

**The approved workflow.** The MVP follows one defined path:

Registration / Login → Seller Creates Listing → Structured Asset Information → Admin Review & Approval → Public or Private Auction → Bid Commitment → Bank API Integration through a Saudi Open Banking Sandbox → Live Real-Time Bidding → Anti-Sniping → Auction Closure → Winner Determination / Auction Result

**Boundaries.** Mezyad is a student graduation MVP. It does not move real money, does not use live customer banking data, does not provide production financial services, and makes no production-grade legal, financial, or security guarantees. The bank integration uses an official sandbox/testing environment with test data. The workflow ends with a recorded winner and auction result, and nothing after that point is part of the project.

This charter defines the purpose, objectives, stakeholders, team responsibilities, scope, risks, and high-level plan that guide Stages 3 to 5.

---

## Task 0: Define Project Objectives

### Project Purpose

Mezyad provides a focused auction experience for high-value assets. Its purpose rests on five elements. Each addresses a specific need of high-value online auctions, and each belongs in the MVP because it directly supports the auction workflow.

**1. Clear asset information.** High-value assets require clear and structured information because bidders need to understand what they are considering before participating in an auction. Sellers provide category-specific details, such as make, model, year, mileage, and condition for vehicles, or property type, area, location, bedrooms, and condition for real estate. Structuring the information makes listings easier to understand and gives bidders consistent details to review before placing a bid. Administrators review submitted listings before they become available as auctions. This is part of the MVP because a reliable auction depends on bidders having sufficient and organized information about the asset.

**2. Controlled participation.** Not every high-value asset is intended for the general public. A seller can make an auction public or restrict it through a private access code. This gives sellers a simple way to control who can enter an auction without requiring a participant-management system.

**3. A defined commitment step for bidders.** Bidders should reach the live auction through a deliberate, controlled step rather than by simply opening a page. Each bidder completes a Bid Commitment step before bidding, connected to an official Saudi Open Banking sandbox integration. Bid Commitment is a controlled participation checkpoint. It does not claim that a bidder is guaranteed to be serious or to complete any later transaction. It belongs in the MVP because it links the required bidder commitment step to the auction workflow and satisfies the project's required bank API integration.

**4. Dependable real-time bidding.** If bidders see different prices, or a bid is accepted incorrectly, the auction cannot be trusted. Bids are validated on the server, and the highest bid, bid history, and timer are updated live for all participants. Anti-sniping extends the auction when a valid bid arrives near the end. This is the core of the platform and receives the largest share of implementation effort.

**5. Predictable auction closure.** An auction needs a clear, unambiguous ending. At the final valid end time, bidding stops, the winner is determined from valid bids, and the result is recorded and displayed. This completes the auction workflow without extending into activities that happen after the auction.

**6. Smart Auction Assistant**The Smart Auction Assistant is a lightweight feature designed to improve the usability of Mezyad for both sellers and bidders. It provides simple assistance with listing creation, auction discovery, and understanding auction activity without making financial or bidding decisions.
The assistant can provide the following functions:
* Listing Title Suggestion: Generates a clear auction title based on the asset information provided by the seller.
* Search Assistance: Helps bidders find relevant auctions using simple natural-language queries based on factors such as asset type, category, location, or price range.
* Auction Activity Summary: Provides a concise summary of auction activity, including the number of bidders, number of bids, and overall bidding activity.
* Bidding Activity Insights: Displays basic activity patterns, such as periods with increased bidding activity and the number of bids received during different periods of the auction.
* Auction Summary: Provides bidders with a quick overview of the current auction state, including the current highest bid, number of bids, remaining time, and recent activity.
* Listing Completeness Suggestions: Identifies missing or incomplete listing information and suggests details that the seller may want to add.

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

This task separates two groups. **Product users and beneficiaries** are the people who use Mezyad and benefit from it. **Project stakeholders** are the people and groups with an interest in the project itself: those who build it, assess it, and guide it. The two groups have different needs, so they are described separately.

### Product Users and Beneficiaries

#### Bidders / Buyers

**Who benefits and how.** Bidders benefit from an auction they can understand before they take part, join through a clear sequence of steps, and follow live. Mezyad gives them structured asset information, a defined step to complete before bidding, a live view of the auction, and an auction that ends with a clear result.

**What they use.**
* Listing pages with structured, category-specific information (for example make, model, year, mileage, and condition for a vehicle), so they can understand the asset before bidding.
* Public auctions from the public list, or private auctions through an access code provided by the seller.
* The Bid Commitment step, which includes the bank sandbox interaction, before they can place bids.
* The live auction view, which shows the current highest bid, bid history, and auction timer, and updates as bids arrive.
* The auction result, shown when the auction closes.

**Why their role is needed.** An auction has no meaning without bidders. Their experience during the live auction is the main test of the platform. They need to know what they are bidding on, why they may or may not enter an auction, what the current price is, how much time remains, and when the auction ends. Anti-sniping gives them additional time to respond when a valid bid arrives near the scheduled closing time.

#### Sellers

**Who benefits and how.** Sellers benefit from a structured way to offer a high-value asset for auction. Mezyad helps them present the asset clearly, choose who can access the auction, and have the listing reviewed before it is published.

**What they use.**
* The listing creation form, with a title, category, description, images, starting price, auction start and end times, and category-specific asset fields.
* The AI Listing Assistant, which suggests a title, generates or improves the description, and suggests missing information. The seller stays responsible for the final content.
* The public or private access option. Private auctions stay out of the public list and are accessed through a private access code that the seller provides to participants outside the platform.
* The listing status view, and later the auction result.

**Why their role is needed.** Sellers supply the assets and the information about them, so the quality of the auction starts with the quality of the listing. Structured fields and AI-assisted drafting help them present the asset clearly. Admin Review means the listing goes through a defined approval step before it becomes an auction, rather than being published immediately without control. The result is an organized, reviewed auction instead of an uncontrolled posting.

#### Administrators

**Who benefits and how.** Administrators benefit from a single workflow for reviewing submitted listings, so they can decide what becomes an auction. Mezyad gives them the information they need to make that decision and the means to record it.

**What they use.**
* The listing review interface, where they see each submitted listing with its structured asset information.
* The approve and reject actions. Only approved listings can proceed to auction.
* Visibility over relevant listing and auction status, where monitoring is necessary.

**Why their role is needed.** High-value assets should not become auctions automatically on submission. The administrator's decision keeps published auctions inside a defined workflow and gives the platform a controlled publishing step. The AI Listing Assistant does not replace this role, because it only produces suggestions and every listing is still reviewed by an administrator.

### Project Stakeholders

Project stakeholders are not users of the platform. They are the groups who create, evaluate, or guide the project. Their interest is in whether the project is delivered, meets its requirements, and stays within its agreed scope.

| Stakeholder | Why they are a stakeholder | Relationship to the project | What they need or expect |
| :--- | :--- | :--- | :--- |
| **Project Team** (Abeer, Ghadi, Aseel, Tala) | The project's outcome depends directly on the team's work and on its ability to deliver within 12 weeks | Plans, designs, builds, tests, and documents the MVP | A clearly defined, achievable scope; clear responsibilities; and a realistic schedule |
| **Academy Instructors / Evaluators** | They assess the project against the academic requirements of each stage | Review the deliverables at each stage and evaluate the final MVP | A measurable, well-scoped, technically meaningful, and demonstrable project, documented consistently across stages |
| **Project Supervisor / Mentor** | Provides project guidance and ensures required project constraints and integrations are addressed | Guides the team's decisions and confirms that required constraints, such as the Saudi bank API integration, are handled | Evidence that required constraints are included in the scope and progressing, and that the project stays focused and realistic |

### Team Responsibilities

The table below is the team's agreed working structure. It assigns each area two members so that every part of the project has a clear starting point.

| Responsibility Area | Members | Responsibilities |
| :--- | :--- | :--- |
| **Database** | Abeer + Tala | Database design and data model for users, listings, auctions, commitments, bids, and auction results; database integration with the backend; making sure the data needed by the auction workflow is present and well organized |
| **Backend** | Abeer + Ghadi | Server-side logic; authentication and authorization; listing logic; admin approval logic; public/private auction access; bid validation and auction rules; real-time auction logic; anti-sniping; auction closure and winner determination; bank API integration; AI Listing Assistant integration |
| **Frontend** | Aseel + Ghadi | Responsive web interface; bidder, seller, and admin interfaces; listing creation UI; auction UI with live highest bid, bid history, and auction timer; real-time state presentation; public/private auction access interfaces |
| **Task Review & Cross-Task Integration** | Tala + Aseel | Reviewing completed work; checking consistency between tasks; checking that requirements are reflected correctly; checking integration between frontend, backend, and database; identifying missing or conflicting work; helping detect issues before final integration |
| **Task Allocation, Technical Approach & Docker Operation** | Abeer + Ghadi | Task allocation; organizing implementation dependencies; coordinating the technical approach; keeping work aligned with the approved scope; operating the Docker development environment; maintaining a consistent environment for the team; supporting reliable project setup and demonstration |

Docker is used to maintain a consistent development environment across team members and support a reliable project demonstration.

**Primary Responsibility Areas.** The team maintains a high level of flexibility, and all members are prepared to support or take on tasks outside their primary responsibility area when required. The responsibility structure is therefore not intended to create exclusive ownership. Instead, it provides a clear starting point for each area, reduces ambiguity, limits duplicated effort, improves task tracking, and helps the team use its time efficiently. Members can collaborate across areas whenever a task requires shared knowledge or when workload changes. A task assigned to one area does not mean that only that member can carry it out.

### Why This Responsibility Structure Supports Collaboration

* **Less lost time.** Members know where to begin a task and do not spend time deciding who should handle it.
* **A clear primary contact.** Every area has a known primary responsibility, so questions and decisions have a natural place to go.
* **Less duplicated work.** Assigning areas reduces the chance that two members build the same part independently.
* **Easier communication.** When a problem appears, the team knows whom to consult first.
* **Better integration.** The database, backend, and frontend areas each have named members, and Task Review & Cross-Task Integration checks the boundaries between them.
* **Shared knowledge.** Each area has two members, so more than one person understands it and the team does not depend on a single person.
* **Flexibility.** Because the structure is a starting point rather than a rule, members can move between areas when priorities change.
* **Easier progress tracking.** The team can see which area a task belongs to, who started it, and who follows up.

Members also appear in more than one area: Abeer and Tala link the database to the backend, Abeer and Ghadi link the backend to task coordination, and Ghadi links the backend to the frontend. These overlaps sit at the points where integration problems are most likely.

---

## Task 2: Define Scope

Scope control is one of the main purposes of this charter. Every item below directly supports the defined Mezyad auction workflow, and anything that does not is excluded.

### In Scope

**Authentication & Access**

Authentication in Mezyad consists of registration, login, and role-based access. Users register and log in in the conventional way, and the platform then gives each user access according to their role. This is a basic function that any platform of this kind needs, and it is not a distinguishing feature of the project.

There are three roles:

* **Bidder / Buyer:** can browse public auctions, access private auctions with the correct code, complete the commitment step, and place bids.
* **Seller:** can create listings, use the AI Listing Assistant, choose public or private access, submit listings for approval, and view the results of their auctions.
* **Administrator:** can review submitted listings and approve or reject them, and can monitor auction status where necessary.

Authentication is needed so that listings, commitments, and bids are linked to the correct user. Role-based access is needed so that each user reaches only the functions allowed for their role: only sellers create listings, only administrators approve them, and only bidders who have access to an auction can bid in it.

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

The seller provides the underlying information and remains responsible for the final content, and the administrator still reviews every listing. AI is not used for pricing or bidding decisions, because that would turn the project into a valuation or prediction system outside the auction workflow. The assistant does not determine prices, appraise assets, predict winners, make bidding or financial decisions, approve listings, or act as a chatbot.

**Quality**

The MVP includes a responsive web interface, structured testing and validation, and the documentation required to support the project.

**Overall scope boundary.** The in-scope items form a single chain: a listing is created and reviewed, an auction is opened publicly or privately, bidders commit and bid in real time, and the auction closes with a recorded winner and result. Nothing in scope exists outside that chain.

### Out of Scope

These exclusions are deliberate scope controls. They prevent the MVP from becoming a full financial transaction, logistics, or asset-management platform and allow the team to concentrate implementation effort on the auction workflow.

* Real money transfer
* Real financial settlement
* Escrow and financial custody
* Production banking data
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
