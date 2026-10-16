# Requirements Document

## 1. Application Overview
- **Application Name**: PrintOn24 Super Admin Panel
- **Application Description**: A centralized web administration system for PrintOn24 super administrators to oversee platform operations, real-time revenue analytics, shop status lifecycles, QR-blocking controls, accurate commission-based settlements, PC capacity allocations, subscription plans, dynamic CMS content, advertisements, job postings, and platform security using a unified 6-digit administrative PIN.

## 2. Target Users & Core Scenarios
- **Target Users**:
  - Super Administrators: Platform administrators responsible for managing platform operations, shop lifecycles, financial payouts, subscription assignments, CMS documents, support tickets, and system security.
- **Core Scenarios**:
  - Super Admin signs in through a branded sign-in interface and navigates modules via an aligned vertical sidebar.
  - Super Admin views real-time revenue and payment breakdown graphs computed from actual database records in Indian Standard Time (IST).
  - Super Admin manages shop operational states (Active, Inactive, Disabled); deactivating or disabling a shop immediately blocks shopkeeper login, customer QR/shop-code discovery, uploads, and order creation while preserving historical data.
  - Super Admin verifies 2-day settlement cycles, commission deductions, and marks payouts with live database updates and real bank details.
  - Super Admin assigns or upgrades shopkeeper subscription plans and modifies shop-specific PC capacity limits with immediate database persistence.
  - Super Admin unlocks sensitive operations (Shopkeeper Credentials, Settlements & Payouts, Payment Methods) via a unified 6-digit Security PIN modal with blurred background and rate-limiting.
  - Super Admin edits and publishes structured CMS content (including the seeded About Us sections) into `cms_content` for public display.

## 3. Page Structure & Functional Details

### 3.1 Page Structure Tree
```
PrintOn24 Super Admin Panel
├── Global Layout & Navigation
│   ├── Vertical Sidebar (Height-Adjusted Logo, Aligned Sub-Divider Line, Collapsible Menu)
│   └── Header Bar (Session Status, Logout Action)
├── Authentication
│   └── Super Admin Sign-In Page (Branded Portal Graphics, Credential Authentication)
├── Dashboard (Page 1)
│   ├── Live Dynamic Metric Cards (DB Aggregated)
│   ├── Real-Time Revenue & Payment Breakdown Chart (IST Timezone)
│   └── Platform Quick Links (Direct Navigation Shortcuts including Ads and Careers)
├── Operational Ledger (Page 2)
│   └── Live Transaction & Print Volume Ledger (Search, Filters, Pagination)
├── Shops & Shopkeepers (Page 3)
│   ├── Shop Directory (Active / Inactive / Disabled Status, QR Blocking Logic, Delete)
│   ├── Shopkeeper Credential Inspection (PIN Protected)
│   └── Shopkeeper Registration Form
├── Payment Methods (Page 4)
│   └── Shop Payment Configuration Table (PIN Protected)
├── Settlements & Payouts (Page 5 - PIN Protected)
│   ├── Financial Summary Cards (Pending Payouts, Completed Payouts, Total Commission, Next Settlement Date)
│   ├── 2-Day Settlement Cycle Ledger (Current, Previous, Earlier Cycles; Shop Filter; Date Range)
│   ├── Shop Bank Details Display (Actual Saved Details or Not Added State)
│   └── Payout Settlement Action (Mark Paid with Ref ID, Recalculate Pending Amounts)
├── PC Capacity Limit (Page 6)
│   └── Shop PC Limit Tracker & Shop-Specific Quota Editor
├── Subscription Plans (Page 7)
│   ├── Platform Plans Registry (CRUD Actions, Pricing, PC Limits, Status)
│   ├── Plan Assignment to Shop (DB Persistence, Immediate Shopkeeper Association)
│   └── Plan Upgrade Action (Immediate Expiry & Quota Update)
├── Users & Memberships (Page 8)
│   ├── Registered User Directory (Search, Pagination)
│   └── Shop-Wise VIP Members (Readable Shop Name Display)
├── Advertisements (Page 9)
│   ├── Home Page Banners (Persistent CRUD on home_banners table)
│   └── Upload Page Ads (Persistent CRUD on upload_page_ads table)
├── Dynamic Pages & CMS (Page 10)
│   ├── About PrintOn24 Section Editor (cms_content table, Structured Section CRUD)
│   ├── Privacy Policies Editor (platform_policies table, Clean Editor, Publish Action)
│   └── Terms and Conditions Editor (platform_terms table, Clean Editor, Publish Action)
├── Promotional Alerts & Notices (Page 11)
│   └── Alerts Management (CRUD persisting to notifications table)
├── Application Requests (Page 12)
│   └── Request Inbox (contact_messages, app_feedback, ad_requests)
├── Jobs & Careers (Page 13)
│   ├── Job Postings Directory (CRUD persisting to careers table)
│   └── Candidate Applications View
├── Help & Support (Page 14)
│   └── Support Tickets Ledger (CRUD persisting to support_tickets table)
└── System Settings & Security (Page 15)
    ├── Unified 6-Digit Security PIN Configuration (Sign-In Password Verification, Hashed Storage)
    └── Global Platform Configurations
```

### 3.2 Functional Description

#### 3.2.1 Global UI & Authentication
- **Sidebar Navigation**:
  - PrintOn24 logo height increased by 3px in the vertical sidebar header.
  - Horizontal dividing line directly below the sidebar logo is aligned with the header horizontal border line to eliminate spacing mismatches.
  - Navigation menu provides collapsible links across all platform modules.
- **Sign-In Page**:
  - Administrative authentication page with redesigned visual graphic artwork aligning with PrintOn24 branding and shopkeeper portal styling.
  - Validates super admin credentials and initiates secure administrative session.

#### 3.2.2 Dashboard (Page 1)
- **Live Metric Cards**: Aggregates real-time values from the database for active users, registered shops, orders, revenue, and active memberships.
- **Dynamic Revenue & Payment Breakdown Chart**:
  - Renders time-series data using actual completed order and transaction records from the database.
  - Converts timestamps to Indian Standard Time (IST) for accurate daily and periodic aggregation.
  - Supports filtering by date ranges (Today, Yesterday, Last 7 Days, Last 30 Days, Custom Range).
- **Platform Quick Links**:
  - Quick shortcut links including direct navigation to: Advertisements: Home Banners, Advertisements: Upload Page Ads, and Jobs & Careers.
  - The legacy Platform Controllers and Operational Switches section at the bottom of the dashboard is removed.
- **Layout & Responsiveness**: Structured container grid preventing content overflow across desktop, tablet, and mobile viewports.

#### 3.2.3 Operational Ledger (Page 2)
- Displays transaction logs and order print volume records stored in the database with search, filter, and pagination support.

#### 3.2.4 Shops & Shopkeepers (Page 3)
- **Shop Lifecycle & Status Management**:
  - Each shop record maintains one of three states: `Active`, `Inactive`, or `Disabled`.
  - Toggling status persists immediately to the database.
  - When a shop is set to `Inactive` or `Disabled`:
    - Shopkeeper login access is blocked.
    - Customer QR code lookup and shop-code search are blocked.
    - Document uploads and order creations targeting the shop are blocked on the backend.
    - Existing historical orders, shop profiles, and transaction records remain preserved.
  - When reactivated (`Active`), login, QR discovery, document upload, and order creation capabilities are restored immediately.
- **Security PIN Protected Credential View**:
  - Inspecting shopkeeper credentials requires entering the unified 6-digit Security PIN.

#### 3.2.5 Payment Methods (Page 4)
- Manages shop-specific payment options (Razorpay/Online, Cash at Counter, UPI, Wallets).
- Access to modify or configure payment methods is protected by the unified 6-digit Security PIN.

#### 3.2.6 Settlements & Payouts (Page 5)
- **Security PIN Protection**: Accessing the Settlements & Payouts page or performing payout actions requires PIN verification.
- **Accurate Financial Calculations**:
  - Removes static and mock data.
  - Calculates Gross Online Amount, Platform Commission (e.g., 5% platform fee), and Net Payable Amount strictly from completed online orders stored in the database.
- **Summary Cards**:
  - Four real-time summary cards: Pending Payouts, Completed Payouts, Total Commission, and Next Settlement Date.
- **2-Day Settlement Cycle Grouping**:
  - Groups settlement batches into 2-day cycles: Current Cycle, Previous Cycle, and Earlier Cycles.
  - Deduplicates shops so each shop appears once per cycle batch.
  - Supports filtering by cycle, shop name/ID, and custom date range.
- **Bank Details Display**:
  - Displays actual saved bank account details (Bank Name, Account Number, IFSC) or a designated `Not added` state if unconfigured.
- **Payout Action Execution**:
  - Marking a payout as completed updates the database status, payout amount, settlement timestamp, and transaction reference ID, triggering an immediate recalculation of pending balances.

#### 3.2.7 PC Capacity Limit (Page 6)
- Super Admin modifies PC allocation limits per shop.
- Limit adjustments persist directly to the database for the targeted shop only and apply immediately to workstation connections.

#### 3.2.8 Subscription Plans (Page 7)
- **Plan Management**: CRUD operations for platform subscription tiers (Name, Price, PC Limit allowance, Duration, Status).
- **Assign Subscription Action**:
  - Super Admin selects a shop and assigns a subscription plan.
  - Validates and writes plan allocation directly to the database, applying the plan to the target shopkeeper.
  - Updates tracking ledger immediately with start date, expiry date, and active status.
- **Upgrade Action**:
  - Allows upgrading an existing shop subscription with updated PC limits and new validity dates persisted directly to the database.

#### 3.2.9 Users & Memberships (Page 8)
- User registry with search and pagination.
- VIP Memberships table displays readable shop names in the Associated Shop column.

#### 3.2.10 Advertisements (Page 9)
- **Home Page Banners**: CRUD, publish, and delete operations persisting directly to `home_banners`.
- **Upload Page Ads**: CRUD, publish, and delete operations persisting directly to `upload_page_ads`.
- UI updates upon database confirmation; unpublished/deleted ads are excluded from public endpoints.

#### 3.2.11 Dynamic Pages & CMS (Page 10)
- **About PrintOn24 Content Synchronization & Management**:
  - Content stored section-by-section in `cms_content` covering:
    - Story & Mission
    - What is PrintOn24 (4 Pillars: QR-Based Instant Discovery, Precision Print Engine, Flexible Dual Payments, Silent Hardware Dispatch)
    - Purpose & Direction (Mission & Vision statements)
    - Leadership & Architecture (Technology Partner, Engineering & Core team, Growth & Analytics team)
    - Benefits at a Glance (Customer Benefits, Shopkeeper Benefits)
  - Super Admin CMS editor provides section-by-section CRUD, draft saving, and publishing directly to `cms_content` for public rendering.
- **Policies & Terms**:
  - Privacy Policies editor writes to `platform_policies`.
  - Terms and Conditions editor writes to `platform_terms`.

#### 3.2.12 Promotional Alerts & Notices (Page 11)
- Create, edit, publish, and delete alerts persisting directly to the `notifications` table.

#### 3.2.13 Application Requests (Page 12)
- View and manage incoming messages across `contact_messages`, `app_feedback`, and `ad_requests` tables.

#### 3.2.14 Jobs & Careers (Page 13)
- Manage job postings and candidate applications with CRUD actions persisting to the `careers` table.

#### 3.2.15 Help & Support (Page 14)
- Support ticket ledger and response logging persisting to the `support_tickets` table.

#### 3.2.16 System Settings & Unified Security PIN (Page 15)
- **Unified 6-Digit Security PIN**:
  - Replaces separate area passwords with a single system-wide 6-digit PIN.
  - Setting or modifying the PIN requires validating the Super Admin sign-in password.
  - PIN is stored securely as a cryptographic hash.
- **Protected Sensitive Areas**:
  - Shopkeeper Credential Inspection (Page 3)
  - Payment Methods Configuration (Page 4)
  - Settlements & Payouts Module and Actions (Page 5)
- **PIN Verification Interface**:
  - Triggers a centered modal dialog with background blur.
  - Unlocks module access upon valid 6-digit PIN entry.
  - Enforces rate-limiting after repeated failed attempts to prevent brute-force entry.

## 4. Business Rules & Core Logic

### 4.1 Shop Lifecycle and QR Blocking Rules
- An `Active` shop allows shopkeeper authentication, public QR discovery, document upload, and order dispatching.
- An `Inactive` or `Disabled` shop immediately blocks:
  - Shopkeeper login requests.
  - Customer QR code scans and shop-code lookup queries.
  - File upload requests and order creation API requests.
- Status transitions preserve all past orders, payments, and account history.

### 4.2 Financial Settlement & Calculation Rules
- Calculations include only completed online orders (`status = completed` and `payment_status = paid`).
- Platform Fee = Gross Online Amount * Platform Commission Rate (e.g., 5%).
- Net Payable Amount = Gross Online Amount - Platform Fee.
- Each shop is represented exactly once per 2-day settlement cycle batch.
- Marking a payout as paid updates payout record status to Settled, sets the paid timestamp, stores the reference ID, and recalculates pending balances.

### 4.3 Unified Security PIN Rules
- Creating or updating the 6-digit PIN requires the Super Admin's current login password.
- Entering the correct PIN grants session access to the protected module.
- Exceeding maximum consecutive failed attempts locks PIN entry temporarily.

### 4.4 Subscription Assignment and Capacity Enforcement
- Assigning or upgrading a subscription plan writes plan records to the database with active start date, computed expiry date, and assigned PC capacity.
- PC capacity changes apply only to the specified shop without affecting other shop quotas.

### 4.5 CMS Data Integrity Rule
- About Us content updates persist to the `cms_content` table partitioned by section identifiers, maintaining data structure for public portal consumption.

## 5. Exceptions & Boundary Cases

| Scenario | Condition | System Behavior |
| :--- | :--- | :--- |
| Customer Scans Disabled Shop QR | Shop status is `Inactive` or `Disabled` | Return shop unavailable error; block file upload and order submission |
| Failed Security PIN Attempt | Incorrect 6-digit PIN entered in modal | Display error notice; maintain modal lock; increment rate-limit counter |
| Rate-Limit Exceeded on PIN | 5 consecutive invalid PIN attempts | Temporarily lock PIN verification for designated cooldown duration |
| Missing Bank Details | Shopkeeper has not configured bank information | Display `Not added` badge; prevent marking payout until bank details are added |
| Subscription Plan Assignment Failure | Target shop record missing or invalid plan data | Abort transaction, display descriptive error, and maintain previous plan state |
| PC Capacity Limit Update | Admin submits invalid or negative capacity quota | Reject submission with validation prompt; preserve existing capacity limit |
| Duplicate Shop in Settlement Cycle | Multiple orders exist for a single shop in one cycle | Aggregate all shop orders into a single consolidated row for that cycle |

## 6. Acceptance Criteria

1. The vertical sidebar header displays the PrintOn24 logo with a 3px height increase and an aligned dividing line matching the header border line.
2. The Dashboard displays real-time dynamic Revenue and Payment Method charts aggregating database transactions in Indian Standard Time (IST), includes updated quick links (Home Banners, Upload Page Ads, Jobs & Careers), and omits the legacy bottom platform controllers section.
3. Setting a shop to `Inactive` or `Disabled` blocks shopkeeper login, QR discovery, document upload, and order creation on the backend while retaining existing shop data.
4. Settlements & Payouts calculates Gross Amount, Commission, and Net Payable from completed DB orders, displays 4 dynamic summary cards, groups records into 2-day cycles without shop duplicates, and reflects real bank details or `Not added` state.
5. Marking a payout as paid persists status, amount, date, and reference ID to the database and recalculates pending balances immediately.
6. PC capacity limit edits persist to the database for the targeted shop only and apply immediately.
7. Assigning or upgrading a subscription plan saves the plan association to the database, applies it to the target shopkeeper, and updates the tracking table with valid start and expiry dates.
8. The unified 6-digit Security PIN modal with blurred background restricts access to Shopkeeper Credentials, Settlements & Payouts, and Payment Methods, requiring password verification to create/modify PIN and enforcing failed attempt rate-limiting.
9. The About PrintOn24 CMS editor provides section-by-section CRUD and publishes structured content (Story, 4 Pillars, Mission & Vision, Team & Credits, Benefits) directly to the `cms_content` table.
10. Sign-in page features branded visual artwork consistent with PrintOn24 design guidelines.

## 7. Out of Scope (Non-MVP)

- Direct modification of User Panel or Shopkeeper Panel client-side rendering engines.
- Automated bank gateway direct transfer execution.
- Complex rich-text WYSIWYG toolbars for CMS plain-structured sections.
- Permanent database row deletion of shops with existing transactional history.