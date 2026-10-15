export type PaymentMethodConfig = 'counter' | 'razorpay' | 'both';
export type ShopStatus = 'active' | 'inactive';
export type PCRequestStatus = 'pending' | 'approved' | 'rejected';
export type SettlementStatus = 'pending' | 'completed';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface PrintShop {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  address: string;
  terminal_code: string;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  total_reviews?: number | null;
  is_open: boolean;
  status: ShopStatus;
  payment_method_config: PaymentMethodConfig;
  pc_limit: number;
  qr_code_data?: string | null;
  bank_account_no?: string | null;
  bank_ifsc?: string | null;
  upi_id?: string | null;
  membership_enabled?: boolean;
  membership_price?: number;
  membership_validity_days?: number;
  services?: string[] | null;
  logo_url?: string | null;
  banner_url?: string | null;
  created_at: string;
}

export interface ShopkeeperAccount {
  id: string;
  shop_id: string;
  email: string;
  password_hash: string;
  owner_name: string;
  phone?: string | null;
  role: string;
  created_at: string;
}

export interface ShopQR {
  id: string;
  shop_id: string;
  qr_name: string;
  shop_code: string;
  qr_data: string;
  target_url: string;
  is_active: boolean;
  scan_count: number;
  created_at: string;
}

export interface ShopPC {
  id: string;
  shop_id: string;
  pc_name: string;
  pc_code: string;
  is_default: boolean;
  status: string;
  ip_address: string;
  last_heartbeat?: string;
  os_info?: string;
  agent_version?: string;
  created_at: string;
}

export interface ShopPCRequest {
  id: string;
  shop_id: string;
  shop_name: string;
  current_pc_limit: number;
  requested_pcs: number;
  reason?: string | null;
  additional_charges: number;
  payment_status: string;
  status: PCRequestStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  price: number;
  duration_days: number;
  pc_limit: number;
  features: string[];
  services: string[];
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopSubscription {
  id: string;
  shop_id: string;
  plan_id: string;
  plan_name: string;
  price: number;
  pc_limit: number;
  validity_days: number;
  start_date: string;
  expiry_date: string;
  status: string;
  auto_renew: boolean;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  user_id: string;
  shop_id: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  amount: number;
  currency: string;
  payment_method: 'online' | 'counter';
  payment_status: 'completed' | 'pending' | 'failed';
  created_at: string;
  shop_name?: string;
}

export interface ShopSettlement {
  id: string;
  shop_id: string;
  shop_name: string;
  total_orders: number;
  gross_amount: number;
  platform_commission: number;
  net_payable: number;
  settlement_cycle: string;
  cycle_start_date: string;
  cycle_end_date: string;
  status: SettlementStatus;
  bank_account_no?: string | null;
  bank_ifsc?: string | null;
  paid_at?: string | null;
  payout_reference?: string | null;
  rejection_reason?: string | null;
  payment_mode?: string | null;
  created_at: string;
}

export interface PrintOrder {
  id: string;
  order_number: string;
  user_id: string;
  shop_id: string;
  shop_name: string;
  token_number: string;
  document_name: string;
  file_type: string;
  total_pages: number;
  config_copies: number;
  config_color: string;
  config_duplex: string;
  config_paper_size: string;
  total_price: number;
  payment_mode: string;
  payment_status: string;
  status: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  surname?: string | null;
  email: string;
  phone: string;
  address?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserMembership {
  id: string;
  user_id: string;
  tier: string;
  card_number: string;
  discount_percentage: number;
  is_active: boolean;
  valid_until: string;
  shop_id: string;
  user_name: string;
  user_phone?: string | null;
  user_email?: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  shop_id: string;
  shop_name: string;
  category: string;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_response?: string | null;
  attachment_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  requirements: string;
  is_active: boolean;
  created_at: string;
}

export interface CareerApplication {
  id: string;
  career_id: string;
  user_id?: string | null;
  applicant_name: string;
  email: string;
  phone: string;
  portfolio_url?: string | null;
  resume_filename?: string | null;
  cover_note?: string | null;
  status: string;
  created_at: string;
  career_title?: string;
}

export interface HomeBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url: string;
  button_text?: string | null;
  button_link?: string | null;
  destination_url?: string | null;
  display_order: number;
  sort_order?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UploadPageAd {
  id: string;
  title: string;
  description?: string | null;
  image_url: string;
  destination_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlatformPolicy {
  id: string;
  title: string;
  content: string;
  version: string;
  published_at?: string | null;
  is_active: boolean;
}

export interface PlatformTerms {
  id: string;
  title: string;
  content: string;
  version: string;
  published_at?: string | null;
  is_active: boolean;
}

export interface CMSContent {
  id: string;
  category: 'about_us' | 'banner' | 'announcement' | 'notice' | 'faq' | 'app_config' | 'terms_and_conditions' | 'privacy_policy' | string;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  target_audience: 'all' | 'user' | 'shopkeeper' | string;
  badge_text?: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SuperAdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  preferred_theme?: 'white_red' | 'white_blue' | string;
  theme_mode?: 'light' | 'dark' | string;
  last_login_at?: string | null;
}

export type SecurityPasswordType = 'credential_view' | 'settlement_payout' | 'payment_methods';

export interface SecurityPasswordConfig {
  id: SecurityPasswordType;
  password_type: SecurityPasswordType;
  is_configured: boolean;
  updated_at: string;
}

export interface AdminOTP {
  id: string;
  email: string;
  otp_code: string;
  purpose: string;
  expires_at: string;
  is_used: boolean;
  attempts: number;
  created_at: string;
}

export type AdPlacement = 'home_hero' | 'upload_page';


export interface PlatformSettings {
  id: string;
  commission_rate: number;
  razorpay_enabled: boolean;
  pay_on_counter_enabled: boolean;
  payu_enabled: boolean;
  payout_cycle_days: number;
  min_payout_amount: number;
  maintenance_mode?: boolean;
  new_shop_registrations_open?: boolean;
  auto_settlement_enabled?: boolean;
  vip_discount_system_active?: boolean;
  ad_sponsorship_slots_open?: boolean;
  live_file_upload_enabled?: boolean;
  updated_at?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string | null;
  image_url: string;
  target_url?: string | null;
  placement: AdPlacement;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface InformationalPage {
  id: string;
  slug: string;
  title: string;
  meta_description?: string;
  content: string;
  content_html?: string;
  is_published: boolean;
  last_published_at?: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export interface AdRequest {
  id: string;
  business_name: string;
  contact_person: string;
  email: string;
  phone: string;
  ad_type: string;
  budget?: string | null;
  message: string;
  status: string;
  created_at: string;
}

export interface DailyPaymentBreakdown {
  date: string;
  displayDate: string;
  upi: number;
  online: number;
  counter: number;
  total: number;
}

export interface OverallPlatformStats {
  totalUsers: number;
  totalConnectedShops: number;
  activeShops: number;
  inactiveShops: number;
  totalShopkeepers: number;
  totalVIPUsers: number;
  totalPrints: number;
  totalOrders: number;
  totalRevenue: number;
  onlinePaymentsAmount: number;
  counterPaymentsAmount: number;
  upiPaymentsAmount: number;
  pendingSettlementsCount: number;
  pendingSettlementsAmount: number;
  completedSettlementsCount: number;
  completedSettlementsAmount: number;
  dailyRevenueBreakdown: DailyPaymentBreakdown[];
  shopRevenueList: {
    shopId: string;
    shopName: string;
    terminalCode: string;
    totalOrders: number;
    onlineRevenue: number;
    counterRevenue: number;
    totalRevenue: number;
    pendingPayout: number;
    pcLimit: number;
    status: ShopStatus;
  }[];
}
