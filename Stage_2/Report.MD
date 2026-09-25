# Stage 2 Report: Project Charter Development

## Executive Summary

This document serves as the formal and comprehensive Project Charter for the High-Value Assets & Investment Opportunities Auction Platform. It establishes the foundational architectural blueprint and project management framework, ensuring an aligned, shared understanding among all cross-functional team members and external evaluating stakeholders.

Building upon the ideation, market gap analysis, and architectural decisions finalized in Stage 1, this charter clearly defines the project's core purpose, SMART engineering objectives, team roles, strict scope boundaries, and proactive risk mitigation strategies. It acts as the ultimate reference point and governance document for technical decision-making, resource allocation, and sprint planning throughout the intensive 12-week development lifecycle.

---

## Task 0: Define Project Objectives

### Project Purpose & Vision
The core purpose of this project is to architect and engineer a highly secure, interactive real-time web auction platform exclusively tailored for high-value assets—such as distressed real estate properties, rare limited-edition vehicles, luxury collectibles, and purebred camels.

The regional digital marketplace is currently plagued by a "trust deficit," anonymous fake bids, and massive latency issues during critical auction moments. This project aims to completely eliminate these bottlenecks by enforcing strict identity verification workflows, administrative pre-approvals for all listings, and programmatic financial Escrow deposits. By bridging the gap between traditional high-end auction houses and modern web technologies, the platform will create a reliable, transparent, and highly competitive environment for serious buyers and verified sellers.

### SMART Objectives
To ensure the Minimum Viable Product (MVP) is delivered successfully and meets the highest academic and commercial standards, the team commits to the following Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) objectives:

1. **Real-Time Synchronization & Concurrency (Performance):** Develop and integrate a WebSocket-based real-time bidding engine (utilizing Node.js and Socket.io) that broadcasts price updates, new bid histories, and Anti-Sniper timer extensions to all concurrently connected clients in under 100 milliseconds without requiring manual page reloads. This core engine must be fully operational, stress-tested, and integrated by the end of Week 9.
2. **Workflow Integrity & Data Validation (Quality):** Implement a strict administrative pre-approval pipeline ensuring that 100% of user-uploaded assets are manually vetted, authenticated, and activated by a designated Admin before appearing on the public auction feed. This ensures zero spam or fraudulent listings and must be completed by Week 7.
3. **Frontend Optimization & DOM Mastery (Efficiency):** Build a blazing-fast, Single Page Application (SPA)-like user experience relying exclusively on HTML5, CSS3, and Vanilla JavaScript. By explicitly avoiding heavy frameworks (like React or Vue), the team aims to minimize the overall JavaScript bundle size, demonstrate deep mastery of manual DOM manipulation, and achieve a strict Largest Contentful Paint (LCP) metric of <= 2.0 seconds by Week 10.

---

## Task 1: Identify Stakeholders and Team Roles

### Project Stakeholders
Understanding stakeholder expectations is critical for project success. The stakeholders are categorized as follows:

* **Internal Stakeholders:** 
  * The Core Development Team (Abeer, Ghadi, Aseel, Tala): Responsible for the end-to-end architecture, coding, testing, and deployment of the platform.
* **External Stakeholders:** 
  * Evaluating Software Engineers (SWEs): The academy instructors evaluating the portfolio project based on code quality, architectural decisions, and Git best practices.
  * Simulated End-Users: High-Net-Worth Individuals (HNWIs), Real Estate Developers liquidating distressed assets, and Luxury Asset Collectors who demand a flawless, secure, and visually premium user experience.

### Team Roles & Responsibilities
The project operates under a highly collaborative Cross-Functional Agile Team model. All four members serve as Full-Stack Developers, participating actively in database normalization, frontend rendering, and backend logic during the daily 9:00 AM to 2:00 PM on-site core hours.

To ensure strict accountability, prevent overlapping work, and streamline technical decision-making, primary coordination domains have been distributed as follows:

| Team Member | Primary Coordination Role | Core Responsibilities & Focus Areas |
| :--- | :--- | :--- |
| **Abeer Al-Saiari** | Project Manager (PM) & DevOps | Oversees overall agile planning, tracks sprint progress via the Notion Command Center, manages GitHub CI/CD pipelines, enforces code review standards, and ensures strict adherence to the 12-week timeline. |
| **Ghadi Al-Zahrani** | Database & Architecture Lead | Focuses on designing the PostgreSQL schema (ERD), ensuring ACID transactional integrity for financial data, normalizing tables, and mapping complex Escrow wallet and bid history relationships. |
| **Aseel Al-Zahrani** | Backend & Real-Time Engine Lead | Coordinates the Node.js/Express server architecture, designs robust REST API endpoints, and implements the highly concurrent WebSocket (Socket.io) bidding logic and the Anti-Sniper time-extension engine. |
| **Tala Al-Hudaibi** | Frontend UI/UX & Client Logic Lead | Manages HTML5/CSS3 layout architecture, enforces premium "Dark Mode" visual design standards, and handles complex Vanilla JavaScript asynchronous fetches and real-time DOM manipulation. |

---

## Task 2: Define Scope

To guarantee the delivery of a fully functional, highly polished, and bug-free MVP within the strict academic timeframe, absolute scope boundaries have been established. This prevents "scope creep" and protects the team's capacity for thorough Quality Assurance (QA).

### In-Scope (Core Deliverables & Modules)
* **Identity & Access Module:** User registration and secure authentication system with strict Role-Based Access Control (RBAC) distinguishing between Bidders, Sellers, and Platform Admins.
* **Financial Simulation Module (Escrow):** A secure logical pipeline that programmatically locks a virtual security deposit in a simulated wallet before granting a user access to the live bidding room.
* **The Bidding Engine Module:** An interactive, WebSocket-powered interface featuring live price broadcasts, a dynamic countdown timer, and an immutable table logging the exact timestamp of every bid.
* **Anti-Sniper Logic:** Automated backend algorithms that instantly extend the auction timer (e.g., +3 minutes) if a bid is placed in the final 60 seconds, preventing last-second sniping and ensuring fairness.
* **Administrative Moderation Module:** A secure dashboard allowing Admins to review pending seller submissions, approve legitimate assets, or reject non-compliant listings.
* **Native Web Frontend:** A responsive, premium user interface built purely with HTML5, CSS3, and Vanilla JavaScript to showcase fundamental web engineering mastery.

### Out-of-Scope (Explicitly Excluded)
* **Heavy Frontend Frameworks:** React, Next.js, or Vue are strictly excluded to focus on core DOM manipulation skills and avoid unnecessary dependency overhead.
* **Live Financial Integrations:** Real banking APIs (e.g., Visa/Mastercard processing) or live payment gateways. Only simulated/test mode logical gateways will be used to demonstrate the Escrow concept without regulatory compliance delays.
* **Advanced Emerging Technologies:** Artificial Intelligence (AI) estimators, Machine Learning (ML) matchmaking, Chatbots, or Blockchain/Smart Contract asset tokenization.
* **Mobile Application Development:** Native iOS (Swift) or Android (Kotlin) development is excluded. The focus remains 100% on a responsive web browser experience.

---

## Task 3: Identify Risks & Mitigation Strategies

Proactive risk management is critical, particularly given the technical complexity of building real-time distributed systems. The team has identified the following primary risks and established concrete mitigation plans:

| Identified Risk | Impact Area | Mitigation Strategy & Technical Action Plan |
| :--- | :--- | :--- |
| **1. Vanilla JS DOM Complexity** | Technology / Frontend | Managing real-time WebSocket updates with pure JavaScript can quickly lead to disorganized "spaghetti code."<br><br>**Mitigation:** Enforce strict modular JavaScript patterns (e.g., MVC pattern implementation in Vanilla JS), clearly separating UI rendering functions from data-fetching and WebSocket listener logic. |
| **2. Concurrency & Race Conditions** | Technology / Backend | Multiple users clicking "Bid" in the exact same millisecond could overwrite database values or corrupt the current item price.<br><br>**Mitigation:** Implement strict sequential processing logic, utilizing backend validation and PostgreSQL database-level locks (Row-level locking) to ensure bids are handled chronologically. |
| **3. Scope Creep on Asset Categories** | Timeline & Database | Designing 5 different relational schemas for diverse assets (cars, real estate, bags, camels) consumes excessive planning time.<br><br>**Mitigation:** Use a unified Items table equipped with a flexible JSONB metadata column to dynamically store and handle varying category-specific attributes efficiently. |
| **4. Integration & Communication Gaps** | Team Dynamics | Disconnects between frontend HTML structures and backend API payloads during independent off-hours work.<br><br>**Mitigation:** Mandate daily on-site Pair Programming (9 AM - 2 PM), utilize Discord for rapid off-hours syncs, and define strict API JSON payload contracts using Postman/Notion before any backend coding begins. |
| **5. Server Overload on Demo Day** | Infrastructure | The Node.js server crashing due to too many active WebSocket connections during the live presentation.<br><br>**Mitigation:** Isolate Socket.io events using specific "Rooms" based on the auction_id, ensuring the server only broadcasts price updates to users actively viewing that specific item, drastically reducing network overhead. |

---

## Task 4: Develop a High-Level Plan

The following high-level project timeline maps out the major phases leading up to the final Demo Day. It ensures steady, measurable progression through all architectural, developmental, and testing stages across the 12-week lifecycle.

| Project Phase | Focus Area | Timeline | Key Milestones & Deliverable Outcomes |
| :--- | :--- | :--- | :--- |
| **Stage 1** | Idea Development | Week 1 | Team formation, extensive brainstorming, SCAMPER idea evaluation, and final MVP project selection. (Completed) |
| **Stage 2** | Project Charter | Weeks 2-3 | Definition of strict scope, SMART objectives, stakeholder roles, risk analysis, and high-level timeline mapping. (Current) |
| **Stage 3** | Technical Documentation | Weeks 4-5 | Finalization of Database ERD, System Architecture Diagrams, User Journeys, and REST API Specifications. |
| **Stage 4 (Part A)** | Core UI & Database Setup | Weeks 6-7 | Implementation of HTML/CSS layouts, building PostgreSQL schemas, and completing the user authentication flows. |
| **Stage 4 (Part B)** | Logic & Real-Time Engine | Weeks 8-9 | Development of backend REST APIs, WebSocket (Socket.io) integration, Escrow simulation, and Anti-Sniper logic. |
| **Stage 4 (Part C)** | System Integration | Week 10 | Connecting the Vanilla JS frontend to the Node.js backend, ensuring seamless data flow across all user roles. |
| **Stage 5** | Project Closure & QA | Weeks 11-12 | End-to-end manual integration testing, bug fixing, deployment containerization, final presentation preparation, and Demo Day execution. |

---
**Document Status:** Approved & Finalized  
**Project Team:** Abeer Al-Saiari, Ghadi Al-Zahrani, Aseel Al-Zahrani, Tala Al-Hudaibi
