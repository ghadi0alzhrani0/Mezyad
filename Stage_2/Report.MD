# Stage 2 Report: Mezyad — High-Value Asset Auction Platform

## Executive Summary

This document is the Stage 2 Project Charter for **Mezyad — High-Value Asset Auction Platform**, a web-based auction platform for high-value assets built around a structured transaction lifecycle: Verification → Listing & Review → Auction → Bid Commitment → Auction Closure / Settlement → Handover.

Stage 1 established why Mezyad was selected: it addresses real trust and commitment problems in high-value online transactions while remaining feasible to build as a graduation MVP. This Project Charter converts that decision into a defined purpose, SMART objectives, stakeholder and role definitions, scope boundaries, a risk register, and a high-level plan for how the project will progress. It establishes what the team is committing to deliver and how the project will be managed, and it sets the stage for Stage 3, where these decisions will be translated into detailed technical documentation.

As established in Stage 1, Mezyad is a graduation MVP/prototype. Identity verification and financial commitment are simulated, there is no real banking or payment integration, and the project makes no production-grade legal, financial, or security guarantees.

---

## Task 0: Define Project Objectives

### Project Purpose & Vision

High-value online transactions — such as those involving real estate, vehicles, and other significant assets — are often affected by weak trust mechanisms, uncertain bidder commitment, and unclear transaction continuity between the moment a bid is placed and the moment the asset changes hands. Stage 1 identified this gap as the core problem motivating the project.

The purpose of Mezyad is to provide a structured digital auction workflow for high-value assets that improves clarity, bidder commitment, and transaction continuity from verification through handover. The platform organizes the auction process into clear stages — verification, listing and review, auction, bid commitment, closure and settlement, and handover — so that buyers, sellers, and administrators can follow a transparent and predictable process.

As a graduation MVP, Mezyad simulates identity verification and financial commitment rather than integrating real banking, payment, or legal verification systems. The project does not claim to eliminate fraud or fake bidding, nor does it provide real financial escrow; it demonstrates and structures the mechanisms that a production system would require, within the boundaries of a prototype.

### SMART Objectives

**Objective 1 — End-to-End MVP Workflow**
Deliver a working MVP in which all six defined lifecycle stages — verification, listing and review, auction, bid commitment, auction closure/settlement, and handover — are implemented, integrated, and demonstrated through an end-to-end user scenario by the end of Week 10.

**Objective 2 — Core User Experience / Auction Functionality**
Deliver the core auction experience with all defined bidding functions operational and demonstrated through representative bidder and seller scenarios by the end of Week 9.

**Objective 3 — Validation and Quality**
Complete structured testing and validation of the MVP before project closure, covering the core user flows (verification, listing, bidding, closure, handover), key edge cases, and the project risks identified in this charter, with testing completed by the end of Week 12.

---

## Task 1: Identify Stakeholders and Team Roles

### Project Stakeholders

**Internal Stakeholders**
* Abeer Al-Saiari — Project Team Member
* Ghadi Al-Zahrani — Project Team Member
* Aseel Al-Zahrani — Project Team Member
* Tala Al-Hudaibi — Project Team Member

**Academic / External Stakeholders**
* Academy instructors and evaluators, who assess the project against academic requirements and deliverable quality
* Project mentors or supervisors, where applicable
* Intended and simulated users of the platform, representing buyers/bidders, sellers, and administrators

### Team Roles and Responsibilities

Mezyad is developed by a cross-functional project team. Consistent with Stage 1, there are no permanent technical owners (such as a fixed backend, database, or frontend lead). All four members contribute across research, planning, requirements, design, implementation, testing, documentation, and review, with tasks distributed according to sprint priorities, workload, and blockers rather than fixed specialization.

Where a coordination function is useful for project management, it is treated as a temporary, rotating responsibility rather than permanent ownership.

| Role / Responsibility Area | Responsibility |
| :--- | :--- |
| Cross-Functional Team | Shared responsibility for research, planning, implementation, testing, documentation, and review across all four members |
| Sprint Coordination | Tracks current sprint priorities, blockers, and deadlines; this responsibility may rotate between members as needed |
| Technical Review | Team members review technical and design decisions collectively before they are adopted |
| Documentation | Team members collectively maintain requirements, decisions, testing notes, and project documentation |

---

## Task 2: Define Scope

The scope below is derived directly from the MVP boundaries established in Stage 1 and defines what the project will and will not deliver.

### In-Scope

* User registration and authentication
* Role-based access for bidders, sellers, and administrators
* Simulated identity verification
* Asset submission and listing review
* Administrative approval or rejection of listings
* Simulated bidder financial commitment / security deposit
* Real-time auction bidding and live auction state
* Bid history
* Auction timing rules, including anti-sniping behavior at a high level
* Auction closure and winner determination
* Basic settlement/invoice flow
* Controlled handover flow
* A responsive web interface
* Testing and validation of the MVP
* Project documentation required to support the MVP

### Out-of-Scope

* Real banking or payment integrations
* Real movement of money
* Production-grade identity verification integrations
* Production financial escrow
* Production-grade legal or financial guarantees
* Native iOS application
* Native Android application
* Dependency on physical hardware
* Advanced AI/ML valuation
* Blockchain or asset tokenization
* Chatbots
* Additional features that are not required for the defined MVP or cannot be accommodated within the project timeframe

---

## Task 3: Identify Risks & Mitigation Strategies

### Risk Register

| Risk | Category | Potential Impact | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| Concurrent bidding may produce inconsistent auction results if not handled correctly | Concurrency / Data Consistency | Incorrect bid state or unreliable auction results | High | Define bidding rules early, test concurrent bidding scenarios, and validate final auction state through structured integration testing |
| Real-time updates may not reach all participants consistently | Real-Time Synchronization | Bidders see outdated prices or miss auction closure | Medium | Test real-time update delivery under realistic conditions and define fallback behavior for delayed or dropped updates |
| The project may expand beyond the defined MVP boundaries | Scope Creep | Reduced ability to complete core features on schedule | Medium | Maintain the defined in-scope/out-of-scope boundaries and review scope at each sprint checkpoint |
| Development may fall behind the planned schedule | Timeline Pressure | Incomplete MVP features by the demo date | Medium | Track sprint progress regularly and reprioritize remaining tasks against the timeline |
| Auction, verification, and settlement components may not integrate smoothly | Integration Between Components | Broken or inconsistent workflow across the transaction lifecycle | Medium | Define clear interfaces between components early and test integration points throughout development, not only at the end |
| Coordination gaps may occur when responsibilities shift between team members across sprints | Team Coordination / Communication | Duplicated work or missed dependencies | Medium | Use regular sprint check-ins and shared documentation to track ownership of current tasks |
| The system may behave unreliably under live demo conditions | Testing / Demo Reliability | Failed or unconvincing live demonstration | Medium | Rehearse the demo scenario in advance and validate the core workflow under conditions similar to the presentation |
| Overall technical complexity of a multi-stage, real-time workflow | Technical Complexity | Delays across multiple project areas | Medium | Break the workflow into smaller, testable components and validate each stage before integrating the next |

---

## Task 4: Develop a High-Level Plan

### Project Timeline

| Stage | Focus | Timeline | Key Deliverables |
| :--- | :--- | :--- | :--- |
| Stage 1 — Idea Development | Team formation, brainstorming, research, evaluation, and MVP selection | Week 1 | Selected concept: Mezyad (Completed) |
| Stage 2 — Project Charter Development | Purpose, SMART objectives, stakeholders, roles, scope, risks, and project timeline | Weeks 2–3 | Project Charter (Current) |
| Stage 3 — Technical Documentation | Requirements, user stories, UI/UX planning, system architecture, database design, API planning, testing strategy | Weeks 4–5 | Technical documentation set |
| Stage 4 — MVP Development | Implementation, integration, and refinement of the defined MVP | Weeks 6–10 | Functional MVP covering the full transaction lifecycle |
| Stage 5 — Project Closure | Final testing, bug fixing, deployment preparation, documentation completion, final presentation, and reflection | Weeks 11–12 | Tested MVP, final documentation, and presentation |

### Major Milestones

* End of Week 3 — Project Charter completed and shared
* End of Week 5 — Technical documentation completed
* End of Week 9 — Core auction functionality complete (Objective 2)
* End of Week 10 — Full MVP workflow integrated (Objective 1)
* End of Week 12 — Testing and validation complete, MVP ready for final presentation (Objective 3)

---

## Task 5: Project Charter Completion

This Project Charter consolidates the project purpose, three SMART objectives, project stakeholders, team responsibilities, in-scope and out-of-scope boundaries, a risk register with mitigation strategies, and a high-level project plan. Together, these elements define what the Mezyad team is committing to deliver and how the project will be managed through to completion.

**Document Status:** Stage 2 Project Charter — Final Draft

### Transition to Stage 3

Stage 1 established the direction of the project by identifying the problem and selecting Mezyad as the concept to pursue. Stage 2 has now established the project charter: the purpose, objectives, stakeholders, scope, risks, and management boundaries that will guide the work ahead. Stage 3 will build on these approved product-level decisions by developing the detailed technical documentation — requirements, user stories, UI/UX planning, system architecture, database design, and testing strategy — needed to implement the MVP defined here.
