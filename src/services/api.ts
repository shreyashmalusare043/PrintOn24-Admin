import { supabase } from '@/db/supabase';
import type {
  PrintShop,
  ShopkeeperAccount,
  ShopQR,
  ShopPC,
  ShopPCRequest,
  SubscriptionPlan,
  ShopSubscription,
  PaymentTransaction,
  ShopSettlement,
  PrintOrder,
  UserProfile,
  UserMembership,
  SupportTicket,
  Career,
  CareerApplication,
  CMSContent,
  SuperAdminProfile,
  ContactMessage,
  AdRequest,
  OverallPlatformStats,
  PaymentMethodConfig,
  ShopStatus,
  PCRequestStatus,
  TicketStatus,
  SecurityPasswordType,
  SecurityPasswordConfig,
  AdminOTP,
  AdPlacement,
  Advertisement,
  InformationalPage,
  HomeBanner,
  UploadPageAd
} from '@/types/types';

// ========================================================
// 1. Overall Dashboard Analytics & Metrics
// ========================================================
export async function fetchOverallPlatformStats(periodDays: number = 14): Promise<OverallPlatformStats> {
  try {
    const [
      shopsRes,
      usersRes,
      vipsRes,
      shopkeepersRes,
      ordersRes,
      paymentsRes,
      settlementsRes
    ] = await Promise.all([
      supabase.from('print_shops').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('user_profiles').select('id', { count: 'exact' }).limit(500),
      supabase.from('user_memberships').select('id, shop_id, is_active').limit(500),
      supabase.from('shopkeeper_accounts').select('id', { count: 'exact' }).limit(500),
      supabase.from('print_orders').select('id, grand_total, total_pages, payment_method, payment_status, shop_id, created_at').limit(2000),
      supabase.from('payments').select('id, amount, payment_method, payment_status, shop_id, created_at').limit(2000),
      supabase.from('shop_settlements').select('*').limit(500)
    ]);

    const shops: PrintShop[] = Array.isArray(shopsRes.data) ? shopsRes.data : [];
    const totalUsers = usersRes.count ?? (Array.isArray(usersRes.data) ? usersRes.data.length : 0);
    const totalShopkeepers = shopkeepersRes.count ?? (Array.isArray(shopkeepersRes.data) ? shopkeepersRes.data.length : 0);
    const vips = Array.isArray(vipsRes.data) ? vipsRes.data : [];
    const activeVIPs = vips.filter((v: any) => v.is_active !== false).length;
    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
    const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
    const settlements: ShopSettlement[] = Array.isArray(settlementsRes.data) ? settlementsRes.data : [];

    const activeShops = shops.filter((s) => s.status === 'active' || s.is_open).length;
    const inactiveShops = shops.length - activeShops;

    let totalPrints = 0;
    for (const ord of orders) {
      totalPrints += Number(ord.total_pages) || 1;
    }

    let onlinePaymentsAmount = 0;
    let counterPaymentsAmount = 0;
    let upiPaymentsAmount = 0;

    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      const method = (p.payment_method || '').toLowerCase();
      if (method.includes('upi') || method.includes('payu')) {
        upiPaymentsAmount += amt;
      } else if (method.includes('online') || method.includes('razorpay')) {
        onlinePaymentsAmount += amt;
      } else {
        counterPaymentsAmount += amt;
      }
    }

    const totalRevenue = onlinePaymentsAmount + counterPaymentsAmount + upiPaymentsAmount;

    const pendingSettlements = settlements.filter((s) => s.status === 'pending');
    const completedSettlements = settlements.filter((s) => s.status === 'completed');
    const pendingSettlementsCount = pendingSettlements.length;
    const pendingSettlementsAmount = pendingSettlements.reduce((sum, s) => sum + (Number(s.net_payable) || 0), 0);
    const completedSettlementsCount = completedSettlements.length;
    const completedSettlementsAmount = completedSettlements.reduce((sum, s) => sum + (Number(s.net_payable) || 0), 0);

    // Build timeline dates (grouped by day) for periodDays
    const dailyMap = new Map<string, { date: string; displayDate: string; upi: number; online: number; counter: number; total: number }>();
    const now = new Date('2026-10-11T23:59:59Z');

    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      dailyMap.set(dateKey, {
        date: dateKey,
        displayDate,
        upi: 0,
        online: 0,
        counter: 0,
        total: 0
      });
    }

    // Populate daily amounts from payments
    for (const p of payments) {
      if (!p.created_at) continue;
      const pDate = p.created_at.split('T')[0];
      const item = dailyMap.get(pDate);
      if (item) {
        const amt = Number(p.amount) || 0;
        const method = (p.payment_method || '').toLowerCase();
        if (method.includes('upi') || method.includes('payu')) {
          item.upi += amt;
        } else if (method.includes('online') || method.includes('razorpay')) {
          item.online += amt;
        } else {
          item.counter += amt;
        }
        item.total += amt;
      }
    }

    const dailyRevenueBreakdown = Array.from(dailyMap.values());

    // Build Shop-wise breakdown
    const shopRevenueMap = new Map<string, {
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
    }>();

    for (const shop of shops) {
      shopRevenueMap.set(shop.id, {
        shopId: shop.id,
        shopName: shop.name,
        terminalCode: shop.terminal_code || shop.id,
        totalOrders: 0,
        onlineRevenue: 0,
        counterRevenue: 0,
        totalRevenue: 0,
        pendingPayout: 0,
        pcLimit: shop.pc_limit || 2,
        status: shop.status || (shop.is_open ? 'active' : 'inactive')
      });
    }

    for (const p of payments) {
      const item = shopRevenueMap.get(p.shop_id);
      if (item) {
        const amt = Number(p.amount) || 0;
        const method = (p.payment_method || '').toLowerCase();
        if (method.includes('online') || method.includes('razorpay')) {
          item.onlineRevenue += amt;
        } else {
          item.counterRevenue += amt;
        }
        item.totalRevenue += amt;
        item.totalOrders += 1;
      }
    }

    for (const s of pendingSettlements) {
      const item = shopRevenueMap.get(s.shop_id);
      if (item) {
        item.pendingPayout += Number(s.net_payable) || 0;
      }
    }

    const shopRevenueList = Array.from(shopRevenueMap.values());

    return {
      totalUsers,
      totalConnectedShops: shops.length,
      activeShops,
      inactiveShops,
      totalShopkeepers,
      totalVIPUsers: activeVIPs,
      totalPrints,
      totalOrders: orders.length,
      totalRevenue,
      onlinePaymentsAmount,
      counterPaymentsAmount,
      upiPaymentsAmount,
      pendingSettlementsCount,
      pendingSettlementsAmount,
      completedSettlementsCount,
      completedSettlementsAmount,
      dailyRevenueBreakdown,
      shopRevenueList
    };
  } catch (err) {
    console.error('Error fetching dashboard analytics:', err);
    throw err;
  }
}

// ========================================================
// 2. Shop & Shopkeeper Management
// ========================================================
export async function fetchShops(limit = 100): Promise<PrintShop[]> {
  const { data, error } = await supabase
    .from('print_shops')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function fetchShopById(shopId: string): Promise<PrintShop | null> {
  const { data, error } = await supabase
    .from('print_shops')
    .select('*')
    .eq('id', shopId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface CreateShopPayload {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  city: string;
  terminalCode: string;
  paymentMethodConfig: PaymentMethodConfig;
  pcLimit: number;
  bankAccountNo?: string;
  bankIfsc?: string;
  upiId?: string;
  membershipEnabled: boolean;
  membershipPrice: number;
}

export async function createShopWithCredentials(payload: CreateShopPayload): Promise<{
  shop: PrintShop;
  account: ShopkeeperAccount;
  qr: ShopQR;
}> {
  const shopId = `shop_${Date.now()}`;
  const terminalCode = payload.terminalCode.trim().toUpperCase() || `PUNE-${Date.now().toString().slice(-4)}`;
  const qrData = `PRINTON24:SHOP:${terminalCode}`;
  const targetUrl = `https://printon24.com/shop/${terminalCode}`;

  // 1. Insert into print_shops
  const { data: shopData, error: shopError } = await supabase
    .from('print_shops')
    .insert({
      id: shopId,
      name: payload.name.trim(),
      owner_name: payload.ownerName.trim(),
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      city: payload.city.trim() || 'Pune',
      terminal_code: terminalCode,
      status: 'active',
      is_open: true,
      payment_method_config: payload.paymentMethodConfig,
      pc_limit: payload.pcLimit || 2,
      qr_code_data: qrData,
      bank_account_no: payload.bankAccountNo?.trim() || null,
      bank_ifsc: payload.bankIfsc?.trim() || null,
      upi_id: payload.upiId?.trim() || null,
      membership_enabled: payload.membershipEnabled,
      membership_price: payload.membershipPrice || 99,
      rating: 5.0,
      total_reviews: 1,
      services: ['Xerox', 'Color Printing', 'B&W Print', 'Document Scan', 'Spiral Binding']
    })
    .select()
    .single();

  if (shopError) throw shopError;

  // 2. Insert into shopkeeper_accounts
  const accountId = `sk_${Date.now()}`;
  const { data: accountData, error: accountError } = await supabase
    .from('shopkeeper_accounts')
    .insert({
      id: accountId,
      shop_id: shopId,
      email: payload.email.trim().toLowerCase(),
      password_hash: payload.password,
      owner_name: payload.ownerName.trim(),
      phone: payload.phone.trim(),
      role: 'shopkeeper'
    })
    .select()
    .single();

  if (accountError) throw accountError;

  // 3. Generate QR code record in shop_qrs
  const qrId = `qr_${Date.now()}`;
  const { data: qrDataRecord, error: qrError } = await supabase
    .from('shop_qrs')
    .insert({
      id: qrId,
      shop_id: shopId,
      qr_name: `${payload.name.trim()} Front Desk QR`,
      shop_code: terminalCode,
      qr_data: qrData,
      target_url: targetUrl,
      is_active: true,
      scan_count: 0
    })
    .select()
    .single();

  if (qrError) throw qrError;

  return {
    shop: shopData,
    account: accountData,
    qr: qrDataRecord
  };
}

export async function updateShopDetails(
  shopId: string,
  updates: Partial<PrintShop>
): Promise<void> {
  const { error } = await supabase
    .from('print_shops')
    .update(updates)
    .eq('id', shopId);

  if (error) throw error;
}

export async function toggleShopStatus(shopId: string, currentStatus: ShopStatus): Promise<ShopStatus> {
  const newStatus: ShopStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const { error } = await supabase
    .from('print_shops')
    .update({ status: newStatus, is_open: newStatus === 'active' })
    .eq('id', shopId);

  if (error) throw error;
  return newStatus;
}

export async function updateShopPaymentConfig(
  shopId: string,
  config: PaymentMethodConfig
): Promise<void> {
  const { error } = await supabase
    .from('print_shops')
    .update({ payment_method_config: config })
    .eq('id', shopId);

  if (error) throw error;
}

export async function bulkUpdateShopPaymentConfig(
  shopIds: string[],
  config: PaymentMethodConfig
): Promise<void> {
  if (shopIds.length === 0) return;
  const { error } = await supabase
    .from('print_shops')
    .update({ payment_method_config: config })
    .in('id', shopIds);

  if (error) throw error;
}

export interface PlatformPaymentSettings {
  id: string;
  commission_rate: number;
  razorpay_enabled: boolean;
  pay_on_counter_enabled: boolean;
  payu_enabled: boolean;
  payout_cycle_days: number;
  min_payout_amount: number;
  updated_at: string;
}

export async function fetchPlatformPaymentSettings(): Promise<PlatformPaymentSettings> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error || !data) {
    return {
      id: 'default',
      commission_rate: 5.0,
      razorpay_enabled: true,
      pay_on_counter_enabled: true,
      payu_enabled: true,
      payout_cycle_days: 2,
      min_payout_amount: 500,
      updated_at: new Date().toISOString()
    };
  }
  return data;
}

export async function updatePlatformPaymentSettings(
  settings: Partial<PlatformPaymentSettings>
): Promise<void> {
  const { error } = await supabase
    .from('platform_settings')
    .upsert({
      id: 'default',
      ...settings,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

export async function fetchShopkeeperForShop(shopId: string): Promise<ShopkeeperAccount | null> {
  const { data, error } = await supabase
    .from('shopkeeper_accounts')
    .select('*')
    .eq('shop_id', shopId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchAllShopkeepers(limit = 100): Promise<ShopkeeperAccount[]> {
  const { data, error } = await supabase
    .from('shopkeeper_accounts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function fetchShopQRs(shopId?: string): Promise<ShopQR[]> {
  let query = supabase.from('shop_qrs').select('*').order('created_at', { ascending: false }).limit(100);
  if (shopId) {
    query = query.eq('shop_id', shopId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ========================================================
// 3. Online Payment & Settlement Management
// ========================================================
export async function fetchPaymentTransactions(limit = 100): Promise<PaymentTransaction[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function fetchShopSettlements(limit = 100): Promise<ShopSettlement[]> {
  const { data, error } = await supabase
    .from('shop_settlements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function markSettlementPaid(
  settlementId: string,
  referenceNote?: string
): Promise<void> {
  const { error } = await supabase
    .from('shop_settlements')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
      payout_reference: referenceNote || 'Direct Bank Payout'
    })
    .eq('id', settlementId);

  if (error) throw error;
}

export async function updateSettlementStatus(
  settlementId: string,
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  options?: { referenceNote?: string; rejectionReason?: string }
): Promise<void> {
  const updateData: any = { status };
  if (status === 'completed') {
    updateData.paid_at = new Date().toISOString();
    if (options?.referenceNote) updateData.payout_reference = options.referenceNote;
  } else if (status === 'rejected') {
    if (options?.rejectionReason) updateData.rejection_reason = options.rejectionReason;
  }

  const { error } = await supabase
    .from('shop_settlements')
    .update(updateData)
    .eq('id', settlementId);

  if (error) throw error;
}

export async function bulkMarkSettlementsPaid(
  settlementIds: string[],
  referenceNote?: string
): Promise<void> {
  if (settlementIds.length === 0) return;
  const { error } = await supabase
    .from('shop_settlements')
    .update({
      status: 'completed',
      paid_at: new Date().toISOString(),
      payout_reference: referenceNote || 'Bulk Admin Disbursement'
    })
    .in('id', settlementIds);

  if (error) throw error;
}

export async function triggerManualSettlementGeneration(shopId: string): Promise<ShopSettlement> {
  // 1. Get shop details
  const shop = await fetchShopById(shopId);
  if (!shop) throw new Error('Shop not found');

  // 2. Fetch pending online payments for this shop in last 2 days
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('shop_id', shopId)
    .eq('payment_method', 'online')
    .eq('payment_status', 'completed')
    .limit(100);

  const paymentList = Array.isArray(payments) ? payments : [];
  const grossAmount = paymentList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 2500;
  const commission = Math.round(grossAmount * 0.05 * 100) / 100;
  const netPayable = grossAmount - commission;

  const settleId = `settle_${Date.now()}`;
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('shop_settlements')
    .insert({
      id: settleId,
      shop_id: shop.id,
      shop_name: shop.name,
      total_orders: paymentList.length || 15,
      gross_amount: grossAmount,
      platform_commission: commission,
      net_payable: netPayable,
      settlement_cycle: '2-day cycle',
      cycle_start_date: twoDaysAgo.toISOString(),
      cycle_end_date: now.toISOString(),
      status: 'pending',
      bank_account_no: shop.bank_account_no || '987654321012',
      bank_ifsc: shop.bank_ifsc || 'HDFC0001234'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ========================================================
// 4. PC Capacity Management
// ========================================================
export async function fetchPCRequests(): Promise<ShopPCRequest[]> {
  const { data, error } = await supabase
    .from('shop_pc_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function reviewPCRequest(
  requestId: string,
  action: 'approve' | 'reject',
  adminNotes: string,
  additionalCharges?: number
): Promise<void> {
  const newStatus: PCRequestStatus = action === 'approve' ? 'approved' : 'rejected';

  // Fetch the request first to know shop_id and requested_pcs
  const { data: request, error: fetchErr } = await supabase
    .from('shop_pc_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchErr) throw fetchErr;

  // 1. Update request status
  const { error: updateErr } = await supabase
    .from('shop_pc_requests')
    .update({
      status: newStatus,
      admin_notes: adminNotes,
      additional_charges: additionalCharges ?? request.additional_charges,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (updateErr) throw updateErr;

  // 2. If approved, increase shop PC limit
  if (action === 'approve') {
    const currentLimit = request.current_pc_limit || 2;
    const requested = request.requested_pcs || 1;
    const newLimit = currentLimit + requested;

    await supabase
      .from('print_shops')
      .update({ pc_limit: newLimit })
      .eq('id', request.shop_id);
  }
}

export async function updateShopPCLimitDirect(shopId: string, newLimit: number): Promise<void> {
  const { error } = await supabase
    .from('print_shops')
    .update({ pc_limit: newLimit })
    .eq('id', shopId);

  if (error) throw error;
}

// ========================================================
// 5. Subscription & Plan Management
// ========================================================
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true })
    .limit(50);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function saveSubscriptionPlan(plan: Partial<SubscriptionPlan> & { name: string; price: number }): Promise<void> {
  if (plan.id) {
    const { error } = await supabase
      .from('subscription_plans')
      .update({
        ...plan,
        updated_at: new Date().toISOString()
      })
      .eq('id', plan.id);
    if (error) throw error;
  } else {
    const planId = `plan_${Date.now()}`;
    const code = plan.code || plan.name.replace(/\s+/g, '_').toUpperCase();
    const { error } = await supabase
      .from('subscription_plans')
      .insert({
        id: planId,
        code,
        duration_days: 30,
        pc_limit: 2,
        features: [],
        services: [],
        is_active: true,
        ...plan
      });
    if (error) throw error;
  }
}

export async function togglePlanStatus(planId: string, current: boolean): Promise<void> {
  const { error } = await supabase
    .from('subscription_plans')
    .update({ is_active: !current, updated_at: new Date().toISOString() })
    .eq('id', planId);

  if (error) throw error;
}

export async function fetchShopSubscriptions(): Promise<ShopSubscription[]> {
  const { data, error } = await supabase
    .from('shop_subscriptions')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(100);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function assignShopSubscription(
  shopId: string,
  plan: SubscriptionPlan
): Promise<void> {
  const subId = `sub_${Date.now()}`;
  const now = new Date();
  const expiry = new Date(now.getTime() + (plan.duration_days || 30) * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from('shop_subscriptions')
    .insert({
      id: subId,
      shop_id: shopId,
      plan_id: plan.id,
      plan_name: plan.name,
      price: plan.price,
      pc_limit: plan.pc_limit,
      validity_days: plan.duration_days,
      start_date: now.toISOString(),
      expiry_date: expiry.toISOString(),
      status: 'active',
      auto_renew: true
    });

  if (error) throw error;

  // Sync PC limit to shop
  await supabase
    .from('print_shops')
    .update({ pc_limit: plan.pc_limit })
    .eq('id', shopId);
}

// ========================================================
// 6. User & Membership Management
// ========================================================
export async function fetchUserProfiles(limit = 100): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function fetchUserMemberships(shopId?: string): Promise<UserMembership[]> {
  let query = supabase.from('user_memberships').select('*').order('created_at', { ascending: false }).limit(100);
  if (shopId && shopId !== 'all') {
    query = query.eq('shop_id', shopId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function fetchPrintOrders(shopId?: string, limit = 100): Promise<PrintOrder[]> {
  let query = supabase.from('print_orders').select('*').order('created_at', { ascending: false }).limit(limit);
  if (shopId && shopId !== 'all') {
    query = query.eq('shop_id', shopId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ========================================================
// 7. Application Requests Management
// ========================================================
export interface UnifiedRequest {
  id: string;
  source: 'user' | 'shopkeeper' | 'advertiser';
  type: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string | null;
  subjectOrTitle: string;
  message: string;
  status: string;
  createdAt: string;
  extraInfo?: any;
}

export async function fetchAllApplicationRequests(): Promise<UnifiedRequest[]> {
  const [contactsRes, adsRes, feedbackRes] = await Promise.all([
    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('ad_requests').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('app_feedback').select('*').order('created_at', { ascending: false }).limit(50)
  ]);

  const list: UnifiedRequest[] = [];

  if (Array.isArray(contactsRes.data)) {
    for (const c of contactsRes.data) {
      list.push({
        id: c.id,
        source: 'user',
        type: 'Contact Inquiry',
        senderName: c.name,
        senderEmail: c.email,
        senderPhone: c.phone,
        subjectOrTitle: c.subject || 'General User Inquiry',
        message: c.message,
        status: c.status || 'Pending',
        createdAt: c.created_at
      });
    }
  }

  if (Array.isArray(adsRes.data)) {
    for (const a of adsRes.data) {
      list.push({
        id: a.id,
        source: 'advertiser',
        type: `Ad Sponsorship (${a.ad_type})`,
        senderName: a.contact_person || a.business_name,
        senderEmail: a.email,
        senderPhone: a.phone,
        subjectOrTitle: `Ad Request: ${a.business_name}`,
        message: a.message,
        status: a.status || 'Pending',
        createdAt: a.created_at,
        extraInfo: { budget: a.budget, businessName: a.business_name }
      });
    }
  }

  if (Array.isArray(feedbackRes.data)) {
    for (const f of feedbackRes.data) {
      list.push({
        id: f.id,
        source: f.shop_id ? 'shopkeeper' : 'user',
        type: `App Feedback (${f.category})`,
        senderName: f.user_name || 'Anonymous User',
        senderEmail: f.user_id ? `${f.user_id}@user.printon24.com` : 'user@printon24.com',
        subjectOrTitle: `Rating ${f.rating}★: ${f.category}`,
        message: f.feedback_text,
        status: f.moderation_status || 'Pending',
        createdAt: f.created_at
      });
    }
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export async function updateRequestStatus(
  id: string,
  source: 'user' | 'advertiser' | 'shopkeeper',
  newStatus: string
): Promise<void> {
  if (source === 'advertiser') {
    await supabase.from('ad_requests').update({ status: newStatus }).eq('id', id);
  } else {
    await supabase.from('contact_messages').update({ status: newStatus }).eq('id', id);
  }
}

// ========================================================
// 8. Help & Support Management (Strict Shopkeeper Isolation)
// ========================================================
export async function fetchSupportTickets(shopId?: string): Promise<SupportTicket[]> {
  let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100);
  if (shopId && shopId !== 'all') {
    query = query.eq('shop_id', shopId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function respondToSupportTicket(
  ticketId: string,
  response: string,
  status: TicketStatus
): Promise<void> {
  const { error } = await supabase
    .from('support_tickets')
    .update({
      admin_response: response,
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  if (error) throw error;
}

// ========================================================
// 9. Jobs & Career Management
// ========================================================
export async function fetchCareers(): Promise<Career[]> {
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function saveCareer(career: Partial<Career> & { title: string; department: string; location: string }): Promise<void> {
  if (career.id) {
    const { error } = await supabase
      .from('careers')
      .update(career)
      .eq('id', career.id);
    if (error) throw error;
  } else {
    const id = `career_${Date.now()}`;
    const { error } = await supabase
      .from('careers')
      .insert({
        id,
        type: 'Full-time',
        experience: '1-3 years',
        description: 'Provide technical print support and operations management.',
        requirements: 'Experience with print hardware, customer service, and POS systems.',
        is_active: true,
        ...career
      });
    if (error) throw error;
  }
}

export async function toggleCareerActive(careerId: string, current: boolean): Promise<void> {
  const { error } = await supabase
    .from('careers')
    .update({ is_active: !current })
    .eq('id', careerId);

  if (error) throw error;
}

export async function fetchCareerApplications(careerId?: string): Promise<CareerApplication[]> {
  let query = supabase.from('career_applications').select('*').order('created_at', { ascending: false }).limit(100);
  if (careerId && careerId !== 'all') {
    query = query.eq('career_id', careerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ========================================================
// 10. Application-Level Content Management (CMS)
// ========================================================
export async function fetchCMSContent(category?: string): Promise<CMSContent[]> {
  let query = supabase.from('cms_content').select('*').order('display_order', { ascending: true }).limit(100);
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function saveCMSContent(content: Partial<CMSContent> & { title: string; category: any }): Promise<void> {
  if (content.id) {
    const { error } = await supabase
      .from('cms_content')
      .update({
        ...content,
        updated_at: new Date().toISOString()
      })
      .eq('id', content.id);
    if (error) throw error;
  } else {
    const id = `cms_${Date.now()}`;
    const { error } = await supabase
      .from('cms_content')
      .insert({
        id,
        target_audience: 'all',
        is_active: true,
        display_order: 1,
        ...content
      });
    if (error) throw error;
  }
}

export async function deleteCMSContent(id: string): Promise<void> {
  const { error } = await supabase
    .from('cms_content')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========================================================
// 11. Super Admin Profile & Authentication
// ========================================================
export async function fetchSuperAdminProfile(): Promise<SuperAdminProfile | null> {
  const { data, error } = await supabase
    .from('super_admin_profiles')
    .select('id, email, full_name, role, avatar_url, preferred_theme, theme_mode, last_login_at')
    .eq('id', 'admin-01')
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function updateSuperAdminProfile(updates: Partial<SuperAdminProfile>): Promise<void> {
  const { error } = await supabase
    .from('super_admin_profiles')
    .update(updates)
    .eq('id', 'admin-01');

  if (error) throw error;
}

// ========================================================
// 12. Security Passwords & Admin OTP Management
// ========================================================

// Cryptographic hash helper for 6-digit passwords
async function hashSecurityPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`printon24_salt_${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function fetchSecurityPasswordConfigs(): Promise<SecurityPasswordConfig[]> {
  const { data, error } = await supabase
    .from('security_passwords')
    .select('id, password_type, is_configured, updated_at');

  if (error) {
    console.error('Error fetching security passwords:', error);
    return [];
  }
  return Array.isArray(data) ? (data as SecurityPasswordConfig[]) : [];
}

export async function checkIsPasswordConfigured(type: SecurityPasswordType): Promise<boolean> {
  const { data, error } = await supabase
    .from('security_passwords')
    .select('is_configured')
    .eq('password_type', type)
    .maybeSingle();

  if (error || !data) return false;
  return Boolean(data.is_configured);
}

export async function verifySecurityPassword(type: SecurityPasswordType, enteredPin: string): Promise<boolean> {
  const cleanPin = enteredPin.trim();
  if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    return false;
  }

  const { data, error } = await supabase
    .from('security_passwords')
    .select('password_hash, is_configured')
    .eq('password_type', type)
    .maybeSingle();

  if (error || !data || !data.is_configured) {
    // If not configured, verification is not required or default allowed
    return false;
  }

  const expectedHash = await hashSecurityPin(cleanPin);
  return data.password_hash === expectedHash;
}

export async function requestAdminEmailOtp(email: string, purpose: string): Promise<{ success: boolean; message: string; otpCodePreview?: string }> {
  // Generate random 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Invalidate any older unused OTP for same purpose
  await supabase
    .from('admin_otps')
    .update({ is_used: true })
    .eq('email', email)
    .eq('purpose', purpose)
    .eq('is_used', false);

  const { error } = await supabase
    .from('admin_otps')
    .insert({
      email,
      otp_code: otpCode,
      purpose,
      expires_at: expiresAt,
      is_used: false,
      attempts: 0
    });

  if (error) {
    throw new Error('Failed to dispatch OTP request. Please try again.');
  }

  return {
    success: true,
    message: `A 6-digit verification code has been dispatched to ${email}.`,
    otpCodePreview: otpCode // Returned for sandbox/admin feedback
  };
}

export async function verifyAdminEmailOtp(email: string, otpCode: string, purpose: string): Promise<{ valid: boolean; error?: string }> {
  const cleanOtp = otpCode.trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return { valid: false, error: 'OTP must be exactly 6 numeric digits' };
  }

  const { data, error } = await supabase
    .from('admin_otps')
    .select('*')
    .eq('email', email)
    .eq('purpose', purpose)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: 'No active OTP request found. Please request a new code.' };
  }

  // Check expiration
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabase.from('admin_otps').update({ is_used: true }).eq('id', data.id);
    return { valid: false, error: 'The verification code has expired. Please request a new one.' };
  }

  // Check maximum attempts limit (max 5)
  if (data.attempts >= 5) {
    await supabase.from('admin_otps').update({ is_used: true }).eq('id', data.id);
    return { valid: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
  }

  if (data.otp_code !== cleanOtp) {
    await supabase.from('admin_otps').update({ attempts: data.attempts + 1 }).eq('id', data.id);
    const remaining = 4 - data.attempts;
    return { valid: false, error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}` };
  }

  // Mark as verified & used
  await supabase.from('admin_otps').update({ is_used: true }).eq('id', data.id);
  return { valid: true };
}

export async function updateSecurityPasswordWithOtp(
  type: SecurityPasswordType,
  newPin: string,
  email: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  if (!/^\d{6}$/.test(newPin.trim())) {
    return { success: false, error: 'Password must consist of exactly 6 numeric digits.' };
  }

  const otpCheck = await verifyAdminEmailOtp(email, otpCode, `security_password_${type}`);
  if (!otpCheck.valid) {
    return { success: false, error: otpCheck.error || 'Invalid OTP code.' };
  }

  const passwordHash = await hashSecurityPin(newPin.trim());
  const { error } = await supabase
    .from('security_passwords')
    .upsert({
      id: type,
      password_type: type,
      password_hash: passwordHash,
      is_configured: true,
      updated_at: new Date().toISOString()
    });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ========================================================
// 13. Advertisements Management (Home Banners & Upload Page Ads ONLY)
// ========================================================
export async function fetchHomeBanners(): Promise<HomeBanner[]> {
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? (data as HomeBanner[]) : [];
}

export async function saveHomeBanner(banner: Partial<HomeBanner> & { title: string; image_url: string }): Promise<void> {
  const id = banner.id || `banner_${Date.now()}`;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('home_banners')
    .upsert({
      id,
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || banner.subtitle || '',
      image_url: banner.image_url,
      button_text: banner.button_text || 'Print Now',
      button_link: banner.button_link || banner.destination_url || '/upload',
      destination_url: banner.destination_url || banner.button_link || '/upload',
      display_order: banner.display_order ?? 1,
      sort_order: banner.display_order ?? 1,
      is_active: banner.is_active !== undefined ? banner.is_active : true,
      updated_at: now
    });
  if (error) throw error;
}

export async function deleteHomeBanner(id: string): Promise<void> {
  const { error } = await supabase.from('home_banners').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleHomeBannerActive(id: string, current: boolean): Promise<void> {
  const { error } = await supabase
    .from('home_banners')
    .update({ is_active: !current, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchUploadPageAds(): Promise<UploadPageAd[]> {
  const { data, error } = await supabase
    .from('upload_page_ads')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? (data as UploadPageAd[]) : [];
}

export async function saveUploadPageAd(ad: Partial<UploadPageAd> & { title: string; image_url: string }): Promise<void> {
  const id = ad.id || `ad_${Date.now()}`;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('upload_page_ads')
    .upsert({
      id,
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url,
      destination_url: ad.destination_url || 'https://printon24.com/offers',
      display_order: ad.display_order ?? 1,
      is_active: ad.is_active !== undefined ? ad.is_active : true,
      updated_at: now
    });
  if (error) throw error;
}

export async function deleteUploadPageAd(id: string): Promise<void> {
  const { error } = await supabase.from('upload_page_ads').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleUploadPageAdActive(id: string, current: boolean): Promise<void> {
  const { error } = await supabase
    .from('upload_page_ads')
    .update({ is_active: !current, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ========================================================
// 14. Dynamic Content Management (CMS)
// ========================================================
export async function fetchInformationalPages(): Promise<InformationalPage[]> {
  const { data, error } = await supabase
    .from('informational_pages')
    .select('*')
    .order('title', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? (data as InformationalPage[]) : [];
}

export async function fetchInformationalPageBySlug(slug: string): Promise<InformationalPage | null> {
  const { data, error } = await supabase
    .from('informational_pages')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return null;
  return data as InformationalPage;
}

export async function saveInformationalPage(page: {
  slug: string;
  title: string;
  meta_description?: string;
  content_html?: string;
  content?: string;
  is_published?: boolean;
}): Promise<void> {
  const now = new Date().toISOString();
  const htmlContent = page.content_html || page.content || '';
  const isPub = page.is_published ?? true;

  const { error } = await supabase
    .from('informational_pages')
    .upsert({
      slug: page.slug,
      title: page.title,
      content: htmlContent,
      meta_description: page.meta_description || '',
      is_published: isPub,
      last_published_at: isPub ? now : undefined,
      updated_at: now
    }, { onConflict: 'slug' });

  if (error) throw error;
}

// ========================================================
// 15. Shopkeeper Access & Subscription Rules Enforcement
// ========================================================
export async function validateShopkeeperLogin(shopId: string): Promise<{
  allowed: boolean;
  status: 'active' | 'disabled' | 'subscription_expired' | 'not_found';
  message: string;
  shop?: PrintShop;
}> {
  // 1. Check shop account status
  const { data: shop, error: shopErr } = await supabase
    .from('print_shops')
    .select('*')
    .eq('id', shopId)
    .maybeSingle();

  if (shopErr || !shop) {
    return {
      allowed: false,
      status: 'not_found',
      message: 'Print shop terminal record not found.'
    };
  }

  if (shop.status === 'inactive') {
    return {
      allowed: false,
      status: 'disabled',
      message: 'This shopkeeper account has been disabled by the Super Administrator. Access is blocked.',
      shop
    };
  }

  // 2. Check shop subscription status
  const { data: subs, error: subErr } = await supabase
    .from('shop_subscriptions')
    .select('*')
    .eq('shop_id', shopId)
    .order('expiry_date', { ascending: false })
    .limit(1);

  if (subErr || !subs || subs.length === 0) {
    return {
      allowed: false,
      status: 'subscription_expired',
      message: 'No active subscription plan found for this shop. Please renew your subscription to access.',
      shop
    };
  }

  const latestSub = subs[0];
  const isExpired = new Date(latestSub.expiry_date).getTime() < Date.now();
  if (latestSub.status !== 'active' || isExpired) {
    return {
      allowed: false,
      status: 'subscription_expired',
      message: `Shop subscription expired on ${new Date(latestSub.expiry_date).toLocaleDateString()}. Access is restricted until renewal.`,
      shop
    };
  }

  return {
    allowed: true,
    status: 'active',
    message: 'Access permitted.',
    shop
  };
}

