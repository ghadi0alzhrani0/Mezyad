# Stage 2 Report: Mezyad — High-Value Asset Auction Platform

## Executive Summary

**Mezyad — High-Value Asset Auction Platform** is an online auction platform for high-value assets, focused on controlled auction participation, bidder commitment, and reliable real-time bidding.

**The central problem.** High-value online auctions require clear asset information, controlled participation, a defined commitment step for bidders, dependable real-time bidding, and a predictable closing process. For assets such as vehicles or real estate, bidders need enough detail to evaluate the asset, sellers may want to decide who can enter the auction, and every participant needs to see the same live price and the same ending. When listings are unclear, participation is uncontrolled, or the live auction state is inconsistent, the auction becomes difficult to rely on.

**Why this idea was selected.** Stage 1 selected Mezyad because it addresses a meaningful problem while remaining achievable as a graduation MVP. The project concentrates its effort on the auction workflow rather than on activities surrounding a sale. This suits a four-person team working over 12 weeks and allows the team to build the auction experience in depth, especially real-time bidding, instead of spreading effort across unrelated features.

**The approved workflow.** The MVP follows one defined path:

Registration / Login → Seller Creates Listing → Structured Asset Information → Admin Review & Approval → Public or Private Auction → Bid Commitment → Bank API Integration through a Saudi Open Banking Sandbox → Live Real-Time Bidding → Anti-Sniping → Auction Closure → Winner Determination / Auction Result

**Boundaries.** Mezyad is a student graduation MVP. It does not move real money, does not use live customer banking data, does not provide production financial services, and makes no production-grade legal, financial, or security guarantees. The planned bank integration will use an official sandbox/testing environment with test data. The workflow ends with a recorded winner and auction result, and nothing after that point is part of the project.

**Focus of the MVP.** Mezyad focuses on controlling the auction lifecycle, from listing and review through participation, bidding, and closure, rather than on implementing a complete financial transaction platform. The project demonstrates this workflow and its technical integration within the limits of a student MVP.

This charter defines the purpose, objectives, stakeholders, team responsibilities, scope, risks, and high-level plan that guide Stages 3 to 5.

---

## Task 0: Define Project Objectives

### Project Purpose

Mezyad provides a focused auction experience for high-value assets. Its purpose rests on six elements. Each addresses a specific need of high-value online auctions, and each belongs in the MVP because it directly supports the auction workflow.

**1. Clear asset information.** High-value assets require clear and structured information because bidders need to understand what they are considering before participating in an auction. Sellers provide category-specific details, such as make, model, year, mileage, and condition for vehicles, or property type, area, location, bedrooms, and condition for real estate. Structuring the information makes listings easier to understand and gives bidders consistent details to review before placing a bid. Administrators review submitted listings before they become available as auctions. This is part of the MVP because a reliable auction depends on bidders having sufficient and organized information about the asset.

**2. Controlled participation.** Not every high-value asset is intended for the general public. A seller can make an auction public or restrict it through a private access code. This gives sellers a simple way to control who can enter an auction without requiring a participant-management system.

**3. A defined commitment step for bidders.** Bidders should reach the live auction through a deliberate, controlled step rather than by simply opening a page. Each bidder completes a Bid Commitment step before bidding, connected to an official Saudi Open Banking sandbox integration. Bid Commitment is a controlled participation checkpoint. It does not claim that a bidder is guaranteed to be serious or to complete any later transaction. It belongs in the MVP because it links the required bidder commitment step to the auction workflow and satisfies the project's required bank API integration.

**4. Dependable real-time bidding.** If bidders see different prices, or a bid is accepted incorrectly, the auction cannot be trusted. Bids are validated on the server, and the highest bid, bid history, and timer are updated live for all participants. Anti-sniping extends the auction when a valid bid arrives near the end. This is the core of the platform and receives the largest share of implementation effort.

**5. Predictable auction closure.** An auction needs a clear, unambiguous ending. At the final valid end time, bidding stops, the winner is determined from valid bids, and the result is recorded and displayed. This completes the auction workflow without extending into activities that happen after the auction.

**6. Smart Auction Assistant.**

The Smart Auction Assistant is a lightweight feature designed to improve the usability of Mezyad for both sellers and bidders. It provides simple assistance with listing creation, auction discovery, and understanding auction activity without making financial or bidding decisions. It works only with information already available in the platform.

The assistant provides the following six functions.

*Seller-side*

* Listing Title Suggestion: Generates a clear auction title based on the asset information provided by the seller.
* Listing Completeness Suggestions: Identifies missing or incomplete listing information and suggests details that the seller may want to add.

*Bidder-side*

* Search Assistance: Helps bidders find relevant auctions using simple natural-language queries based on factors such as asset type, category, location, or price range.
* Auction Activity Summary: Provides a concise summary of auction activity, including the number of bidders, number of bids, and overall bidding activity.
* Bidding Activity Insights: Displays basic activity patterns, such as periods with increased bidding activity and the number of bids received during different periods of the auction.
* Auction Summary: Provides bidders with a quick overview of the current auction state, including the current highest bid, number of bids, remaining time, and recent activity.

### SMART Objectives

**Objective 1 — End-to-End MVP**

By the end of Week 10, demonstrate the complete approved MVP workflow across both a public-auction scenario and a private-auction scenario, including seller listing and admin approval, bidder commitment, bank API integration, real-time bidding, anti-sniping, auction closure, and winner determination.

* *What is delivered:* one integrated MVP that runs the full workflow for both auction types.
* *Why Week 10:* Stage 4 runs from Week 6 to Week 10, so this is the point at which implementation and integration must be complete, leaving Weeks 11–12 for testing.
* *Measure:* the approved workflow is demonstrated successfully for both a public-auction scenario and a private-auction scenario without manual database changes. This criterion shows that the workflow runs through the system itself rather than through manual edits to the data. The objective is considered complete when the defined workflow can be demonstrated from listing creation through auction result within the approved project scope.

**Objective 2 — Core Auction Functionality**

By the end of Week 9, implement and demonstrate validated bid submission, bid history, live auction updates, auction timing, and anti-sniping.

* *What is delivered:* the core auction functionality, working before the remaining features are integrated.
* *Why Week 9:* completing the core one week before the full MVP leaves Week 10 for the remaining approved features (commitment, bank API integration, Smart Auction Assistant, closure, and winner determination), gives early warning if the auction logic needs rework, and allows time for the bank sandbox dependency, which is requested early, to be resolved before final integration.
* *Measure:* with at least two users bidding on the same auction, valid bids are accepted and invalid bids are rejected, all users see updates live, and a valid bid placed in the final period extends the end time.

**Objective 3 — Validation**

By the end of Week 12, complete structured testing and validation covering authentication, listing creation, admin approval, public and private access, commitment, bank API integration, real-time bidding, anti-sniping, auction closure, winner determination, Smart Auction Assistant, and relevant edge cases.

* *What is delivered:* a tested MVP with documented test results.
* *Why Week 12:* testing follows implementation, so Weeks 11–12 are reserved for it, together with bug fixing and final documentation.
* *Measure:* a documented test plan with recorded results for each listed area, with defects found in the core workflow fixed or documented.

---

## Task 1: Identify Stakeholders and Team Roles

This task separates two groups. **Product Users and Beneficiaries** are the people who use Mezyad and benefit directly from its functions. **Project Stakeholders** are the people and groups with an interest in the project itself: those who build it, assess it, and guide it. Team members are not users of the product, so the two groups are described separately.

### Product Users and Beneficiaries

Mezyad has three product users: bidders/buyers, sellers, and administrators. Each one is described by who benefits and how, what they use, why their role is needed, and where they appear in the auction workflow.

#### Bidders / Buyers

**Who benefits and how.** Bidders benefit from an organized and understandable auction experience. Mezyad helps them understand the asset before bidding, reach the auction (public, or private through a code), complete the required step before bidding, follow the auction live, place bids, and see a clear result when the auction ends.

**What they use.**
* Structured asset information on each listing (for example make, model, year, mileage, and condition for a vehicle), so they can understand the asset before bidding.
* Public auctions from the public auction list.
* Private auctions, accessed through a private access code provided by the seller.
* Bid Commitment, a required participation step before bidding.
* The bank sandbox interaction, which is part of the commitment flow and uses test/sandbox data.
* The live auction view, which shows the current highest bid, bid history, and auction timer.
* Real-time updates, so the displayed price and status follow the auction as bids arrive.
* Anti-sniping, which gives active bidders additional time to respond when a valid bid is received near the scheduled closing time.
* The auction result, shown when the auction closes.
* The Smart Auction Assistant's bidder-side functions: search assistance, auction activity summary, bidding activity insights, and auction summary. These present information the platform already holds. The bidder makes every bidding decision.

**Why their role is needed.** Bidders are the main users during the auction phase, and an auction has no meaning without them. The platform must therefore make the state of the auction clear to them: what is being sold, whether they may enter, what the current price is, how much time remains, and when and how the auction ends.

**Place in the workflow.** Bidders take part from Public or Private Auction access through Bid Commitment, Bank API Integration through the Saudi Open Banking Sandbox, Live Real-Time Bidding, Anti-Sniping, and Auction Closure, and they receive the Auction Result. A bidder can place bids only after gaining access to the auction and completing the commitment step.

#### Sellers

**Who benefits and how.** Sellers benefit from a structured way to offer a high-value asset for auction. Mezyad helps them build an organized listing, present clear information about the asset, choose whether the auction is public or private, and have the listing reviewed before it is published. The result is a reviewed and controlled auction instead of an uncontrolled posting.

**What they use.**
* Listing creation, with a title, category, description, images, starting price, and auction start and end times.
* Structured asset information with category-specific fields (vehicles: make, model, year, mileage, condition; real estate: property type, area, location, bedrooms, condition).
* Public or private auction selection.
* The private access code for private auctions, which the seller provides to participants outside the platform.
* Admin review, meaning submission of the listing for approval or rejection.
* The listing status view, and later the auction result.
* The Smart Auction Assistant's seller-side functions: listing title suggestion and listing completeness suggestions. The seller remains responsible for the information and the final content.

**Why their role is needed.** Sellers are the source of the asset information, so the clarity of an auction depends on the quality of the data they enter. Structured fields and the assistant's suggestions help them present the asset clearly, and Admin Review gives them a defined route to publication.

**Place in the workflow.** Sellers start the listing part of the workflow: Seller Creates Listing, Structured Asset Information, and submission for Admin Review & Approval. They choose Public or Private Auction access and later see the auction result. Once a listing is approved, the seller does not take part in the bidding itself.

#### Administrators

**Who benefits and how.** Administrators benefit from a clear workflow for reviewing listings before they are published. It lets them decide which listings become auctions and keeps the published auctions inside a defined process.

**What they use.**
* The listing review interface.
* Structured listing information, so listings can be checked consistently.
* The approve and reject actions. Only approved listings can proceed to auction.
* Listing status.
* Relevant auction status, where monitoring is necessary.

**Why their role is needed.** Admin Review prevents every submitted listing from moving directly to an auction without review, which matters for high-value assets. The Smart Auction Assistant does not replace the administrator. It only provides suggestions, and the decision to approve or reject a listing stays with the administrator.

**Place in the workflow.** Administrators act at the Admin Review & Approval step, after the seller submits a listing and before it becomes a public or private auction. Their role in the auction itself is limited to monitoring status where necessary.

### Smart Auction Assistant

The Smart Auction Assistant is a lightweight feature designed to improve the usability of Mezyad for both sellers and bidders. It provides simple assistance with listing creation, auction discovery, and understanding auction activity without making financial or bidding decisions.

**Seller-side assistance**
* **Listing Title Suggestion:** generates a clear auction title based on the asset information provided by the seller.
* **Listing Completeness Suggestions:** identifies missing or incomplete listing information and suggests details that the seller may want to add.

**Bidder-side assistance**
* **Search Assistance:** helps bidders find relevant public auctions using simple natural-language queries based on factors such as asset type, category, location, or price range. Private auctions are not discoverable this way and remain accessible only through their access code.
* **Auction Activity Summary:** provides a concise summary of auction activity, including the number of bidders, the number of bids, and overall bidding activity.
* **Bidding Activity Insights:** displays basic activity patterns, such as periods with increased bidding activity and the number of bids received during different periods of the auction.
* **Auction Summary:** gives bidders a quick overview of the current auction state, including the current highest bid, number of bids, remaining time, and recent activity.

**Why it exists and how it stays lightweight.** Sellers may have the asset details but not know how to present them, and bidders may find it hard to follow an auction that is moving quickly. The assistant uses information already available within the platform and is intentionally limited to simple, practical functions that can be implemented within the MVP. For example, the activity summary relies on bid and bidder counts, the auction summary on the current highest bid, bid count, remaining time, and recent activity, the bidding insights on the timestamps of bids already recorded, and the completeness suggestions on required fields that are missing. It does not use predictive analytics, a specially trained model, or a recommendation engine.

**Limits.** The assistant does not determine asset value, recommend bid amounts, predict auction winners, make financial decisions, approve listings, or replace user decisions. It is not a chatbot.

### Project Stakeholders

Project stakeholders are not users of the platform. They are the groups who create, evaluate, or guide the project. Their interest is in whether the project is delivered, meets its requirements, and stays within its agreed scope.

| Stakeholder | Why they are a stakeholder | Relationship to the project | What they need or expect |
| :--- | :--- | :--- | :--- |
| **Project Team** (Abeer, Ghadi, Aseel, Tala) | The project's outcome depends directly on the team's work and its ability to deliver within 12 weeks | Designs, builds, tests, and documents the MVP; its success depends on collaboration and on delivering the approved scope | A clearly defined, achievable scope; clear responsibilities; and a realistic schedule |
| **Academy Instructors / Evaluators** | They assess the project against the academic requirements of each stage | Review the deliverables at each stage and evaluate the final MVP for stage requirements, quality of output, clarity of scope, and technical content | A measurable, well-scoped, technically meaningful, and demonstrable project, documented consistently across stages |
| **Project Supervisor / Mentor** | Provides project guidance and ensures required project constraints and integrations are addressed | Gives direction and feedback, and helps confirm that important requirements, such as the Saudi Open Banking Sandbox integration, are handled | Evidence that required constraints are included in the scope and progressing, and that the project stays focused and realistic |

### Team Responsibilities

The table below is the team's agreed working structure. It assigns each area two members so that every part of the project has a clear starting point.

| Responsibility Area | Members | Responsibilities |
| :--- | :--- | :--- |
| **Database** | Abeer + Tala | Database design and data model for users, listings, auctions, commitments, bids, and auction results; database integration with the backend; making sure the data needed by the auction workflow is present and well organized |
| **Backend** | Abeer + Ghadi | Server-side logic; authentication and authorization; listing logic; admin approval logic; public/private auction access; bid validation and auction rules; real-time auction logic; anti-sniping; auction closure and winner determination; bank API integration; Smart Auction Assistant integration |
| **Frontend** | Aseel + Ghadi | Responsive web interface; bidder, seller, and admin interfaces; listing creation UI; auction UI with live highest bid, bid history, and auction timer; real-time state presentation; public/private auction access interfaces |
| **Task Review & Cross-Task Integration** | Tala + Aseel | Reviewing completed work; checking consistency between tasks; checking that requirements are reflected correctly; checking integration between frontend, backend, and database; identifying missing or conflicting work; helping detect issues before final integration |
| **Task Allocation, Technical Approach & Docker Operation** | Abeer + Ghadi | Task allocation; organizing implementation dependencies; coordinating the technical approach; keeping work aligned with the approved scope; operating the Docker development environment; maintaining a consistent environment for the team; supporting reliable project setup and demonstration |

Docker is used to maintain a consistent development environment across team members and support a reliable project demonstration.

**Primary Responsibility Areas.** These roles are primary responsibility areas rather than exclusive ownership. Each area has named members who start and follow up its work, which keeps responsibilities clear and makes task tracking easier. Members are expected to support tasks outside their primary area when project conditions require it, and to collaborate across areas when tasks have dependencies or integration issues. This does not mean that everyone does everything. Having two members in each area also reduces dependence on a single person.

### Why This Responsibility Structure Supports Collaboration

* **Less lost time.** Members know where to begin a task and do not spend time deciding who should handle it.
* **A clear primary contact.** Every area has a known primary responsibility, so questions and decisions have a natural place to go.
* **Less duplicated work.** Assigning areas reduces the chance that two members build the same part independently.
* **Easier communication.** When a problem appears, the team knows whom to consult first.
* **Better integration.** Three boundaries matter most in Mezyad. *Database ↔ Backend:* Abeer works in both areas, and the data model must match the auction rules, bids, and commitments the server processes. *Backend ↔ Frontend:* Ghadi works in both, so live auction state, bid validation results, and assistant outputs reach the interface consistently. *Task Review ↔ All Areas:* Tala and Aseel review work across every area and check that the parts fit together before final integration.
* **Shared knowledge.** Each area has two members, so more than one person understands it and the team does not depend on a single person.
* **Flexibility.** Because the structure is a starting point rather than a rule, members can move between areas when priorities change.
* **Easier progress tracking.** The team can see which area a task belongs to, who started it, and who follows up.

---

## Task 2: Define Scope

The scope defines what Mezyad will deliver and what it will not. Mezyad is an online auction platform for high-value assets, and every item below directly supports its auction workflow. The scope is described at a high level: it states what the system will do, why it belongs in the MVP, and where its boundary lies, while how it will be built is left to Stage 3.

### In Scope

**Authentication & Access**

Authentication in Mezyad consists of registration, login, and role-based access. Users register and log in in the conventional way, and the platform then gives each user access according to their role. This is a basic function that any platform of this kind needs. It is not a distinguishing feature of the project, and it is included as the foundation for correct access: it ensures that listings, commitments, and bids are linked to the correct user.

There are three roles:

* **Bidder / Buyer:** accesses public auctions, accesses private auctions with the correct code, completes the commitment step, and places bids.
* **Seller:** creates listings, chooses public or private access, submits listings for approval, and views the results of their auctions.
* **Administrator:** reviews submitted listings and approves or rejects them, and monitors auction status where necessary.

Role-based access matters because each participant has a different responsibility in the auction workflow. Each user reaches only the functions allowed for their role: only sellers create listings, only administrators approve them, and only bidders with access to an auction can bid in it. The boundary is deliberately narrow: registration, login, and roles, with no further identity or account features.

**Seller Listings and Structured Asset Information**

Sellers create listings with a title, category, description, images, starting price, and auction start and end times. Asset information is structured, simple, and category-specific: vehicles use make, model, year, mileage, and condition, and real estate uses property type, area, location, bedrooms, and condition.

Structured information belongs in scope because high-value assets differ widely, bidders decide based on specific details, and consistent fields make listings easier to compare and understand before bidding begins. The boundary is that the MVP does not build a large asset taxonomy. It supports only the fields needed for the supported categories, and the exact data structure is a Stage 3 decision.

**Admin Review**

Sellers submit listings for review, and administrators approve or reject them. Only approved listings can proceed to auction. A submitted listing should not automatically become an auction, especially for high-value assets, so this step gives the platform a controlled publishing workflow. The review is intentionally kept simple: approve or reject. It does not include a moderation system or a multi-step approval process.

**Public and Private Auctions**

A public auction appears in the public auction list, and authenticated users can access it and bid. A private auction does not appear in the public list. It is accessed through a private access code that the seller provides to participants outside the platform. An authenticated user must provide the correct code to access the auction, and only authorized participants can bid.

This belongs in scope because not every high-value asset is intended for the general public, and sellers need a simple way to limit who can enter an auction. The MVP implements this through a private access code rather than an invitation-management system, which keeps participation control within the project's time and complexity limits. The MVP implements only Private Auction → Private Access Code → Authorized Participant Access.

**Bid Commitment**

Bid Commitment is a required participation step that a bidder completes before bidding. It works as a controlled participation checkpoint within the auction workflow, so that bidders enter the live auction through a defined step rather than by simply opening a page. In the workflow it sits between auction access and live bidding: a bidder who has access to an auction completes it before being allowed to place bids. It belongs in scope because it connects the auction workflow to the required bank sandbox integration.

Its boundary is strict. It is not a financial deposit, escrow, custody, payment, settlement, or money transfer, and it is intentionally limited so that the auction workflow remains the focus of the project. The exact implementation depends on what the selected bank sandbox supports and will be defined in Stage 3. Mezyad will not claim to verify funds, creditworthiness, or financial eligibility unless the selected API explicitly supports such an operation.

**Saudi Open Banking Sandbox Integration**

Mezyad will integrate with an official Saudi Open Banking sandbox/testing environment as part of the bidder commitment flow. This is a required project constraint, and it connects the commitment step to a real Saudi bank API rather than to a purely internal mechanism. A sandbox is appropriate because it provides a non-production environment for developing and testing the integration without production access. The integration uses test/sandbox data only: no live customer financial data is used, no real money moves, and no production banking access is claimed.

The bank sandbox interaction is a supporting integration inside the Bid Commitment step, not a separate stage of the business workflow. It appears in the workflow path only to show where in the commitment step the integration is used.

* *Role in the workflow:* the integration supports the bidder commitment workflow. It is not a payment processor, not a banking application, and not an escrow or settlement system.
* *Provider candidates:* the primary candidate is the SABB Open Banking Developer Sandbox, and the backup candidate is the Al Rajhi Bank Developer Portal / Sandbox.
* *Access status:* sandbox access has not yet been obtained. No credentials are held, and no specific API endpoint has been selected.
* *Decided in Stage 3:* the exact API operation will be selected after reviewing the provider's documentation and the access the team is granted.

**Real-Time Bidding**

The auction supports bid submission, bid validation, the current highest bid, bid history, an auction timer, auction start and end rules, live auction state, real-time updates to participants, and consistent handling of concurrent bids.

Live auction state matters because bidders act on the current price and remaining time, so every participant needs to see the same current state as the auction progresses. The server is authoritative for auction state and bid validation, so the client cannot decide auction outcomes, and bids that arrive close together are handled consistently. Bidding opens for a bidder only after the commitment step is complete, and the bids recorded here are what the closing step later uses to determine the winner. Real-time bidding is the core of an auction platform and of Mezyad, and it therefore receives significant implementation and testing effort. Its boundary at this stage is functional: the technical mechanisms used to deliver these behaviors are defined in Stage 3.

**Anti-Sniping**

If a valid bid is received during the defined final period of an auction, the auction end time is automatically extended. Its purpose is to give active bidders additional time to respond to bids received near the scheduled closing time. It belongs in scope because closing behavior is a central part of the auction experience, and it is limited to this single rule. The exact threshold and extension duration will be defined in Stage 3.

**Auction Closure and Winner Determination**

When an auction reaches its final valid end time, bidding stops, the winner is determined from the valid bids, the auction status changes to closed, and the result is recorded and displayed. The final end time includes any anti-sniping extension. This belongs in scope because every auction needs a clear and deterministic ending. The workflow ends at the auction result and includes no payment, settlement, handover, or later steps.

**Smart Auction Assistant**

The Smart Auction Assistant is a lightweight usability assistant that improves the use of Mezyad for both sellers and bidders. It provides simple assistance with listing creation, auction discovery, and understanding auction activity, without making financial or bidding decisions. It works from information already available within the platform. It is not predictive and not a separate AI project, and it is limited to six simple, practical functions.

*Seller-side*
1. **Listing Title Suggestion:** suggests a clear auction title based on the asset information the seller provided.
2. **Listing Completeness Suggestions:** identifies missing or incomplete listing information and suggests details the seller may want to add.

*Bidder-side*
3. **Search Assistance:** helps bidders find relevant public auctions using simple queries based on factors such as asset type, category, location, or price range.
4. **Auction Activity Summary:** summarizes auction activity, such as the number of bidders and bids.
5. **Bidding Activity Insights:** shows basic activity patterns, such as periods of increased bidding.
6. **Auction Summary:** gives a quick overview of the current auction state, such as the current highest bid, number of bids, remaining time, and recent activity.

The assistant belongs in scope because sellers may have the asset details but not know how to present them clearly, and bidders may find a fast-moving auction hard to follow. Users remain responsible for their own content and decisions, and the administrator still reviews every listing. The implementation approach will be decided in Stage 3. The assistant does not determine asset value, predict prices, recommend bid amounts, predict winners, make financial decisions, approve or reject listings, replace administrators, or act as a chatbot.

**Quality**

The MVP includes a responsive web interface, structured testing and validation, and the documentation required for the project. The testing strategy is defined in Stage 3.

**Overall scope boundary.** The in-scope items form one connected workflow: listing creation, review, public or private auction, bidder commitment, real-time bidding, auction closure, and the winner and result. Each item depends on the one before it, and together they make up the complete auction experience that the MVP delivers. Any feature that does not serve this workflow is outside the scope.

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

This section identifies the main risks of the Mezyad MVP across technology, external dependencies, security and access, project management, and deployment. Each risk records what could go wrong, its impact, its priority level, and the mitigation the team will apply. Levels are qualitative priorities (High or Medium), not numerical scores. The two High-priority risks matter most: inconsistent auction state (Risk 1) would undermine trust in the core of the platform, and delayed bank sandbox access (Risk 3) could block a required project constraint.

### Risk Register

| # | Risk | Impact | Level | Mitigation |
| :-- | :--- | :--- | :--- | :--- |
| 1 | Concurrent bids cause inconsistent auction state | Wrong highest bid or winner; unreliable auction results | High | The server remains authoritative for bid validation and auction state, so clients cannot independently decide whether a bid is valid. The bid-handling rules will be defined in Stage 3, and simultaneous-bid scenarios will be tested to reduce the risk of inconsistent results. |
| 2 | Real-time updates are delayed or missed | Bidders see outdated prices or miss the closing | Medium | Because the server holds the true auction state, a client that falls behind can be corrected by refreshing that state. Reconnect and refresh handling lets a bidder recover after a dropped connection, and network interruption cases will be tested. |
| 3 | Bank sandbox access is delayed or the API does not support the desired operation | Commitment flow blocked or delayed; Week 10 integration at risk | High | Sandbox access has not yet been obtained, so it will be requested early, since approval time is outside the team's control. The provider documentation will be reviewed in Stage 3 so the commitment flow is designed around what the sandbox supports rather than what is assumed. Bank logic will sit behind one backend service, so a change of operation or provider affects one component, and Al Rajhi remains the backup candidate. Only sandbox/test data is used. |
| 4 | Unauthorized access to private auctions | Users without the code view or bid in private auctions | Medium | The access code is validated and authorization is checked on the server. The frontend is never the only protection, because hiding an item in the interface does not prevent a direct request. Unauthorized access attempts will be tested. As a student MVP, Mezyad makes no claim of production-grade security certification. |
| 5 | Incorrect anti-sniping timing | Unpredictable end times, or bids accepted or rejected incorrectly near closing | Medium | Time is calculated on the server only, so differences between client clocks cannot affect the end time. The threshold and extension rule will be defined clearly in Stage 3, and boundary conditions near the threshold and the closing time will be tested. |
| 6 | Frontend, backend, and database do not integrate smoothly | Broken workflow, delayed dependencies, and late rework that threatens the Week 9 and Week 10 milestones | Medium | Shared API contracts and the database structure will be agreed in Stage 3 so each part is built against the same expectations. Parts are integrated continuously rather than only at the end, and the Task Review & Cross-Task Integration area checks that they work together. |
| 7 | Scope creep | Core auction features left incomplete; schedule pressure | Medium | This Stage 2 scope is the baseline for all later stages. Additions that do not support the auction workflow are rejected, and scope is reviewed at each checkpoint so effort stays on the core features. The Smart Auction Assistant stays limited to its six lightweight functions. |
| 8 | Demo or deployment fails | Unconvincing final presentation | Medium | Docker provides the same environment on every machine, seeded test data makes the demonstration repeatable, and the full workflow is rehearsed before the presentation. A backup demo environment and data are kept in case the primary one fails. |

### Risk Reduction and Monitoring

The mitigations above are supported by practices the team applies throughout development. These are risk-reduction measures, not additional risks.

* **Server-side validation.** Critical auction rules (bid validation, access control for private auctions, auction timing, and winner determination) are enforced on the server, so no result depends on the user's browser. This reduces Risks 1, 4, and 5.
* **Automated and scenario-based testing.** The team tests concurrent bids, invalid bids, private-auction access with and without the code, closing-time boundaries, anti-sniping extensions, and network interruptions. Tests are run as each feature is completed, not only in Weeks 11–12, so problems are found while there is still time to fix them. This reduces Risks 1, 2, 4, and 5.
* **Continuous integration between frontend, backend, and database.** Parts are connected as they are built instead of leaving integration to the end. This reduces Risk 6 and protects the Week 9 and Week 10 milestones.
* **Stage 3 technical planning.** API contracts, database structure, auction rules, anti-sniping parameters, and the selected bank sandbox operation are settled in Stage 3, before implementation begins. This reduces Risks 1, 3, 5, and 6.
* **Early bank dependency checking.** Sandbox access and provider limitations are outside the team's direct control, so access is requested early and the documentation is reviewed in Stage 3. If the primary candidate (SABB) proves unavailable or unsuitable, the backup candidate (Al Rajhi) can be considered. This reduces Risk 3.
* **Docker.** A shared Docker environment keeps development consistent across team members and supports a reliable demonstration. This reduces Risks 6 and 8.
* **Seeded, repeatable test data.** The same test data is used for testing and for the demonstration, so results can be reproduced. This reduces Risk 8.
* **Code and task review across responsibility areas.** Tala and Aseel review completed work across areas and check consistency, so conflicts and missing pieces are found before final integration. This reduces Risk 6.
* **Scope checkpoints.** The team compares current work against the approved Stage 2 scope at each checkpoint and rejects additions that do not support the auction workflow. This reduces Risk 7.
* **Demo rehearsal and backup preparation.** The full workflow is rehearsed before the final presentation, and backup data and a backup environment are prepared. This reduces Risk 8.

**Monitoring.** The team monitors risks through the existing milestones. At the end of Week 5, it confirms that the Stage 3 decisions those risks depend on (including the bank sandbox operation and access status) are documented. At the end of Week 9, it checks that core auction functionality, including bid handling, real-time updates, and anti-sniping, passes its scenario tests. At the end of Week 10, it checks that the full workflow runs end to end. During Weeks 11–12, it repeats the tests and rehearses the demonstration. If a check fails or a dependency is delayed, the team reviews the affected work at the next checkpoint, reassigns effort across responsibility areas where needed, and keeps the core auction workflow as the priority.

---

## Task 4: Develop a High-Level Plan

The plan maps the five official project stages onto the 12-week schedule and identifies the key deliverables and milestones of each stage. It is a high-level plan and does not specify detailed technical tasks.

### Project Timeline

| Stage | Purpose | Weeks | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **Stage 1 — Idea Development** (Completed) | Generate and evaluate ideas and select the MVP concept | Week 1 | Selected concept: Mezyad |
| **Stage 2 — Project Charter Development** (Current) | Fix the purpose, objectives, stakeholders, responsibilities, scope, risks, and plan before design begins | Weeks 2–3 | Project Charter (this document) |
| **Stage 3 — Technical Documentation** | Document how the approved scope will be built: requirements and user stories, UI/UX, architecture, database design, API design, auction rules, anti-sniping design, bank API planning, Smart Auction Assistant design, and testing strategy | Weeks 4–5 | Technical documentation set |
| **Stage 4 — MVP Development** | Build and connect the approved features: authentication, listings, admin approval, public/private auctions, bidder commitment, bank API integration, real-time bidding, anti-sniping, Smart Auction Assistant, auction closure, and winner determination | Weeks 6–10 | Functional Mezyad auction MVP |
| **Stage 5 — Project Closure** | Complete the project: final system testing, bug fixing, final documentation, and the final presentation | Weeks 11–12 | Tested MVP, final documentation, and presentation |

### Major Milestones

| Milestone | Outcome |
| :--- | :--- |
| **End of Week 3** | Project Charter completed |
| **End of Week 5** | Technical documentation completed |
| **End of Week 9** | Core auction functionality working: listings, admin approval, public/private auctions, bidding, bid history, real-time updates, anti-sniping (Objective 2) |
| **End of Week 10** | Full approved MVP integrated: commitment, bank API integration, Smart Auction Assistant, closure, winner determination (Objective 1) |
| **End of Week 12** | Final testing, bug fixing, final documentation, and presentation completed (Objective 3) |

### Why the Plan Is Sequenced This Way

The plan follows a dependency chain: technical documentation, then implementation, then integration, then final system testing. Technical documentation comes first because the database, backend, and frontend depend on shared decisions such as data structures and API contracts. Implementation follows so that the team builds against agreed designs rather than assumptions. The transition from Stage 3 to Stage 4 is therefore a hand-off: Stage 2 fixes what will be built, Stage 3 settles how it will be built, and Stage 4 starts from those documented decisions rather than from open design questions. Final system testing occurs after the MVP is integrated, because it needs the complete workflow to be running. Feature-level testing and validation are performed throughout development, as each feature is completed, so that problems are found while there is still time to fix them.

Within Stage 4, the core auction is built first (Weeks 6–9), because listings, approval, bidding, live updates, and anti-sniping form the foundation the other features attach to. Bidder commitment, bank API integration, the Smart Auction Assistant, closure, and winner determination are integrated in Week 10, since they depend on the auction core being in place. This ordering also gives the team an early check on the most demanding part of the project, real-time bidding.

Bank API access is treated as an early dependency even though the integration is implemented later. Sandbox access depends on the provider rather than on the team, has not yet been obtained, and the exact API operation cannot be selected until the documentation and access are reviewed. Requesting access early and settling the operation in Stage 3 reduces the chance that the commitment flow is blocked when implementation needs it.

---

## Task 5: Share Your Document

This Project Charter is now complete. Together, Tasks 0 to 4 provide the project purpose and SMART objectives; the stakeholders and team responsibilities; the in-scope and out-of-scope boundaries; the risks with mitigation strategies; and the high-level timeline and milestones. The document is ready to be shared for review.

**Document Status:** Stage 2 Project Charter — Final

The charter creates a baseline for implementation. It fixes the objectives the team will be measured against, the stakeholders the system serves, the responsibilities each member holds, the scope the team will build, the risks the team will monitor, and the schedule the team will follow. It defines what will be built and why, while how it will be built is decided in Stage 3. Later stages work from this baseline rather than reopening these decisions.
