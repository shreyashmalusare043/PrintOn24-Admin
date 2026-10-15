-- Table for 3 Super Admin 6-digit security passwords
CREATE TABLE IF NOT EXISTS security_passwords (
  id TEXT PRIMARY KEY, -- 'credential_view', 'settlement_payout', 'payment_methods'
  password_type TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_configured BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table for Super Admin email OTPs
CREATE TABLE IF NOT EXISTS admin_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table for Advertisement management (User Panel Home Page Hero/Banner & Upload Page)
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  target_url TEXT,
  placement TEXT NOT NULL, -- 'home_hero', 'upload_page'
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table for Dynamic CMS Informational Pages (About Us, Privacy Policy, Terms & Conditions)
CREATE TABLE IF NOT EXISTS informational_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- 'about_us', 'privacy_policy', 'terms_conditions'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  last_published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure RLS is enabled and accessible
ALTER TABLE security_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE informational_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to security_passwords" ON security_passwords;
CREATE POLICY "Allow full access to security_passwords" ON security_passwords FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to admin_otps" ON admin_otps;
CREATE POLICY "Allow full access to admin_otps" ON admin_otps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to advertisements" ON advertisements;
CREATE POLICY "Allow full access to advertisements" ON advertisements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to informational_pages" ON informational_pages;
CREATE POLICY "Allow full access to informational_pages" ON informational_pages FOR ALL USING (true) WITH CHECK (true);

-- Seed initial informational pages if not exists
INSERT INTO informational_pages (slug, title, content, is_published)
VALUES 
  ('about_us', 'About PrintOn24', '<h2>About PrintOn24</h2><p>PrintOn24 is India''s premier cloud document printing and terminal kiosk network. We connect university campuses, corporate hubs, and local communities with high-speed automated document printing.</p><h3>Our Mission</h3><p>To eliminate queues and provide seamless, transparent document printing anywhere, anytime with pre-paid online payments and pay-on-counter flexibility.</p>', true),
  ('privacy_policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Your document privacy and security is our utmost priority. All uploaded documents are automatically purged from local terminal caches within 24 hours of printing completion.</p><h3>Data Protection</h3><p>We do not store document contents permanently. All payment processing is secured via industry-standard Razorpay encryption.</p>', true),
  ('terms_conditions', 'Terms & Conditions', '<h2>Terms & Conditions</h2><p>By using the PrintOn24 user portal or operating a PrintOn24 connected printing terminal, you agree to comply with our fair-use printing and subscription terms.</p><h3>Terminal Usage & PC Limits</h3><p>Each connected shop is allocated authorized concurrent PC terminal licenses. Unauthorized hardware duplication or terminal bypassing is strictly prohibited.</p>', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed initial sample advertisements
INSERT INTO advertisements (title, description, image_url, target_url, placement, is_active, display_order)
VALUES
  ('Flash Print Week: 50% Off Colored Prints', 'Enjoy premium high-gloss color prints for your project thesis and reports this week at all campus terminals.', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop', 'https://printon24.com/offers', 'home_hero', true, 1),
  ('VIP Student Membership Pass', 'Save up to 30% on daily Xerox and binding with PrintOn24 VIP Card.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop', 'https://printon24.com/membership', 'home_hero', true, 2),
  ('Fast Document Upload & Cloud Print', 'Upload PDF, DOCX, PPT from your mobile device and collect instantly at the nearest counter standee.', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop', 'https://printon24.com/upload', 'upload_page', true, 1)
ON CONFLICT DO NOTHING;
