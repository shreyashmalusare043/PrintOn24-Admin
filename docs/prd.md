# Requirements Document

## 1. Application Overview
- **Application Name**: PrintOn24 Super Admin Panel
- **Application Description**: A centralized web administration system for PrintOn24 super administrators to oversee platform operations, financial settlements, shopkeeper registrations, capacity limits, advertisements, CMS content, promotional notices, and support requests with verified database persistence and real-time state synchronization.

## 2. Target Users & Core Scenarios
- **Target Users**:
  - Super Administrators: Platform administrators responsible for managing global platform operations, shop statuses, financial settlements, advertisements, CMS content, support tickets, and system security settings.
- **Core Scenarios**:
  - Super Admin authenticates securely via an isolated sign-in interface and navigates platform modules using an adaptive vertical sidebar.
  - Super Admin monitors real-time platform metrics and manages operational controls via dynamic platform controller toggles on the Dashboard.
  - Super Admin activates or deactivates printing shops, automatically triggering notification records in the notifications table and updating shopkeeper access.
  - Super Admin calculates and processes eligible settlements and payouts following standard settlement cycles.
  - Super Admin performs database-persisted CRUD operations on Homepage Banners (`home_banners`) and Upload Page Ads (`upload_page_ads`).
  - Super Admin edits, previews, and publishes CMS documents (`cms_content`, `platform_policies`, `platform_terms`) using a clean, streamlined content editor.
  - Super Admin manages promotional alerts, job postings, contact requests, and support tickets with guaranteed database persistence before interface state updates.

## 3. Page Structure & Functional Details

### 3.1 Page Structure Tree
```
PrintOn24 Super Admin Panel
├── Global Layout & Navigation
│   ├── Vertical Sidebar (Enlarged, Left-Aligned Logo, Collapsible Navigation)
│   └── Header Bar (Session Controls, Logout Action)
├── Authentication
│   └── Super Admin Sign-In Page (Secure Credential Authentication, Enhanced Graphics)
├── Dashboard (Page 1)
│   ├── Live Dynamic Metric Cards
│   ├── Revenue & Payment Method Line Chart
│   └── Platform Controllers Section (Active System Toggles & DB Controls)
├── Operational Ledger (Page 2)
│   └── Live Transaction & Print Volume Ledger (Search, Filters, Pagination)
├── Shops & Shopkeepers (Page 3)
│   ├── Registered Printing Shops Directory (Status Toggle with Notification Dispatch, Delete)
│   └── Shopkeeper Registration Form
├── Payment Methods (Page 4)
│   └── Shop-Specific Payment Configuration Table
├── Settlements & Payouts (Page 5)
│   ├── Financial Summary Cards (Gross Online, Fees, Net Payable)
│   ├── Payouts Ledger Table (Multi-Filter by Status, Date, Shop, Method)
│   └── Settlement Actions (Approve, Process, Mark Paid, Export)
├── PC Capacity Limit (Page 6)
│   └── Shop PC Limit Tracker & Quota Editor
├── Subscription Plans (Page 7)
│   └── Platform Plans Registry (CRUD Actions, Pricing, PC Limits, Status)
├── Users & Memberships (Page 8)
│   ├── Registered User Directory (Search, Pagination)
│   └── Shop-Wise VIP Members (Shop Name Display, Status Filter)
├── Advertisements (Page 9)
│   ├── Home Page Banners (Persistent CRUD on home_banners table)
│   └── Upload Page Ads (Persistent CRUD on upload_page_ads table)
├── Dynamic Pages & CMS (Page 10)
│   ├── About PrintOn24 Editor (cms_content table, Clean Editor, Preview & Publish)
│   ├── Privacy Policies Editor (platform_policies table, Clean Editor, Preview & Publish)
│   └── Terms and Conditions Editor (platform_terms table, Clean Editor, Preview & Publish)
├── Promotional Alerts & Notices (Page 11)
│   └── Alerts Management (CRUD persisting to notifications table, Target Audience)
├── Application Requests (Page 12)
│   └── Request Inbox (contact_messages, app_feedback, ad_requests with DB State Persistence)
├── Jobs & Careers (Page 13)
│   ├── Job Postings Directory (CRUD & Publish/Unpublish persisting to careers table)
│   └── Candidate Applications View (Applicant Profile & Formatted Cover Note)
├── Help & Support (Page 14)
│   └── Support Tickets Ledger (CRUD & Status Updates persisting to support_tickets table)
└── System Settings & Security (Page 15)
    ├── Security Passwords & Access Protection
    └── Global Platform Configurations
```

### 3.2 Functional Description

#### 3.2.1 Global UI & Authentication
- **Sidebar Logo Presentation**:
  - PrintOn24 logo displayed in the vertical sidebar header with increased size and strict left alignment, maintaining balanced padding without overlapping menu items.
- **Sign-In Page**:
  - Isolated admin login interface with enhanced graphics and secure credential validation.
  - Handles authentication validation, session storage, and secure logout redirection.
- **Responsive Layout**:
  - Layout adapts across desktop, laptop, tablet, and mobile viewports with collapsible navigation and horizontally scrollable tables.

#### 3.2.2 Dashboard (Page 1)
- **Live Metric Cards**: Aggregates real-time figures from database records covering active users, registered shops, orders, revenue, and active memberships.
- **Revenue Breakdown Chart**: Dotted-point line graph aggregating payment and order data with date range filtering (Today, Yesterday, Last 7 Days, Last 30 Days, Custom).
- **Platform Controllers**: Comprehensive control panel rendering active platform toggles backed by database records and system settings (e.g., global print acceptance toggle, maintenance mode switch, new shop registration lock, system alert banner override, and payout processing lock).

#### 3.2.3 Operational Ledger (Page 2)
- Displays database-backed transaction records, shop print volumes, and aggregated operational totals.
- Provides keyword search, date filtering, status filtering, and table pagination.

#### 3.2.4 Shops & Shopkeepers (Page 3)
- **Shop Directory**: Displays registered print shops and shopkeeper details. Supports status toggles (activate/deactivate), shop detail inspection, and account removal.
- **Status Persistence & Notification**: Deactivating or reactivating a shop persists the new status in the database and automatically writes a corresponding notification record into the `notifications` table for the target shopkeeper.
- **Shopkeeper Registration**: Persists new shopkeeper credentials directly to the database, enabling immediate login access.

#### 3.2.5 Payment Methods (Page 4)
- Manages shop-specific payment options (Razorpay/Online, Cash at Counter, UPI, Wallets).
- Supports adding, editing, enabling/disabling, and deleting payment methods per shop with direct database persistence.

#### 3.2.6 Settlements & Payouts (Page 5)
- **Calculations & Summaries**: Live summary metrics displaying Gross Online Amount, Platform Fees, and Net Payable Amount calculated strictly from eligible, paid online orders.
- **Multi-Filter Ledger**: Filtering across Payout Status (Pending, Processing, Settled, Rejected), Date Ranges, Shop Identifier, Amount Ranges, and Payment Methods.
- **Payout Operations**: Idempotent backend actions for approving requests, processing settlements adhering to the 2-day cycle, and marking records as paid with export functionality.

#### 3.2.7 PC Capacity Limit (Page 6)
- Manages hardware allocation quotas per shop.
- Persists limit adjustments to database tables and enforces quotas through backend validation.

#### 3.2.8 Subscription Plans (Page 7)
- Full CRUD management for platform subscription tiers (Plan Name, Price, PC Limit allowance, Validity duration, Status).
- Dynamic status filtering and real-time database persistence.

#### 3.2.9 Users & Memberships (Page 8)
- **User Registry**: Displays registered end-users with database-backed search and pagination.
- **VIP Memberships**: Lists VIP members displaying actual shop names (or clean short names for extended titles) in the Associated Shop column rather than raw internal IDs (e.g., ENT-02).

#### 3.2.10 Advertisements (Page 9)
- **Home Page Banners**: CRUD, publish, unpublish, and delete operations persisting directly to the `home_banners` table. Local UI state updates only after successful database confirmation.
- **Upload Page Ads**: CRUD, publish, unpublish, and delete operations persisting directly to the `upload_page_ads` table. Local UI state updates only after successful database confirmation.
- Deleted or unpublished records are excluded from public panel queries immediately.

#### 3.2.11 Dynamic Pages & CMS (Page 10)
- **Target Documents & Tables**:
  - `About PrintOn24`: Reads from and writes directly to `cms_content`.
  - `Privacy Policies`: Reads from and writes directly to `platform_policies`.
  - `Terms and Conditions`: Reads from and writes directly to `platform_terms`.
- **Clean Content Editor**:
  - Simple, clean text/markdown editor without complex Word-style rich text toolbars, preserving structured content, formatting tags, and line breaks.
  - Functional Save Draft, Preview mode, and Publish/Unpublish actions backed by direct table persistence.

#### 3.2.12 Promotional Alerts & Notices (Page 11)
- Create, view, edit, delete, publish, and unpublish platform notices.
- Operations write directly to the `notifications` table and reflect across target panels upon publication.

#### 3.2.13 Application Requests (Page 12)
- Real-time inbox handling categories across `contact_messages`, `app_feedback`, and `ad_requests` tables.
- Status changes and replies write directly to the respective database tables before UI state updates.

#### 3.2.14 Jobs & Careers (Page 13)
- **Job Postings**: CRUD and Publish/Unpublish actions writing directly to the `careers` table. Unpublished postings are immediately excluded from user listings.
- **Candidate Applications**: Inspection view displaying applicant details with the cover note rendered in a formatted block preserving line breaks.

#### 3.2.15 Help & Support (Page 14) & System Settings (Page 15)
- **Help & Support**: Support ticket tracking, status updates, and response logs with all updates persisting directly to the `support_tickets` table.
- **System Settings & Security**: Session management, administrative security passwords, and global configuration values.

## 4. Business Rules & Core Logic

### 4.1 Database Write-First State Synchronization
- All Super Admin actions (create, edit, publish, unpublish, delete, status toggle) must execute and confirm the database write before updating the client UI state.
- If a database operation fails, the UI must retain previous state and display an error notice.

### 4.2 Shop Status & Notification Rule
- Deactivating or activating a shop updates the shop record in the database and automatically creates a new notification record in the `notifications` table containing the status update message for the shopkeeper.

### 4.3 CMS and Advertisement Persistence Mapping
- Home banners operate strictly against `home_banners`.
- Upload ads operate strictly against `upload_page_ads`.
- CMS modules operate strictly against `cms_content`, `platform_policies`, and `platform_terms`.
- Alerts operate strictly against `notifications`.
- Career items operate strictly against `careers`.
- Support items operate strictly against `support_tickets`.

### 4.4 Settlement Integrity & Idempotency
- Settlement calculations include only successfully paid online orders.
- Payout actions transition strictly through: Pending -> Processing -> Settled / Rejected.
- Duplicate execution on already settled transactions is blocked.

## 5. Exceptions & Boundary Cases

| Scenario | Condition | System Behavior |
| :--- | :--- | :--- |
| Database Write Failure | Backend DB write fails during banner deletion or notice creation | UI state remains unchanged and displays an operation failure alert |
| Empty Chart Data | No order/payment records exist within the selected filter period | Render baseline line chart at zero values with empty state indicator |
| CMS Draft Saving | Admin attempts to save without required document identifier | Display validation error message and prevent submission |
| Shop Status Change Notification Failure | Shop status is updated but notification insert fails | Execute operation within transaction ensuring atomic update or rollback |
| Long Shop Name in VIP | Associated shop name exceeds column width | Display clean short name with full name accessible in detail view |
| Duplicate Payout Attempt | Processing action triggered on an already settled payout record | Reject action with notice that the record is already settled |

## 6. Acceptance Criteria

1. The vertical sidebar header displays an enlarged, strictly left-aligned PrintOn24 logo.
2. The sign-in page authenticates administrative credentials with enhanced visual assets and secure session handling.
3. The Dashboard features an expanded Platform Controllers section with operational toggles connected to live platform settings and database records.
4. Toggling shop status (activate/deactivate) persists to the database and generates a corresponding record in the `notifications` table for the shopkeeper.
5. The Associated Shop column in the VIP Members table displays the readable shop name or clean short name instead of internal entity identifiers.
6. Advertisement delete and update actions persist directly to `home_banners` and `upload_page_ads`, updating the UI only after successful database response.
7. The Dynamic Pages & CMS module provides a clean editor without Word-style toolbars, reading and writing directly to `cms_content`, `platform_policies`, and `platform_terms` with functional Preview and Publish capabilities.
8. Promotional alerts CRUD operations persist directly to the `notifications` table.
9. Job postings publish and unpublish operations persist directly to the `careers` table.
10. Status updates and replies across Application Requests (`contact_messages`, `app_feedback`, `ad_requests`) and Help & Support (`support_tickets`) persist to their respective database tables prior to local state updates.

## 7. Out of Scope (Non-MVP)

- Direct modification of User Panel or Shopkeeper Panel frontend codebases.
- Automatic direct bank wire disbursement integrations.
- Complex rich-text formatting plugins and WYSIWYG Word-style editors in CMS modules.
- Permanent physical deletion of records tied to active transactional history.