# Requirements Document

## 1. Application Overview
- **Application Name**: PrintOn24 Super Admin Panel
- **Application Description**: A centralized web administration system for PrintOn24 super administrators to oversee platform operations, financial settlements, shopkeeper registrations, capacity limits, advertisements, CMS policies, and support requests with real-time database persistence and cross-panel consistency.

## 2. Target Users & Core Scenarios
- **Target Users**:
  - Super Administrators: Platform administrators responsible for managing global platform operations, shop statuses, financial settlements, advertisements, CMS content, and security settings.
- **Core Scenarios**:
  - Super Admin signs in securely and navigates platform modules through an adaptive vertical sidebar layout.
  - Super Admin monitors real-time platform metrics, orders, revenue breakdown, and executes platform controllers.
  - Super Admin registers new shops, toggles shop activation status with backend enforcement, and monitors shop-level ledgers.
  - Super Admin calculates and processes eligible settlements and payouts following standard settlement cycles.
  - Super Admin manages Homepage Banners (`home_banners`) and Upload Page Ads (`upload_page_ads`) with database persistence.
  - Super Admin creates, edits, previews, and publishes CMS documents (`cms_content`, `platform_policies`, `platform_terms`) and career postings.
  - Super Admin manages promotional alerts, VIP memberships with clear shop associations, support tickets, and system security credentials.

## 3. Page Structure & Functional Details

### 3.1 Page Structure Tree
```
PrintOn24 Super Admin Panel
├── Global Layout & Navigation
│   ├── Vertical Sidebar (Enlarged & Centered Logo, Collapsible Navigation)
│   └── Header Bar (Session Controls, Logout Action)
├── Authentication
│   └── Super Admin Sign-In Page (Isolated Admin Login, Polished Print-Themed Graphics)
├── Dashboard (Page 1)
│   ├── Live Dynamic Metric Cards
│   ├── Revenue & Payment Method Line Chart
│   └── Platform Controllers Section
├── Operational Ledger (Page 2)
│   └── Live Transaction & Print Volume Ledger (Search, Filters, Pagination)
├── Shops & Shopkeepers (Page 3)
│   ├── Registered Printing Shops Directory (Status Toggle, Detail View, Delete)
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
│   └── Shop-Wise VIP Members (Associated Shop Name Display, Status Filter)
├── Advertisements (Page 9)
│   ├── Home Page Banners (Direct CRUD on home_banners table)
│   └── Upload Page Ads (Direct CRUD on upload_page_ads table)
├── Dynamic Pages & CMS (Page 10)
│   ├── About PrintOn24 Editor (cms_content table)
│   ├── Privacy Policies Editor (platform_policies table)
│   └── Terms and Conditions Editor (platform_terms table)
├── Promotional Alerts & Notices (Page 11)
│   └── Alerts Management (CRUD, Audience Targeting, Publish/Unpublish)
├── Application Requests (Page 12)
│   └── Request Inbox (Categories: All, Feedback, User Inquiry, Shopkeeper Request, Advertiser Sponsorship)
├── Jobs & Careers (Page 13)
│   ├── Job Postings Directory (CRUD, Publish/Unpublish Controls)
│   └── Candidate Applications View (Applicant Profile & Formatted Cover Note)
├── Help & Support (Page 14)
│   └── Support Tickets Ledger (Status Tracking, Responses)
└── System Settings & Security (Page 15)
    ├── Security Passwords & Access Protection
    └── Global Platform Configurations
```

### 3.2 Functional Description

#### 3.2.1 Global UI & Authentication
- **Sidebar Logo Presentation**:
  - Logo asset displayed in the vertical sidebar header with increased sizing, balanced vertical and horizontal spacing, and neat centering.
  - Preserves responsive behavior without overlapping navigation items.
- **Sign-In Page**:
  - Isolated admin login interface with clean printing and admin operational visual assets.
  - Supports standard credential authentication, session persistence, and secure logout redirection.
- **Responsive Layout**:
  - Layout dynamically adapts across mobile, tablet, laptop, and desktop viewports with collapsible navigation and horizontally scrollable data tables.

#### 3.2.2 Dashboard (Page 1)
- **Live Metric Cards**: Aggregates real-time figures from database records covering active users, registered shops, orders, revenue, and active memberships.
- **Revenue Breakdown Chart**: Renders a dotted-point line graph aggregating dynamic payment and order data with date range filtering (Today, Yesterday, Last 7 Days, Last 30 Days, Custom).
- **Platform Controllers**: Dedicated actionable control triggers for core platform administration tasks connected directly to backend functions.

#### 3.2.3 Operational Ledger (Page 2)
- Displays database-backed transaction records, shop print volumes, and aggregated operational totals.
- Provides keyword search, date filtering, status filtering, and table pagination.

#### 3.2.4 Shops & Shopkeepers (Page 3)
- **Shop Directory**: Displays registered print shops and shopkeeper details. Supports status toggles (activate/deactivate), shop detail inspection, and account removal.
- **Status Enforcement**: Deactivating a shop updates the database status and enforces access restrictions in real-time.
- **Shopkeeper Registration**: Persists new shopkeeper credentials directly to the database, enabling immediate login access.

#### 3.2.5 Payment Methods (Page 4)
- Manages shop-specific payment options (Razorpay/Online, Cash at Counter, UPI, Wallets).
- Supports adding, editing, enabling/disabling, and deleting payment methods per shop.

#### 3.2.6 Settlements & Payouts (Page 5)
- **Calculations & Summaries**: Live summary metrics displaying Gross Online Amount, Platform Fees, and Net Payable Amount calculated strictly from eligible, paid online orders.
- **Multi-Filter Ledger**: Filtering across Payout Status (Pending, Processing, Settled, Rejected), Date Ranges, Shop Identifier, Amount Ranges, and Payment Methods.
- **Payout Operations**: Idempotent backend actions for approving requests, processing settlements adhering to the 2-day cycle, and marking records as paid with export functionality.

#### 3.2.7 PC Capacity Limit (Page 6)
- Manages hardware allocation quotas per shop.
- Persists limit adjustments to database tables and enforces quotas through backend validation.

#### 3.2.8 Subscription Plans (Page 7)
- Full CRUD management for platform subscription tiers (Plan Name, Price, PC Limit allowance, Validity duration, Status).
- Dynamic status filtering and real-time persistence.

#### 3.2.9 Users & Memberships (Page 8)
- **User Registry**: Displays registered end-users with database-backed search and pagination.
- **VIP Memberships**: Lists VIP members displaying actual shop names (or clean short names for extended titles) instead of raw internal entity codes, maintaining correct shop associations.

#### 3.2.10 Advertisements (Page 9)
- **Home Page Banners**: Dedicated CRUD, publish, and unpublish operations interacting exclusively with the `home_banners` table.
- **Upload Page Ads**: Dedicated CRUD, publish, and unpublish operations interacting exclusively with the `upload_page_ads` table.
- Real-time updates ensure deleted or unpublished ads immediately cease appearing in public panels.

#### 3.2.11 Dynamic Pages & CMS (Page 10)
- **Target Documents & Tables**:
  - `About PrintOn24`: Reads and writes to `cms_content`.
  - `Privacy Policies`: Reads and writes to `platform_policies`.
  - `Terms and Conditions`: Reads and writes to `platform_terms`.
- **Editor & Actions**: Streamlined content editor providing text formatting, Save Draft, Preview mode, and Publish/Unpublish actions.
- **Data Safety**: Prevents overwriting with blank content, eliminates duplicate records on save, and sanitizes markup before publication.

#### 3.2.12 Promotional Alerts & Notices (Page 11)
- Create, view, edit, delete, publish, and unpublish platform notices.
- Targeted audience distribution with status updates reflected across destination panels upon publication.

#### 3.2.13 Application Requests (Page 12)
- Real-time request inbox with categories: `All Requests`, `Feedback`, `User Inquiry`, `Shopkeeper Request`, and `Advertiser Sponsorship`.
- Supports request inspection, status updates, and logging.

#### 3.2.14 Jobs & Careers (Page 13)
- **Job Postings**: CRUD operations with explicit Publish/Unpublish controls. Unpublished openings are excluded from public user listings.
- **Candidate Applications**: Inspection modal displaying applicant details with the cover note rendered in a dedicated formatted block preserving line breaks.

#### 3.2.15 Help & Support (Page 14) & System Settings (Page 15)
- **Help & Support**: Support ticket tracking, status updates, and response logs.
- **System Settings & Security**: Session management, 6-digit administrative security passwords, and global configuration values.

## 4. Business Rules & Core Logic

### 4.1 Cross-Panel Data Consistency
- Published updates to CMS pages (`cms_content`, `platform_policies`, `platform_terms`), advertisements, alerts, and job openings must immediately reflect in User and Shopkeeper panels.
- Unpublished or soft-deleted records must be immediately excluded from public queries across all panels.

### 4.2 Settlement Integrity & Idempotency
- Settlement calculations include only successfully paid online orders.
- Payout actions transition strictly through: Pending -> Processing -> Settled / Rejected.
- Duplicate execution or duplicate payouts on already settled transactions are strictly blocked.

### 4.3 Advertisement Placement Isolation
- Homepage advertisement actions must strictly modify the `home_banners` table.
- Upload page advertisement actions must strictly modify the `upload_page_ads` table.

### 4.4 Shop Activation & Access Enforcement
- Deactivating a shop in the directory immediately invalidates active shop sessions and blocks new logins in the Shopkeeper Portal.

## 5. Exceptions & Boundary Cases

| Scenario | Condition | System Behavior |
| :--- | :--- | :--- |
| Empty Chart Data | No order/payment records exist within the selected filter period | Render baseline line chart at zero values with clear empty state indicator |
| CMS Draft Saving | Admin saves an incomplete draft without required title | Display validation error message and prevent submission |
| Shop Deactivation Impact | Admin deactivates an active shop with pending orders | Update shop status without corrupting historic financial or order records |
| Long Shop Name in VIP | Associated shop name exceeds column width | Display truncated/shortened display format with full shop name visible in detail view |
| Duplicate Payout Attempt | Processing action triggered on an already settled payout record | Reject action with notice that the record is already settled |
| Unpublished Job Public Access | Public client requests an unpublished or deleted career posting | Public client query returns empty result or active postings only |

## 6. Acceptance Criteria

1. Vertical sidebar renders an enlarged, neatly centered PrintOn24 logo with balanced margins without layout overflow.
2. Sign-in page provides an isolated login workflow with printing/admin themed visual elements and secure session handling.
3. The layout and tables dynamically adapt across mobile, tablet, laptop, and desktop viewports.
4. Dashboard displays real-time aggregated figures from database tables with interactive date filters and functional platform controllers.
5. Shop status toggling (activate/deactivate) persists to the database and restricts shopkeeper access accordingly.
6. Settlements and payouts calculate gross, fee, and net amounts accurately from eligible online orders, preventing duplicate settlements.
7. VIP membership records display the explicit shop name rather than an unmapped entity ID.
8. Advertisements management performs CRUD operations strictly on `home_banners` for homepage banners and `upload_page_ads` for upload page ads.
9. CMS content editor allows editing, previewing, and publishing for About Us (`cms_content`), Privacy Policy (`platform_policies`), and Terms and Conditions (`platform_terms`) with immediate User Panel synchronization upon publication.
10. Job openings unpublished by Super Admin immediately cease to appear in public job listings.

## 7. Out of Scope (Non-MVP)

- Direct modification of User Panel or Shopkeeper Panel frontend codebases.
- Automatic direct bank wire disbursement integrations.
- Unrelated redesign of approved page themes and color palettes.
- Permanent physical deletion of records tied to active transactional history.