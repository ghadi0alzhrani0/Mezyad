# Stage 1 Report: Mezyad — High-Value Asset Auction Platform

## 1. Executive Summary

Buying and selling high-value assets online — real estate, rare cars, luxury goods, premium license plates, or purebred camels — involves a real trust and commitment problem. Buyers and sellers are usually strangers, identities are difficult to verify, and bids can be placed with no real commitment behind them. This can lead to non-committal or fake bidding that disrupts auctions, and it leaves both sides uncertain about whether a deal will actually be honored once the auction ends. Without transparent, real-time visibility into the auction state, participants also have limited confidence in what is actually happening at any given moment, and the process after an auction closes is often unclear.

**Mezyad** is a web-based auction platform designed to reduce these problems through a structured transaction lifecycle:

```
Verification → Listing & Review → Auction → Bid Commitment → Auction Closure / Settlement → Handover
```

Rather than functioning as a simple listing-and-messaging platform, Mezyad connects identity verification, listing review, simulated financial commitment mechanisms, real-time bidding, and a defined settlement and handover process into a single coherent workflow.

Mezyad is intended to serve three types of users: bidders who compete for assets, sellers who submit assets for auction, and administrators who review and moderate activity. The team selected this project after evaluating four candidate ideas against a shared set of criteria, because it addressed a meaningful, real-world problem while remaining realistic to build as a web-based MVP within the project timeframe, without depending on physical hardware.

Mezyad is being developed as a graduation MVP/prototype. Identity verification and financial commitment are simulated for this stage, and the project does not claim to provide production-grade banking, legal, or security guarantees. Real integrations of this kind are identified as future opportunities rather than current MVP requirements.

---

## 2. Team Formation

### 2.1 Team Overview

The team consists of four members: Abeer Al-Saiari, Ghadi Al-Zahrani, Aseel Al-Zahrani, and Tala Al-Hudaibi. At the initial team meeting, members introduced their backgrounds, interests, and relative strengths (frontend, backend, database design, and UI/UX) to understand how everyone could contribute — not to assign permanent ownership of any part of the system. This initial discussion also covered which possible directions each member found most interesting, which later informed the brainstorming process in Section 3.

### 2.2 Collaboration Model

The team works as a single cross-functional unit rather than splitting into fixed technical roles. All four members contribute to research, brainstorming, planning, implementation, testing, and documentation. Tasks are assigned per sprint based on what needs to get done, and these assignments shift over time depending on workload, blockers, and what each stage of the project requires. No member is permanently responsible for a single layer of the system (e.g., there is no fixed "database owner," "backend owner," "frontend owner," or "DevOps owner"); all four support and review each other's work throughout.

### 2.3 Communication and Coordination

* **Onsite work (9:00 AM – 2:00 PM, daily):** The team meets in person to work through harder problems together — pair programming, whiteboarding decisions, resolving blockers, and reviewing code before it is merged.
* **Discord:** Used for quick updates outside onsite hours, sharing code snippets, and flagging anything urgent before the next session.
* **Notion:** The team's shared workspace for Kanban boards, sprint tracking, requirements, and documentation, keeping project information in one place.

### 2.4 Team Norms and Decision-Making

Important decisions — such as which idea to pursue or how a core feature should work — are discussed as a team and agreed on collectively rather than decided by one person. Day-to-day, the team follows a few practical norms:

* Communicate regularly, especially when something is blocking progress.
* Document decisions in Notion so the reasoning is not lost.
* Review each other's work before merging.
* Raise blockers early instead of trying to solve everything alone.
* Keep shared project information organized and current.

Together, these practices are intended to keep the team cohesive and effective: everyone stays informed, decisions are shared rather than unilateral, and work can be redistributed as needed without depending on any single member.

---

## 3. Research and Brainstorming

### 3.1 Research Focus

Before settling on a direction, the team examined three existing Saudi platforms to understand the local digital transaction and auction landscape: **Saudi Auctions (السعودية للمزادات)**, **Infath Auctions (إنفاذ للمزادات)**, and **Haraj (حراج)**. These platforms were not selected because they are identical to Mezyad, but because together they cover the relevant range of local experiences — a digital auction environment, a formal institutional auction service, and a general marketplace/classifieds model — that helped the team understand common patterns in auction participation and marketplace behavior before defining Mezyad's own scope.

**Saudi Auctions** was examined as the closest reference to a Saudi digital auction environment. Its public platform presents multiple asset categories, including real estate and vehicles, and describes a participation flow involving registration, funding the bidding amount, and bidding toward a win. The team used it to understand how Saudi users encounter and enter auctions, how participation across multiple asset categories can be structured, and how financial participation concepts can appear within an auction journey.

**Infath Auctions**, the electronic auction service referenced by the Saudi government's Infath platform, was examined as a formal, institutional reference point. It illustrates how electronic auction participation can be presented within a structured, procedure-driven context, with clear steps and eligibility expectations. The team used it to understand local expectations around structured electronic auctions, not as a model to replicate — Mezyad is a graduation prototype and is not government-regulated or institutionally equivalent to Infath.

**Haraj** was examined as a familiar Saudi marketplace/classifieds reference rather than a direct auction competitor. It represents a broad, listing-based model for discovering and posting assets such as vehicles, real estate, electronics, and animals. The team used it to understand how users discover assets and how a general marketplace organizes categories and buyer/seller interaction, and to clarify, by contrast, that Mezyad is intended to move beyond a simple listing-and-contact model toward a structured auction lifecycle involving verification, bidding, commitment, auction closure, settlement, and handover.

| Saudi Example | Why We Examined It | What We Learned / Could Draw From It | Relationship to Mezyad |
| :--- | :--- | :--- | :--- |
| Saudi Auctions | Closest reference to a multi-asset digital auction environment | Auction discovery, participation flow, multiple asset categories, bidding/deposit concepts | Auction-oriented reference; Mezyad focuses more explicitly on an end-to-end trust and commitment lifecycle |
| Infath Auctions | Formal Saudi electronic-auction context | Structured participation, formal procedures, clear auction presentation | Institutional reference; Mezyad is a graduation prototype rather than a government auction service |
| Haraj | Familiar Saudi marketplace/classified model | Asset discovery, category organization, buyer/seller marketplace behavior | Broader marketplace reference rather than a direct auction competitor |

**Research sources:**

* Saudi Auctions — السعودية للمزادات — [https://www.auctions.com.sa/](https://www.auctions.com.sa/)
* Infath Auctions — إنفاذ للمزادات — [https://infath.gov.sa/ar/electronic-services/infath-auctions/](https://infath.gov.sa/ar/electronic-services/infath-auctions/)

Haraj is discussed above as a marketplace example rather than a formal research source.

This comparison is not intended to rank the three platforms or to claim that Mezyad is superior to any of them. The goal was to separate general patterns already established in the local market from the specific combination of features Mezyad proposes: identity verification, listing review, simulated bidder commitment, real-time bidding, transparent auction state, auction closure, settlement, and controlled handover, brought together into a single trust-oriented transaction lifecycle.

### 3.2 Problem Space

Building on this comparison, the team identified recurring concerns around identity, bidding behavior, commitment, real-time auction state, and post-auction clarity. This shows up in a few concrete ways:

* **Identity uncertainty** — buyers and sellers cannot easily verify who they are dealing with.
* **Non-committal or fake bidding** — a bid can be placed with no real consequence if the bidder backs out, which can disrupt the auction and waste sellers' time.
* **Weak commitment mechanisms** — there is often no step that meaningfully separates a serious bidder from someone testing the waters.
* **Unclear real-time auction state** — some marketplace experiences are primarily listing-oriented rather than centered on a synchronized real-time auction state, so participants may lack a reliable, live view of the current price.
* **Uncertainty after the auction ends** — even when a winning bid is placed, there is often no clear structure for what happens next (settlement, handover, disputes).

Mezyad is intended to respond to this problem space through a structured digital auction process.

### 3.3 Mind Mapping

The team organized the main problem areas into the following mind-map structure:

```
High-Value Transactions
 ├── Trust
 │    └── Identity Verification
 ├── Asset Verification
 │    └── Listing Review / Admin Approval
 ├── Bidding
 │    └── Real-Time Price Updates
 ├── Financial Commitment
 │    └── Security Deposit / Escrow Concept
 ├── Auction Management
 │    └── Timing Rules / Anti-Sniping
 └── Settlement
      └── Handover / Post-Auction Process
```

This structure made it clear that "trust" is not a single feature — it runs through identity, bidding behavior, financial commitment, and what happens after the auction closes. This understanding shaped the brainstorming that followed.

### 3.4 SCAMPER

The team used SCAMPER to explore how the auction experience could be restructured to address the problem space above:

* **Substitute:** Substitute static, open-ended classified listings with time-boxed auction rooms that have a clear start and end.
* **Combine:** Combine identity verification with a simulated bidder financial commitment step, so that placing a bid requires more than clicking a button.
* **Adapt:** Adapt anti-sniping concepts used by established online auction platforms — if a bid arrives very close to closing time, the timer extends slightly so the outcome is not decided purely by reaction speed.
* **Modify:** Modify minimum bid increments and auction rules depending on the category of asset.
* **Eliminate:** Eliminate unreviewed listings from the public auction flow by requiring administrative approval before any asset becomes visible to bidders.

### 3.5 How Might We Questions

* How might we make high-value online auctions more trustworthy for both buyers and sellers?
* How might we create meaningful bidder commitment without relying on real financial infrastructure in the MVP?
* How might we keep auction prices synchronized for everyone participating in real time?
* How might we handle multiple bids that arrive at nearly the same time fairly?
* How might we make payment, handover, and post-auction processes clearer for both sides?

---

## 4. Ideas Explored

Four project concepts were seriously discussed before the team selected a direction. Each is documented using the same structure to show that the alternatives were genuinely considered, not dismissed casually.

### 4.1 Aegis-Grid — Dynamic Routing & Distributed Resource Management

**What it is:** A logistics platform for routing supply fleets (e.g., delivery or emergency vehicles), built around a pathfinding engine that recalculates routes when obstacles appear.

**Problem:** Static routing systems adapt poorly when a fleet encounters an unexpected obstacle in the field, causing delays.

**Proposed solution:** An engine that detects obstacles and automatically recalculates the optimal route for affected vehicles.

**Strengths:** Genuine algorithmic depth in pathfinding and route optimization; clear potential for a technically interesting engine.

**Weaknesses:** Realistic testing depends on either real vehicle/location data or a substantial simulation layer, which is difficult to make convincing.

**Feasibility:** Buildable at a prototype level, but a credible MVP would require realistic routing and location simulation, which adds significant complexity within the available timeframe.

**Resources/infrastructure required:** Mapping and location data, and a non-trivial simulation of a moving fleet and its environment.

**Main risks:** Simulation realism, mapping/location dependency, and overall scope relative to the timeframe.

**Why rejected:** The idea was technically interesting, but the required simulation and mapping infrastructure would consume significant time and could make the final demo more dependent on synthetic data than on a genuinely interactive product.

### 4.2 Titan-Protocol — Sensitive Facilities Management & Security Control

**What it is:** A security platform modeled on facility control systems, combining an interactive floorplan with an event-driven rule engine that can trigger automated responses (e.g., locking gates, isolating zones).

**Problem:** Traditional security systems mostly raise alarms and wait for a human response, which can be too slow in a genuinely sensitive facility.

**Proposed solution:** A rule engine that automatically executes a sequence of defensive actions when specific conditions are triggered.

**Strengths:** Interesting event-driven architecture; strong potential for a visually compelling demo.

**Weaknesses:** The realism of the demo would be more dependent on realistic sensor/event simulation or hardware infrastructure than the team could confidently provide.

**Feasibility:** The web/software layer is buildable, but the credibility of the product depends heavily on simulating sensor events realistically.

**Resources/infrastructure required:** Sensor/IoT-style event data, a simulated or real testing environment, and event-generation tooling.

**Main risks:** Sensor/event simulation realism, infrastructure dependency, and testing complexity.

**Why rejected:** The team considered it technically interesting, but the sensor/event simulation and infrastructure dependency introduced unnecessary risk for the available project period.

### 4.3 SentinX — Tactical Operations Intelligence & Management System

**What it is:** A command-and-control style platform for tracking field personnel in real time, processing streaming location and status data on an interactive map.

**Problem:** Central command teams often lack real-time visibility into personnel status, which delays response to emerging risks.

**Proposed solution:** A system that ingests streaming data and displays live personnel status and location on a map, backed by a load/stress simulator.

**Strengths:** Real-time data processing challenge; interesting live-map and live-state UI problem.

**Weaknesses:** Realistic GPS, vitals, and field-event data would need to be simulated at scale, and the domain is relatively specialized.

**Feasibility:** Technically feasible at a prototype level, but it carries a higher simulation and scope burden than the other alternatives.

**Resources/infrastructure required:** Simulated telemetry data, mapping integration, and a custom load/event simulator.

**Main risks:** Telemetry simulation realism, overall scope, and the specialized nature of the domain.

**Why rejected:** It was technically feasible, but the simulation and scope burden made it a less favorable choice than Mezyad within the same timeframe.

### 4.4 Mezyad — High-Value Asset Auction Platform (Selected)

**What it is:** A web-based auction platform for high-value assets (real estate, rare vehicles, luxury goods, premium plates, and similar categories), structured around identity verification, bidder commitment, and real-time bidding.

**Problem:** High-value transactions between strangers can suffer from identity uncertainty, weak bidder commitment, unclear real-time auction state, and uncertainty around settlement and handover.

**Proposed solution:** A structured digital auction lifecycle connecting identity verification, listing review, bidder commitment, real-time bidding, auction closure, settlement, and handover.

**Strengths:** Addresses a meaningful, real-world problem; can be demonstrated using realistic user scenarios and simulated asset data rather than large synthetic datasets; strong alignment with core full-stack skills (relational database design, REST APIs, real-time communication); suitable for a four-person CS team; clear potential for future expansion.

**Weaknesses:** Concurrent bidding is a genuine technical challenge; transaction integrity matters throughout the lifecycle; the auction lifecycle has several dependent states; financial workflows require careful simulation and clearly stated boundaries.

**Feasibility:** Very high relative to the alternatives for a web-based MVP — the required components (real-time communication, a relational database, a REST API) are all realistic for the team to design, build, and test within the project timeframe. This does not mean the project is easy: it still requires solving real problems around concurrency, state synchronization, and lifecycle management.

**Resources/infrastructure required:** A relational database and a backend capable of real-time communication. No dependency on physical hardware or external devices.

**Main risks:** Concurrent bids, transaction consistency, real-time synchronization, the settlement lifecycle, and the risk of scope creep if secondary features are treated as equally mandatory to the core MVP.

**Why selected:** Mezyad is achievable within the team's resources and timeframe, but it is not trivial. It offers a meaningful problem, realistic technical depth, and no dependency on physical hardware, making it the strongest fit against the team's evaluation criteria.

---

## 5. Idea Evaluation

### 5.1 Evaluation Criteria

| Criterion | Meaning |
| :--- | :--- |
| Technical Feasibility | Can a working MVP realistically be built within the project timeframe? |
| Problem Relevance | Does the idea address a meaningful, identifiable real-world problem? |
| Team Alignment | Does it fit the team's current skills and available learning capacity? |
| Scalability | Can the concept reasonably grow beyond the initial MVP? |
| Demo & User Value | Can its value be clearly and convincingly demonstrated to real users/evaluators? |
| Resource Feasibility | Can the idea be developed and demonstrated using the team's available software resources, with minimal dependency on external hardware or infrastructure? |

### 5.2 Scoring Rubric

Each criterion is scored from 1 to 5:

| Score | Meaning |
| :--- | :--- |
| 1 | Very weak fit / major limitation |
| 2 | Weak fit / significant limitation |
| 3 | Moderate fit / manageable limitation |
| 4 | Strong fit / minor limitation |
| 5 | Very strong fit / minimal limitation |

For **Resource Feasibility** specifically, a higher score means *less* dependency on external hardware or infrastructure:

| Score | Meaning |
| :--- | :--- |
| 1 | Heavily dependent on external hardware, infrastructure, or resources that are difficult to obtain |
| 2 | Significant external/simulation dependency |
| 3 | Manageable resource or simulation requirements |
| 4 | Mostly achievable with available development resources |
| 5 | Can be developed and demonstrated using available software resources with minimal external dependency |

### 5.3 Evaluation Matrix

| Idea | Technical Feasibility | Problem Relevance | Team Alignment | Scalability | Demo & User Value | Resource Feasibility | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Aegis-Grid | 2 | 3 | 2 | 3 | 2 | 2 | 14 |
| Titan-Protocol | 2 | 3 | 2 | 3 | 3 | 1 | 14 |
| SentinX | 3 | 3 | 3 | 3 | 3 | 2 | 17 |
| **Mezyad** | **5** | **5** | **4** | **4** | **5** | **5** | **28** |

### 5.4 Evaluation Rationale

**Aegis-Grid:** Technical feasibility is lower because routing and location simulation adds significant complexity. Problem relevance is moderate — the logistics problem is real but less directly demonstrable with the team's available data. Team alignment is lower due to the mapping/simulation burden relative to the team's current experience. Scalability is moderate. Demo/user value is lower within the project timeframe because a convincing demo depends heavily on synthetic data. Resource feasibility is lower due to mapping, location, and simulation dependencies.

**Titan-Protocol:** Technical feasibility is lower because realistic sensor/event simulation is required to make the system credible. Problem relevance is moderate. Team alignment is lower due to the IoT/security-event simulation burden. Scalability is moderate. Demo value is reasonable, since the concept is visually compelling. Resource feasibility is lowest among the four ideas due to its infrastructure dependency.

**SentinX:** Technical feasibility is moderate — the real-time data-handling concept is buildable, but realistic telemetry must be simulated. Problem relevance is moderate. Team alignment is moderate-to-strong, since the real-time and UI work fits the team's interests. Scalability is reasonable. Demo value is reasonable given the interactive map concept. Resource feasibility is lower because of the telemetry simulation required.

**Mezyad:** Technical feasibility is very high for a web-based MVP, since the required components (real-time communication, relational database, REST API) are realistic for the team to build and test with actual data rather than synthetic simulation. Problem relevance is strong, given the clear real-world trust and commitment problem in high-value digital transactions. Team alignment is strong but not perfect, since concurrency and transaction handling still meaningfully stretch the team's current skills. Scalability is good, with a clear path to additional asset categories and features. Demo/user value is strong because the workflow can be demonstrated with realistic scenarios. Resource feasibility is very high because the project does not depend on physical hardware.

The evaluation identified Mezyad as the strongest fit for the team's stated criteria.

### 5.5 Risks and Constraints

| Idea | Main Risks / Constraints |
| :--- | :--- |
| Aegis-Grid | Simulation realism, mapping/location dependency, and overall scope. |
| Titan-Protocol | Sensor/event simulation, infrastructure dependency, and testing complexity. |
| SentinX | Telemetry simulation, scope, and a relatively specialized domain. |
| Mezyad | Concurrent bids, transaction consistency, real-time synchronization, the settlement lifecycle, and the risk of scope creep. |

### 5.6 External Feedback

During the evaluation process, the team sought feedback from **Abdullah Aljahdali**. His feedback highlighted the practical constraints associated with ideas that depend heavily on physical infrastructure — particularly the difficulty of providing and testing drones, sensors, and related hardware within the team's available resources and timeframe. This feedback reinforced concerns the team had already identified for Aegis-Grid and Titan-Protocol during its own evaluation, and it was considered together with the team's evaluation criteria before the final decision was made.

---

## 6. Decision and Refinement

### 6.1 Final Decision and Reasons for Selection

Following research, brainstorming, evaluation against defined criteria, identification of risks and constraints, and external feedback, the team selected **Mezyad** as the Stage 1 project direction. The decision reflects several combined factors:

* **Feasibility:** the required components (real-time communication, relational database, REST API) are realistic for the team to build and test within the project timeframe, without depending on physical hardware.
* **Innovation / value:** the project's value comes from exploring these elements as a single, unified workflow focused on trust and commitment across the high-value transaction lifecycle.
* **Alignment with the team:** the project draws on relational database design, REST APIs, and real-time communication, which fit the team's existing full-stack skill set while still stretching it through concurrency and transaction-integrity challenges.
* **Potential challenges:** concurrent bidding, transaction consistency, real-time synchronization, and lifecycle/settlement management (detailed in Sections 4.4 and 5.5).
* **Potential opportunities:** a clear path toward additional asset categories, richer auction mechanisms, and real identity/payment integrations in the future (detailed in Section 6.7).

Feasible does not mean simple — Mezyad still requires solving genuine problems in concurrency, transaction integrity, and lifecycle management.

### 6.2 Problem Statement

High-value online transactions between strangers — such as buying rare vehicles, luxury goods, or unsold real estate — can be limited by weak trust and commitment mechanisms. Bidders may place bids with no real stake behind them, identities can be difficult to verify, and there is often no transparent, real-time view of the current auction state. Even when an auction concludes, what happens next (settlement, handover, disputes) is frequently unclear. Mezyad is intended to address these concerns through a structured digital auction process connecting verification, listing review, bidding, commitment, auction closure, settlement, and handover. Mezyad does not claim to eliminate fraud or guarantee successful transactions; it is designed to reduce the specific weaknesses identified above.

### 6.3 Target Users

* **Buyers / Bidders** — participate in auctions and place committed bids.
* **Sellers** — submit high-value assets for review and auction.
* **Administrators** — review listings, monitor auctions, and handle moderation and disputes where applicable.

### 6.4 Selected MVP Concept

Mezyad's core identity is not "a website that lists items and accepts bids" — it is a platform built around the transaction lifecycle and trust mechanisms surrounding high-value auctions:

```
Verification → Listing & Review → Auction → Bid Commitment → Auction Closure / Settlement → Handover
```

### 6.5 Core Capabilities

**Core MVP capabilities** (directly reflecting the lifecycle above):

* Registration and role-based access for buyers, sellers, and administrators.
* Simulated identity verification.
* Asset listing and administrative review/approval before an item becomes visible.
* Simulated bidder financial commitment (a security deposit concept) required before bidding.
* Real-time auction bidding with live price updates for all participants.
* Bid history and transparent auction state, so the current status of an auction is always clear.
* Auction timing rules, including anti-sniping behavior near auction close.
* Auction closure and winner determination.
* Basic settlement/invoice flow following auction closure.
* A controlled handover flow marking the transaction as completed.

**Extended / secondary capabilities** (lower priority, included only where time allows, and not required to demonstrate the core MVP concept):

* Basic dispute handling.
* Seller withdrawal of a listing before auction start.
* Proxy (automatic) bidding.
* Notifications for outbid users or auction status changes.
* Additional auction mechanisms beyond the base rules.

### 6.6 Expected Outcomes

By the end of development, Mezyad is expected to demonstrate:

* a structured, end-to-end high-value auction workflow;
* real-time bid visibility across all connected participants;
* stronger bidder commitment through simulated financial mechanisms;
* a clearer, more transparent auction state at any given moment;
* a controlled auction lifecycle from listing through closure;
* a basic settlement and handover flow;
* a realistic demonstration that does not depend on physical hardware;
* a reasonable foundation for future expansion.

### 6.7 Opportunities

Beyond the MVP, the team identified several future opportunities:

* Expansion to additional high-value asset categories.
* Richer auction mechanisms (e.g., reserve prices, sealed bids).
* Integration with real identity verification services.
* Integration with real payment/financial services in a future production system.
* Stronger dispute-resolution workflows.
* AI-assisted asset valuation as a future enhancement.
* Additional verification capabilities.

These are explicitly future opportunities and are not part of the current MVP scope.

### 6.8 Constraints

Mezyad is being developed as a graduation MVP/prototype, not a production financial platform. Within the current scope:

* Identity verification is simulated, not connected to a real verification provider.
* Financial commitment is simulated through mock security deposits, with no real money movement.
* There is no production banking integration.
* The project makes no production-grade legal or financial guarantees.
* The system is designed to demonstrate the workflow and engineering challenges of a trust-oriented auction platform, not to process real transactions.

---

## 7. Lessons Learned

* **Feasibility has to be evaluated honestly before committing to an idea.** Aegis-Grid, Titan-Protocol, and SentinX were all technically interesting, but a closer look at what it would actually take to build and test them exposed risks that were not obvious at first glance.
* **Structured brainstorming (mind mapping, SCAMPER, HMW) helped turn a broad problem into specific, testable ideas**, rather than jumping straight from "trust is a problem" to a single solution.
* **Resource constraints are a real design input, not an afterthought.** Ideas that depended on hardware or large-scale simulation were consistently harder to justify within the available timeframe, regardless of how interesting they were.
* **External feedback is useful even when it confirms existing concerns.** Abdullah Aljahdali's feedback did not change the direction, but it validated concerns the team had already raised about hardware-dependent ideas.
* **Defining MVP boundaries early prevents scope creep later.** Separating core MVP capabilities from extended/secondary ones gives the team a clear baseline to protect once development starts.

---

## 8. Transition to Stage 2

At the end of Stage 1, the team has formed and aligned as a cross-functional unit, researched the underlying problem, explored and evaluated four project concepts, and selected Mezyad as the project direction. The target users, MVP concept, core capabilities, expected outcomes, opportunities, and constraints have all been defined at a product level.

Stage 2 will take this decision and formalize it into concrete project planning: objectives, scope, stakeholder considerations, risks, and a project timeline.
