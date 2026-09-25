# Mezyad — Project Charter

**Status:** Draft — Tasks 0, 1, and 2 completed; Risks and High-Level Plan will be added by the team.

## 1. Project Objectives

### Project Purpose

Mezyad aims to organize auctions for high value and rare items across five categories: camels, newly built unsold properties, high end handbags and rare collectibles, distinctive vehicle registration plates, and rare cars. The platform will allow users to browse listings, place bids, and follow an item’s status from an active auction through to a completed sale.

### SMART Objectives

1. **Auction listings:** By the end of the three month development period, users will be able to create and browse auction listings in all five planned categories. We will demonstrate this with at least one sample listing containing the required information for each category.

2. **Bidding:** By the end of the three month development period, registered users will be able to place bids while an auction is active. We will test that the platform accepts a bid higher than the current bid and rejects both a lower bid and a bid submitted after the auction closes.

3. **Transaction status:** By the end of the three month development period, an auction with a winning bid will be able to enter **Pending Transaction** status after bidding ends. The platform will mark the item **Sold** only after the seller confirms payment receipt and the buyer confirms item receipt. We will demonstrate one completed transaction and one that remains pending.

## 2. Stakeholders and Team Roles

### Stakeholders

| Stakeholder | Relationship to Mezyad |
|---|---|
| Ghadi Alzhrani, Abeer Alsayari, Tala Alhudhaybi, and Aseel Alzhrani | Team members responsible for planning, building, testing, and documenting the project. |
| Academy instructors and reviewers | Provide guidance and review project deliverables. |
| Sellers | List items for auction and confirm payment receipt when a transaction is completed. |
| Buyers | Browse auctions, place bids, and confirm item receipt. |
| Real estate offices and developers | Potential sellers of properties that fit the platform’s categories. |

### Team Roles and Responsibilities

Ghadi Alzhrani, Abeer Alsayari, Tala Alhudhaybi, and Aseel Alzhrani work as project team members with **equal shared responsibility** for planning, designing, developing, testing, and documenting Mezyad. At the start of each development stage, the team will agree on specific tasks for each member and record who is responsible for completing them. All members will discuss decisions and review the results together.

Ghadi has expressed an interest in **user experience (UX) and interface design (UI)**. No permanent specializations have been assigned to team members at this stage.

## 3. Project Scope

Mezyad's MVP will focus on the complete core auction journey: a user can create or browse a listing, bid while its auction is active, and follow the item from auction closure to a confirmed sale. The scope is intentionally limited to a web-based demonstration of this workflow so the team can deliver and test it within the three-month project period.

### In Scope

- User registration, login, and role-based access for buyers and sellers.
- Seller-created auction listings with images, descriptions, a starting price, an auction start and end time, and the category-specific information required for the five selected categories: camels, newly built unsold properties, high-end handbags and rare collectibles, distinctive vehicle registration plates, and rare or discontinued vehicles.
- Browsing auction listings by category and viewing each item's details, current highest bid, and auction status.
- Bidding by registered users during an active auction, including validation that a bid is higher than the current highest bid and submitted before the auction closes.
- Automatic auction closure at the scheduled end time and status changes between **Active Auction**, **Pending Transaction**, and **Sold**.
- Seller confirmation of payment receipt and buyer confirmation of item receipt before a pending transaction is marked as sold.
- Test data, documented test scenarios, and a working MVP demonstration of the core flow.

### Out of Scope

- Electronic payment processing, escrow, and Apple Pay integration. Payment or cheque arrangements take place outside the MVP.
- Nafath integration, automated identity verification, ownership verification, legal checks, and official regulatory approval workflows.
- Cancellation, dispute resolution, refunds, and automatic re-listing for incomplete transactions.
- Native iOS or Android applications; the MVP will be a web application.
- Auction categories beyond the five selected categories, as well as advanced marketplace functions such as seller ratings, buyer reviews, live chat, recommendation engines, and marketing notifications.
- Operating the MVP as a live public marketplace or handling real funds and legally binding transactions.
