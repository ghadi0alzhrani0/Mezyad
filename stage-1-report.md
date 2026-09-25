# Mezyad — Stage 1 Report
## Team Formation and Idea Development

**Project name:** Mezyad (مِزياد)  
**Planned development period:** Three months

## Team Formation and Collaboration

| Team member | Contribution in Stage 1 |
|---|---|
| Ghadi Alzhrani | Participated in discussing and evaluating ideas, refining the selected concept, and preparing the report. |
| Abeer Alsayari | Participated in discussing and evaluating ideas and refining the selected concept. |
| Tala Alhudhaybi | Participated in discussing and evaluating ideas and refining the selected concept. |
| Aseel Alzhrani | Participated in discussing and evaluating ideas and refining the selected concept. |

We met in person at the academy over the past two weeks and held some meetings on Discord. We discussed the ideas and made decisions together through mutual agreement.

Ghadi is interested in **UI/UX design** and would like to work on this area in the upcoming stages of Mezyad.

## Ideas We Explored

We discussed two project ideas: **SentinX: Vanguard** and **Mezyad**. We considered what each idea would do, the main parts needed for an MVP, and whether we could build and test it within three months. The estimated development effort was a major factor in our decision.

### SentinX: Vanguard

SentinX: Vanguard was a simulation based field monitoring system. Its dashboard and live map would show personnel locations and simulated biometric data. The system would analyze the data, detect possible risks, and send alerts. It would also simulate routing a support drone to an incident while avoiding obstacles.

The intended users were operations leaders in military and security sectors. Defense companies were also considered potential stakeholders.

**Strengths:** The idea combined data visualization, risk alerts, and dynamic routing. It could be demonstrated without a physical drone.

**Weaknesses and risks:** We would need to build and connect data simulation, a map, risk detection, alerts, and routing. Testing these parts together would take time. We had not conducted experiments or user testing to validate the idea.

**Why we did not select it:** We estimated that developing and testing the simulation would take longer than our available project period.

### Mezyad

Mezyad is an online platform that brings together auctions for high value or rare items and assets. Users would be able to browse listings, view item details, place bids, and follow the transaction after bidding ends.

We plan to include these auction categories:

- Camels.
- Newly built properties that have not sold within the seller’s intended period, including properties completed about two years ago and still unsold.
- High end handbags and rare collectibles.
- Distinctive vehicle registration plates.
- Rare, limited production, or discontinued vehicle models.

**Strengths:** Mezyad has a clear process from listing an item and receiving bids to confirming a completed sale. We can build the core auction functions first and consider additional services later. We believed this approach could be completed within three months, and the academy approved the idea.

**Weaknesses and risks:** The categories need different listing details. Bids and auction deadlines must be handled accurately. Connecting to Nafath for seller identity verification may take additional time and require meeting its access requirements. We also need to define how ownership of listed items would be checked.

**Why we selected it:** We considered Mezyad’s core functions more achievable within the available time. The idea also received academy approval.

## Idea Evaluation

Our original comparison was based on discussion, mainly about feasibility. We did not record numerical scores during those meetings. The following rubric expresses that comparison as scores for this report. Each criterion is scored from **1 to 5**, where 5 is the strongest result. All four criteria have equal weight, for a maximum of **20 points**.

| Idea | Feasibility | Potential impact | Clarity of MVP scope | Scalability | Total |
|---|---:|---:|---:|---:|---:|
| SentinX: Vanguard | 2 | 3 | 3 | 4 | **12/20** |
| Mezyad | 4 | 3 | 4 | 4 | **15/20** |

SentinX received a lower feasibility score because its simulation components would take more time to connect and test. Mezyad received a higher score because we can begin with its core auction process, although managing bids across five categories remains a challenge.

We gave both ideas the same potential impact score because we have not tested either concept with users. Both ideas could also be expanded with more features later.

## Selected MVP Concept: Mezyad

### Purpose and Users

We want Mezyad to provide an organized place for auctions across selected categories of high value or rare items, including camels. Users should be able to find information about an item, follow bidding, and see whether a transaction is in progress or complete.

The intended users include sellers, interested buyers, collectors, and rare vehicle enthusiasts. Real estate offices and developers may also list properties that fit the platform’s categories.

Our concept is based on bringing these categories and transaction steps into one experience. We have not established that no similar platform exists.

### Proposed Core Features

- User registration and login.
- Auction listings with images, descriptions, and category specific details.
- A starting price and auction start and end times.
- Browsing auctions by category.
- Item pages showing the current highest bid.
- Placing bids while an auction is active.
- Closing bidding at the scheduled end time.
- Showing transaction status and recording sale confirmations.

### How a Sale Is Completed

When bidding ends and a transaction begins, the item remains visible as **Pending Transaction** and stops accepting bids. The seller confirms receiving payment, and the buyer confirms receiving the item. After both confirmations, the item is marked **Sold** and removed from the auction listings.

The buyer and seller may arrange an in person inspection and payment or use a cheque, depending on the item and their agreement. The first version does not need to process these payments electronically.

If the transaction is not completed, its status remains pending while the situation is resolved. We still need to define what happens if a transaction is cancelled and whether the item is listed again.

### Verification and Optional Features

We chose **Nafath** as a proposed way to verify a seller’s identity. We would like to add this integration if its requirements and the available time allow it. We also need to define how a seller would prove ownership of an item, since verifying identity alone does not establish ownership.

**Apple Pay** is another feature we may add if implementation is feasible. Neither integration is required for the core auction process in the first MVP.

### Expected Outcome and Challenges

The MVP should let users browse the planned categories, review item details, place bids, and follow an item through three main states: **Active Auction**, **Pending Transaction**, and **Sold**.

Our main challenges are supporting the different information needed by each category, handling bids and deadlines accurately, and defining a process for transactions that do not complete. Building the core auction process first will help us manage the three month development period.

## Decision

We selected **Mezyad** after comparing its scope and estimated development time with **SentinX: Vanguard**. We believed its core functions could be delivered within three months, and the academy approved the concept. We will use this decision as the starting point for the **Project Charter** in Stage 2.
