# Portfolio Project — Project Planning and Project Charter (Stage 2)

## Stage 2 Overview

Stage 2 focuses on transforming the project idea developed in Stage 1 into a clear and structured Project Charter.

The purpose of this stage is to establish a shared understanding of the project before technical implementation begins. The charter defines what the project aims to achieve, who is involved, what is included and excluded from the MVP, what risks may affect delivery, and how the 12-week project will be organized at a high level.

The main deliverable of this stage is:

**Report.md**

Report.md is the formal Project Charter and serves as the main reference for the project's objectives, stakeholders, scope, risks, and development plan.

---

## What We Cover in Stage 2

Stage 2 is organized into five main tasks.

### Task 0 — Define Project Objectives

This task establishes what the project is trying to achieve and why.

The report discusses:

* The purpose of Mezyad.
* The main problem the project addresses.
* The core elements of the proposed solution.
* The SMART objectives that define measurable project outcomes.
* The expected completion points for the main MVP capabilities.

The objectives focus on delivering a realistic auction MVP covering the defined auction workflow, reliable real-time bidding, auction closure, and the Smart Auction Assistant within the 12-week project timeline.

---

### Task 1 — Identify Stakeholders and Team Roles

This task defines who is involved in the project and how responsibilities are organized.

The report discusses:

* The main product users:
    * Bidders / Buyers
    * Sellers
    * Administrators
* The needs and benefits of each user role.
* The position of each role within the auction workflow.
* The project stakeholders, including the project team and project evaluators/supervisors.
* The team's primary responsibility areas.
* How the team collaborates across tasks and dependencies.

Team responsibilities are organized into primary areas while keeping the team flexible enough to support work outside those areas when required.

---

### Task 2 — Define Project Scope

This task establishes what the MVP will and will not contain.

The report discusses:

#### In Scope

The defined MVP includes:

* Authentication and access control.
* Seller listings and structured asset information.
* Administrator listing review and approval.
* Public and private auctions.
* Bid Commitment.
* Saudi Open Banking sandbox integration.
* Real-time bidding.
* Anti-sniping.
* Auction closure and winner determination.
* Smart Auction Assistant.
* Quality and validation activities.

The bank integration is planned through an official Saudi Open Banking sandbox/testing environment and is intended to support the Bid Commitment flow. It does not involve real money, live customer banking data, or production financial services.

#### Out of Scope

The report also identifies features intentionally excluded from the MVP, including:

* Real money transfers.
* Real financial settlement.
* Escrow and financial custody.
* Production banking data.
* Invoices.
* Handover management.
* Delivery or logistics.
* Blockchain and tokenization.
* IoT and drone-based features.
* Predictive pricing or AI valuation.
* AI bidding decisions.
* Chatbot functionality.
* Native mobile applications.
* Complex invitation-management systems.
* Any feature outside the defined auction workflow.

This section establishes the project's boundaries and helps prevent scope creep during development.

---

### Task 3 — Identify Risks and Mitigation Strategies

This task identifies what could prevent the project from being completed successfully and how the team plans to reduce those risks.

The report discusses risks related to:

* Concurrent bids and inconsistent auction state.
* Delayed or missed real-time updates.
* Delays or limitations related to bank sandbox access.
* Unauthorized access to private auctions.
* Incorrect anti-sniping timing.
* Frontend, backend, and database integration problems.
* Scope creep.
* Demonstration or deployment failure.

For each risk, the report defines a mitigation approach, and it describes how risks are monitored through the project milestones.

---

### Task 4 — Develop a High-Level Plan

This task explains when the major stages of the project will happen.

The report presents the 12-week development lifecycle:

| Stage | Timeline | Main Focus |
| :--- | :--- | :--- |
| Stage 1 | Week 1 | Idea Development |
| Stage 2 | Weeks 2–3 | Project Charter Development |
| Stage 3 | Weeks 4–5 | Technical Documentation |
| Stage 4 | Weeks 6–10 | MVP Development |
| Stage 5 | Weeks 11–12 | Project Closure |

The report also identifies major milestones, including completion of the Project Charter, completion of technical documentation, core auction functionality, full MVP integration, final testing, documentation, and presentation preparation.

The plan also highlights important dependencies, particularly the need to investigate the bank sandbox integration early enough to avoid delaying the final MVP integration.

---

## Stage 2 Deliverables

The `/Stage_2` directory contains the following project documentation:

### README.md

This document provides an overview of Stage 2, explains the purpose of each task, and describes what is covered in the formal Project Charter.

It acts as a guide to the stage rather than replacing the Project Charter.

### Report.md

The formal Stage 2 Project Charter.

It contains the detailed project documentation for:

1. Project Objectives
2. Stakeholders and Team Roles
3. Project Scope
4. Risks and Mitigation Strategies
5. High-Level Project Plan

---

## Relationship Between the README and Report

The two files have different purposes:

* README.md explains the structure and purpose of Stage 2 and gives an overview of what each task covers.
* Report.md contains the complete and formal answers for those tasks.

The README provides context and navigation, while the Report provides the detailed Project Charter.

---

## Project Team

* Abeer Al-Saiari
* Ghadi Al-Zahrani
* Aseel Al-Zahrani
* Tala Al-Hudaibi
