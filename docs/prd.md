# Requirements Document

## 1. Application Overview
- **Application Name**: PrintOn24
- **Application Description**: PrintOn24 Super Admin and Shopkeeper Panel is a centralized web management platform that enables platform administrators and shopkeepers to manage printing shop configurations, access controls, database-driven analytics, settlement cycles, payment modes, security passwords, advertisement placements, rich-text dynamic CMS, and subscription lifecycles with strict data isolation.

## 2. Target Users & Core Scenarios
- **Target Users**:
  - Super Administrators: Platform owners responsible for managing platform-wide operational data, shop configurations, payments, settlements, subscriptions, security settings, ads, and dynamic content.
  - Shopkeepers: Store owners managing their assigned shop operations, PC limits, orders, and subscriptions within authorized limits.
- **Core Scenarios**:
  - Super Admin accesses fixed-layout panels and navigates modules with independent sidebar scrolling.
  - Super Admin applies multi-dimensional database filters (date ranges, multi-shop selectors, status, payment modes) across transactions, settlements, requests, and shopkeepers.
  - Super Admin configures three separate 6-digit security passwords (with email OTP verification) to protect sensitive actions: Shopkeeper Credential View, Settlement & Payout, and Payment Methods.
  - Super Admin views shopkeeper details with centered QR code alignment and reveals credentials only upon valid 6-digit password verification.
  - Super Admin manages advertisement banners for User Panel Home and Upload pages, and edits dynamic CMS pages via a rich-text editor.
  - Disabled or expired subscription shopkeeper accounts are automatically restricted from logging in while preserving historical data.

## 3. Page Structure & Functional Details

### 3.1 Page Structure Tree
```
PrintOn24 Management Panel
├── Global Layout (Fixed Top Navbar, Fixed Left Sidebar, Scrollable Content Area)
├── Authentication
│   ├── Login Page (Role-based access & account status validation)
│   └── Email OTP Verification Modal (6-digit input for sensitive settings)
├── Dashboard & Analytics
│   └── Overview Dashboard (Filtered by date, shop, status)
├── Shop & Shopkeeper Management
│   ├── Shopkeeper Directory (Database-driven filters & status controls)
│   ├── Shop Registration Form (Profile, Initial Credentials, QR Generation)
│   └── Shopkeeper Details View
│       ├── Overview Tab (Centered QR Container, Masked Credentials with Eye-Icon Verification)
│       └── Payments & Limits Tab (PC Capacity & Payment Mode Configurations)
├── PC Capacity Management
│   └── PC Limit & Upgrade Requests (Status, Date & Shop Filters)
├── Payment & Settlement Management
│   ├── Payment Methods Configuration (Protected by Security Password)
│   ├── Online Payment Transactions Log
│   └── Settlement & Payout Management (Protected by Security Password, Date/Status/Type Filters)
├── Subscription & Membership Management
│   ├── Subscription Plans Directory (Database-driven plan parameters)
│   ├── Shopkeeper Subscription Assignment & Lifecycle Tracking
│   └── User Memberships Directory
├── Advertisement Management
│   ├── User Panel Home Page Hero/Banner Ads
│   └── User Panel Upload Page Ads
├── Dynamic Content Management (CMS)
│   ├── Rich-Text Content Editor (About Us, Privacy Policy, Terms & Conditions)
│   └── Dynamic Informational Page Preview & Publishing
├── Application Requests Management
│   └── Centralized Request Inbox (Multi-shop, status & date filters)
└── System Settings & Security Configuration
    ├── Security Passwords Card (Credential View, Settlement & Payout, Payment Methods)
    └── Appearance & Theme Configuration
```

### 3.2 Functional Description

#### 3.2.1 Global Layout & Navigation
- Fixed top navigation bar and fixed left sidebar across both Super Admin and Shopkeeper Admin panels.
- The sidebar menu scrolls independently when menu items exceed screen height; only the main page body content scrolls.

#### 3.2.2 Authentication & Access Control
- **Login Validation**:
  - Validates credentials and verifies active account and subscription status before granting access.
  - Disabled shopkeeper accounts are blocked at login with an explicit status message.
  - Inactive or expired subscriptions restrict shopkeeper access according to plan rules without deleting historical data.
- **Email OTP Verification**:
  - Required for viewing, setting, or updating any of the three security passwords in System Settings.
  - Sends a secure, time-expiring OTP to the registered Super Admin email address.
  - Displays six individual input boxes with attempt limits and backend validation.

#### 3.2.3 Shopkeeper QR & Details
- **Shopkeeper Details Tabs**:
  - Limited strictly to two tabs: `Overview` and `Payments & Limits` (QR Standards tab removed).
- **Centered QR Display**:
  - QR code is centered inside a dedicated, properly sized container to guarantee sharp, scannable display.
- **Credential Masking & Security**:
  - Login credentials are hidden by default.
  - Clicking the eye icon opens a modal requesting the common 6-digit Shopkeeper Credential View password.
  - Upon verification, reveals credential details without exposing or retrieving plaintext passwords.

#### 3.2.4 System Settings & Security Passwords
- **Three Dedicated Security Password Cards**:
  1. Shopkeeper Credential View Password
  2. Settlement & Payout Password
  3. Payment Methods Password
- Each password is composed of exactly 6 numeric digits, securely hashed, masked upon saving, and verified server-side.
- Modifying or viewing configured passwords strictly requires prior Super Admin email OTP verification.

#### 3.2.5 Protected Pages & Actions
- Applies to: `Settlement & Payout`, `Payment Methods`, and `Shopkeeper Credential View`.
- When a security password is set, accessing the protected page/section displays a blurred background with a centered 6-digit password verification modal.
- Full access is unlocked only upon successful password verification; if no password is configured in settings, direct access is allowed.
- Unrelated page navigation and actions remain functional.

#### 3.2.6 Database-driven Filters
- Integrated across: Shopkeepers, Payment Methods, Settlements & Payouts, PC Capacity Limits, Subscription Plans, and Application Requests.
- **Filter Dimensions**:
  - Date Presets: Today, Yesterday, Last 7 Days, Last 30 Days, and Custom Date Range picker.
  - Entity Filters: Single or multi-shop/shopkeeper selection.
  - Status Filters: Active, Inactive, Pending, Approved, Rejected, Settled, Expired.
  - Payment Type Filters: Counter Only, Online/Razorpay Only, Both.

#### 3.2.7 Advertisement Management
- Super Admin management for two designated placements:
  1. User Panel Home Page (Hero/Banner Ads)
  2. User Panel Upload Page Ads
- **Ad Fields**: Image upload, Title, Description, Target Link/URL, Activation Status (Active/Inactive), and Numeric Display Order.
- Only active advertisements mapped to the respective placement are dynamically queried and displayed in user panels.

#### 3.2.8 Dynamic Content Management (CMS)
- Super Admin management for informational pages: About Us, Privacy Policy, Terms & Conditions, and FAQs.
- **Rich-Text Editor Capabilities**: Font selection, Headings, Font Sizes, Paragraph Alignment (Left, Center, Right, Justify), Bulleted/Numbered Lists, Hyperlinks, Preview Mode, and Save/Publish actions.
- Stores sanitized HTML content in the database and renders dynamic content in User and Shopkeeper panels without altering existing routes.

#### 3.2.9 Subscription & Membership Management
- Displays database-persisted subscription plan parameters: Plan Name, Price Amount, Validity Duration, PC Limit, Status, and Start/End Dates.
- Real-time enforcement of subscription validity against shopkeeper operations.
- Maintains separation between platform subscription plans and user-level VIP memberships with full transaction history retention.

## 4. Business Rules & Core Logic

### 4.1 Security & Authentication Rules
- Security passwords must be exactly 6 numeric digits (0-9).
- Super Admin email OTP must have a defined expiration window and a maximum limit of failed attempts before temporary lockout.
- Passwords and OTP tokens must be validated strictly on the backend; plaintext passwords must never be stored, transmitted, or returned in API responses.

### 4.2 Shopkeeper Account & Subscription Lifecycle
- When a shopkeeper status is set to Inactive/Disabled, login sessions are invalidated immediately, and future login attempts display an account disabled message.
- When a shop subscription expires or is invalidated, shopkeeper functionality is locked according to subscription rules, but past records, print logs, and payout histories must never be deleted.
- Access is automatically restored once both account status and subscription validity are active.

### 4.3 Data Isolation & Filtering
- Shopkeeper panels are strictly isolated to their own shop ID data.
- Super Admin filters execute database queries matching selected criteria (date ranges, multi-shop IDs, status, payment modes) without returning unauthorized or unselected datasets.

## 5. Exceptions & Boundary Cases

| Scenario | Condition | System Behavior |
| :--- | :--- | :--- |
| Invalid Security Password | User enters incorrect 6-digit password on protected page | Reject access, increment failure count, and display error message |
| Expired OTP Submission | Super Admin submits OTP after expiration period | Deny verification, notify expiry, and require requesting a new OTP |
| Maximum OTP Attempts Exceeded | More than allowed failed OTP attempts entered | Lock OTP verification temporarily and invalidate current token |
| Disabled Shopkeeper Login | Shopkeeper with Inactive status attempts authentication | Block login and display explicit account disabled message |
| Missing Security Password Configuration | Super Admin accesses protected section when no password is set | Permit direct access without displaying the verification popup |
| Unsanitized CMS Content | Admin submits rich text containing unsafe tags | Sanitize content on backend before database persistence |

## 6. Acceptance Criteria

1. The left sidebar and top navbar remain fixed while the sidebar menu scrolls independently and main content scrolls normally across admin views.
2. The Shopkeeper Details page displays only the Overview and Payments & Limits tabs, with the shop QR centered in a dedicated container.
3. Credentials in Shopkeeper Details are masked by default and require entering the correct 6-digit password to reveal.
4. System Settings provides three 6-digit security password cards (Shopkeeper Credential View, Settlement & Payout, Payment Methods) requiring email OTP verification for creation/modification.
5. Settlement & Payout and Payment Methods pages display a blurred state with a 6-digit password verification modal if a password is configured.
6. Database filters for Date (Today, Yesterday, Last 7/30 Days, Custom), Shopkeeper/Multi-Shop, Status, and Payment Mode function correctly across all designated modules.
7. Super Admin can create, edit, reorder, and activate/deactivate ads for User Panel Home and Upload placements.
8. Super Admin can edit and publish CMS pages using the rich-text editor, and updated content displays dynamically in User and Shopkeeper panels.
9. Disabled shopkeeper accounts and invalid subscriptions are prevented from logging in while retaining full historical data.

## 7. Out of Scope (Non-MVP)
- Automated direct bank disbursement integration (manual payout recording is maintained).
- Third-party SSO authentication providers for Shopkeeper login.
- Native mobile push notification dispatch systems.