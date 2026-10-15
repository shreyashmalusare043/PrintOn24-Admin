-- 1. Extend print_shops with required super admin fields
ALTER TABLE public.print_shops 
ADD COLUMN IF NOT EXISTS payment_method_config text DEFAULT 'both',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS pc_limit integer DEFAULT 2;

-- 2. Create PC capacity requests table
CREATE TABLE IF NOT EXISTS public.shop_pc_requests (
    id text PRIMARY KEY,
    shop_id text NOT NULL,
    shop_name text NOT NULL,
    current_pc_limit integer DEFAULT 2,
    requested_pcs integer DEFAULT 1,
    reason text,
    additional_charges numeric DEFAULT 500,
    payment_status text DEFAULT 'pending',
    status text DEFAULT 'pending', -- pending, approved, rejected
    admin_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create Subscription Plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id text PRIMARY KEY,
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    description text,
    price numeric NOT NULL,
    duration_days integer DEFAULT 30,
    pc_limit integer DEFAULT 2,
    features jsonb DEFAULT '[]'::jsonb,
    services jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    is_popular boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Create CMS Content table (Banners, Announcements, App Configs, FAQs)
CREATE TABLE IF NOT EXISTS public.cms_content (
    id text PRIMARY KEY,
    category text NOT NULL, -- 'banner', 'announcement', 'notice', 'faq', 'app_config'
    title text NOT NULL,
    subtitle text,
    content text,
    image_url text,
    link_url text,
    target_audience text DEFAULT 'all', -- 'all', 'user', 'shopkeeper'
    badge_text text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Create Super Admin Auth/Settings table
CREATE TABLE IF NOT EXISTS public.super_admin_profiles (
    id text PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    full_name text NOT NULL,
    role text DEFAULT 'super_admin',
    avatar_url text,
    preferred_theme text DEFAULT 'white_red', -- 'white_red' or 'white_blue'
    theme_mode text DEFAULT 'light', -- 'light' or 'dark'
    last_login_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 6. Insert Default Super Admin
INSERT INTO public.super_admin_profiles (id, email, password_hash, full_name, role, preferred_theme, theme_mode)
VALUES ('admin-01', 'admin@printon24.com', 'admin123', 'Super Administrator', 'super_admin', 'white_red', 'light')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Standard Subscription Plans
INSERT INTO public.subscription_plans (id, name, code, description, price, duration_days, pc_limit, features, services, is_active, is_popular)
VALUES 
('plan-starter', 'Starter Print Plan', 'STARTER', 'Ideal for neighborhood copy centers with single terminal setup.', 299, 30, 2, 
 '["Up to 2 PC Terminals", "Standard Web Dashboard", "Razorpay Online Payments", "QR Code Ordering", "Email Support"]'::jsonb,
 '["B&W Printing", "Color Printing", "Document Xerox"]'::jsonb, true, false),
('plan-pro', 'Pro Shop Plan', 'PRO', 'Best for high-volume campus printing centers and college reprography shops.', 599, 30, 4, 
 '["Up to 4 PC Terminals", "Priority Queue Routing", "Dual Payment Modes (Cash & Online)", "VIP Member Discounts", "Automated 2-Day Settlements", "Phone & Ticket Support"]'::jsonb,
 '["All Starter Services", "Spiral Binding", "Glossy Photo Printing", "Lamination", "Bulk Xerox"]'::jsonb, true, true),
('plan-enterprise', 'Enterprise Hub Plan', 'ENTERPRISE', 'Full platform access for commercial printing hubs and university libraries.', 1199, 30, 8, 
 '["Up to 8 PC Terminals", "Zero Platform Commission tier", "Custom QR Branding", "Dedicated Account Manager", "Live Print Job Telemetry", "24/7 Priority SLA"]'::jsonb,
 '["All Pro Services", "Architectural Blueprints", "Canvas Prints", "Custom Merchandise", "Passport Photos"]'::jsonb, true, false)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed additional high-quality Print Shops if few exist
INSERT INTO public.print_shops (
    id, name, owner_name, phone, address, terminal_code, city, latitude, longitude, 
    rating, total_reviews, is_open, status, payment_method_config, pc_limit,
    qr_code_data, bank_account_no, bank_ifsc, upi_id, membership_enabled, membership_price, membership_validity_days
)
VALUES 
('shop_campus_fc', 'FC Road Cyber & Print Hub', 'Rajesh Sharma', '+91 98220 11223', 'Near Ferguson College Gate 2, FC Road, Pune', 'PUNE-FC-01', 'Pune', 18.5204, 73.8420, 4.9, 342, true, 'active', 'both', 3, 'https://printon24.com/shop/PUNE-FC-01', '987654321012', 'HDFC0001234', 'fcprint@okhdfcbank', true, 99.0, 30),
('shop_kothrud_doc', 'Kothrud Instant Prints', 'Sunita Kulkarni', '+91 98901 22334', 'Shop 14, Karve Statue Complex, Kothrud, Pune', 'PUNE-KT-02', 'Pune', 18.5074, 73.8077, 4.7, 189, true, 'active', 'razorpay', 2, 'https://printon24.com/shop/PUNE-KT-02', '456789012345', 'SBIN0005678', 'kothrudprint@oksbi', true, 149.0, 60),
('shop_viman_xpress', 'Viman Nagar Digital Prints', 'Amit Deshmukh', '+91 97654 33445', 'Opposite Symbiosis Campus, Viman Nagar, Pune', 'PUNE-VN-03', 'Pune', 18.5679, 73.9143, 4.8, 276, true, 'active', 'both', 4, 'https://printon24.com/shop/PUNE-VN-03', '321098765432', 'ICIC0009876', 'vimanxpress@icici', true, 99.0, 30),
('shop_hinjewadi_tech', 'TechZone Print & Xerox Lab', 'Pooja Verma', '+91 96543 44556', 'Phase 1 Tech Park Mall, Hinjewadi, Pune', 'PUNE-HJ-04', 'Pune', 18.5913, 73.7389, 4.6, 94, true, 'active', 'counter', 2, 'https://printon24.com/shop/PUNE-HJ-04', '876543210987', 'BARB0HINJEW', 'techzone@barodampay', false, 0, 0),
('shop_aundh_deluxe', 'Aundh Print Craft Studio', 'Vikram Patel', '+91 95432 55667', 'ITi Road, Parihar Chowk, Aundh, Pune', 'PUNE-AU-05', 'Pune', 18.5580, 73.8070, 4.9, 150, false, 'inactive', 'both', 2, 'https://printon24.com/shop/PUNE-AU-05', '654321098765', 'PUNB0123456', 'aundhcraft@okaxis', true, 199.0, 90)
ON CONFLICT (id) DO UPDATE SET 
payment_method_config = EXCLUDED.payment_method_config,
status = EXCLUDED.status,
pc_limit = EXCLUDED.pc_limit;

-- 9. Seed Shopkeeper Accounts for these shops
INSERT INTO public.shopkeeper_accounts (id, shop_id, email, password_hash, owner_name, phone, role)
VALUES
('sk_fc_01', 'shop_campus_fc', 'fcprint@printon24.com', 'shopkeeper123', 'Rajesh Sharma', '+91 98220 11223', 'shopkeeper'),
('sk_kt_02', 'shop_kothrud_doc', 'kothrud@printon24.com', 'shopkeeper123', 'Sunita Kulkarni', '+91 98901 22334', 'shopkeeper'),
('sk_vn_03', 'shop_viman_xpress', 'viman@printon24.com', 'shopkeeper123', 'Amit Deshmukh', '+91 97654 33445', 'shopkeeper'),
('sk_hj_04', 'shop_hinjewadi_tech', 'techzone@printon24.com', 'shopkeeper123', 'Pooja Verma', '+91 96543 44556', 'shopkeeper'),
('sk_au_05', 'shop_aundh_deluxe', 'aundh@printon24.com', 'shopkeeper123', 'Vikram Patel', '+91 95432 55667', 'shopkeeper')
ON CONFLICT (id) DO NOTHING;

-- 10. Seed Shop QRs
INSERT INTO public.shop_qrs (id, shop_id, qr_name, shop_code, qr_data, target_url, is_active)
VALUES
('qr_fc_01', 'shop_campus_fc', 'FC Road Main Counter QR', 'PUNE-FC-01', 'PRINTON24:SHOP:PUNE-FC-01', 'https://printon24.com/shop/PUNE-FC-01', true),
('qr_kt_02', 'shop_kothrud_doc', 'Kothrud Self-Service QR', 'PUNE-KT-02', 'PRINTON24:SHOP:PUNE-KT-02', 'https://printon24.com/shop/PUNE-KT-02', true),
('qr_vn_03', 'shop_viman_xpress', 'Viman Express Standee QR', 'PUNE-VN-03', 'PRINTON24:SHOP:PUNE-VN-03', 'https://printon24.com/shop/PUNE-VN-03', true),
('qr_hj_04', 'shop_hinjewadi_tech', 'TechZone Desk QR', 'PUNE-HJ-04', 'PRINTON24:SHOP:PUNE-HJ-04', 'https://printon24.com/shop/PUNE-HJ-04', true),
('qr_au_05', 'shop_aundh_deluxe', 'Aundh Studio QR', 'PUNE-AU-05', 'PRINTON24:SHOP:PUNE-AU-05', 'https://printon24.com/shop/PUNE-AU-05', false)
ON CONFLICT (id) DO NOTHING;

-- 11. Seed PC Capacity Requests
INSERT INTO public.shop_pc_requests (id, shop_id, shop_name, current_pc_limit, requested_pcs, reason, additional_charges, payment_status, status, admin_notes)
VALUES
('pcreq-01', 'shop_campus_fc', 'FC Road Cyber & Print Hub', 3, 2, 'High rush during semester exam submissions; students queue up for 45 minutes.', 1000, 'paid', 'pending', 'Shop has 340+ orders weekly. Legitimate requirement.'),
('pcreq-02', 'shop_viman_xpress', 'Viman Nagar Digital Prints', 4, 2, 'Added dedicated photo editing kiosk and spiral binding terminal.', 1000, 'pending', 'pending', 'Awaiting verification of shop floor space.'),
('pcreq-03', 'shop_hinjewadi_tech', 'TechZone Print & Xerox Lab', 2, 1, 'Tech park employee rush between 9 AM and 11 AM.', 500, 'paid', 'approved', 'Approved on 2026-10-02. PC Limit increased to 2+1=3.')
ON CONFLICT (id) DO NOTHING;

-- 12. Seed Shop Settlements (pending and settled for 2-day settlement cycle)
INSERT INTO public.shop_settlements (
    id, shop_id, shop_name, total_orders, gross_amount, platform_commission, net_payable,
    settlement_cycle, cycle_start_date, cycle_end_date, status, bank_account_no, bank_ifsc, paid_at
)
VALUES
('settle-101', 'shop_campus_fc', 'FC Road Cyber & Print Hub', 68, 8450.00, 422.50, 8027.50, '2-day cycle', (now() - interval '4 days'), (now() - interval '2 days'), 'completed', '987654321012', 'HDFC0001234', (now() - interval '2 days')),
('settle-102', 'shop_kothrud_doc', 'Kothrud Instant Prints', 34, 4120.00, 206.00, 3914.00, '2-day cycle', (now() - interval '4 days'), (now() - interval '2 days'), 'completed', '456789012345', 'SBIN0005678', (now() - interval '2 days')),
('settle-103', 'shop_campus_fc', 'FC Road Cyber & Print Hub', 82, 10340.00, 517.00, 9823.00, '2-day cycle', (now() - interval '2 days'), now(), 'pending', '987654321012', 'HDFC0001234', null),
('settle-104', 'shop_viman_xpress', 'Viman Nagar Digital Prints', 55, 6890.00, 344.50, 6545.50, '2-day cycle', (now() - interval '2 days'), now(), 'pending', '321098765432', 'ICIC0009876', null),
('settle-105', 'shop_kothrud_doc', 'Kothrud Instant Prints', 29, 3480.00, 174.00, 3306.00, '2-day cycle', (now() - interval '2 days'), now(), 'pending', '456789012345', 'SBIN0005678', null)
ON CONFLICT (id) DO NOTHING;

-- 13. Seed Payments (Online Razorpay and Pay on Counter)
INSERT INTO public.payments (id, order_id, user_id, shop_id, razorpay_order_id, razorpay_payment_id, amount, currency, payment_method, payment_status, created_at)
VALUES
('pay-001', 'ord-901', 'usr-101', 'shop_campus_fc', 'order_Rz9101', 'pay_Rz9101_succ', 150.00, 'INR', 'online', 'completed', (now() - interval '1 hour')),
('pay-002', 'ord-902', 'usr-102', 'shop_campus_fc', 'order_Rz9102', 'pay_Rz9102_succ', 85.00, 'INR', 'online', 'completed', (now() - interval '3 hours')),
('pay-003', 'ord-903', 'usr-103', 'shop_viman_xpress', 'order_Rz9103', 'pay_Rz9103_succ', 320.00, 'INR', 'online', 'completed', (now() - interval '5 hours')),
('pay-004', 'ord-904', 'usr-104', 'shop_hinjewadi_tech', null, null, 40.00, 'INR', 'counter', 'completed', (now() - interval '6 hours')),
('pay-005', 'ord-905', 'usr-105', 'shop_kothrud_doc', 'order_Rz9105', 'pay_Rz9105_succ', 210.00, 'INR', 'online', 'completed', (now() - interval '8 hours')),
('pay-006', 'ord-906', 'usr-106', 'shop_campus_fc', null, null, 65.00, 'INR', 'counter', 'completed', (now() - interval '12 hours')),
('pay-007', 'ord-907', 'usr-107', 'shop_viman_xpress', 'order_Rz9107', 'pay_Rz9107_succ', 450.00, 'INR', 'online', 'completed', (now() - interval '1 day')),
('pay-008', 'ord-908', 'usr-108', 'shop_campus_fc', 'order_Rz9108', 'pay_Rz9108_succ', 180.00, 'INR', 'online', 'completed', (now() - interval '1 day 4 hours'))
ON CONFLICT (id) DO NOTHING;

-- 14. Seed CMS Content (Banners, Notices, FAQ, App Configs)
INSERT INTO public.cms_content (id, category, title, subtitle, content, image_url, link_url, target_audience, badge_text, is_active, display_order)
VALUES
('cms-01', 'banner', 'PrintOn24 Express Self-Service Live', 'Scan the QR code at any affiliated store to print directly from your phone.', 'Customers can now scan the terminal QR code, upload documents securely, configure color/duplex options, and print within 60 seconds.', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800', '/print-now', 'user', 'FEATURED', true, 1),
('cms-02', 'banner', 'Shopkeeper Settlement Cycle: 2-Day Payouts', 'Automated Razorpay online settlements transferred directly to shopkeeper bank accounts every 48 hours.', 'Track your matured payout balance, commission deductibles, and direct bank disbursement references right inside your dashboard.', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800', '/settlements', 'shopkeeper', 'PAYMENTS', true, 2),
('cms-03', 'announcement', 'Scheduled Server Maintenance Window', 'Routine performance upgrades will take place Sunday at 02:00 AM IST.', 'Print queues will pause for approximately 15 minutes during the database optimization routine. All pending tokens will resume automatically.', null, null, 'all', 'MAINTENANCE', true, 3),
('cms-04', 'faq', 'How does the 2-day settlement cycle work?', 'Settlement Overview', 'All online payments collected via the corporate Razorpay account are held for a standard 48-hour fraud check cycle, after which Super Admin disburses the net payable (gross amount minus 5% platform commission) to the shopkeeper verified bank account.', null, null, 'shopkeeper', 'FINANCE', true, 4),
('cms-05', 'faq', 'How do shopkeepers request additional PC capacity?', 'Terminal Scaling', 'Shopkeepers can navigate to the PC Management section in their panel and click Request Additional PC. The Super Admin reviews the request, sets the applicable recurring or one-time license charge, and approves the terminal allocation.', null, null, 'shopkeeper', 'HARDWARE', true, 5),
('cms-06', 'app_config', 'Platform Global Config', 'System Parameters', '{"currency": "INR", "commission_rate_percent": 5, "default_pc_limit": 2, "max_file_size_mb": 50, "support_phone": "+91 8000 242424", "support_email": "support@printon24.com"}', null, null, 'all', 'CONFIG', true, 6)
ON CONFLICT (id) DO NOTHING;

-- 15. Ensure RLS is enabled on newly created tables and permissive policies are set
ALTER TABLE public.shop_pc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on shop_pc_requests" ON public.shop_pc_requests;
CREATE POLICY "Allow all access on shop_pc_requests" ON public.shop_pc_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on subscription_plans" ON public.subscription_plans;
CREATE POLICY "Allow all access on subscription_plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on cms_content" ON public.cms_content;
CREATE POLICY "Allow all access on cms_content" ON public.cms_content FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on super_admin_profiles" ON public.super_admin_profiles;
CREATE POLICY "Allow all access on super_admin_profiles" ON public.super_admin_profiles FOR ALL USING (true) WITH CHECK (true);

-- Ensure public tables also have permissive policies for the Super Admin panel
DROP POLICY IF EXISTS "Allow all on print_shops" ON public.print_shops;
CREATE POLICY "Allow all on print_shops" ON public.print_shops FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on shopkeeper_accounts" ON public.shopkeeper_accounts;
CREATE POLICY "Allow all on shopkeeper_accounts" ON public.shopkeeper_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on shop_qrs" ON public.shop_qrs;
CREATE POLICY "Allow all on shop_qrs" ON public.shop_qrs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on payments" ON public.payments;
CREATE POLICY "Allow all on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on shop_settlements" ON public.shop_settlements;
CREATE POLICY "Allow all on shop_settlements" ON public.shop_settlements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on user_memberships" ON public.user_memberships;
CREATE POLICY "Allow all on user_memberships" ON public.user_memberships FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow all on user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on print_orders" ON public.print_orders;
CREATE POLICY "Allow all on print_orders" ON public.print_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on support_tickets" ON public.support_tickets;
CREATE POLICY "Allow all on support_tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on careers" ON public.careers;
CREATE POLICY "Allow all on careers" ON public.careers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on career_applications" ON public.career_applications;
CREATE POLICY "Allow all on career_applications" ON public.career_applications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on contact_messages" ON public.contact_messages;
CREATE POLICY "Allow all on contact_messages" ON public.contact_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on ad_requests" ON public.ad_requests;
CREATE POLICY "Allow all on ad_requests" ON public.ad_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on app_feedback" ON public.app_feedback;
CREATE POLICY "Allow all on app_feedback" ON public.app_feedback FOR ALL USING (true) WITH CHECK (true);
