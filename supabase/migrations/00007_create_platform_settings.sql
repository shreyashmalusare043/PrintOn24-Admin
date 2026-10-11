CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY,
  commission_rate NUMERIC DEFAULT 5.0,
  razorpay_enabled BOOLEAN DEFAULT true,
  pay_on_counter_enabled BOOLEAN DEFAULT true,
  payu_enabled BOOLEAN DEFAULT true,
  payout_cycle_days INTEGER DEFAULT 2,
  min_payout_amount NUMERIC DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_settings (id, commission_rate, razorpay_enabled, pay_on_counter_enabled, payu_enabled, payout_cycle_days, min_payout_amount)
VALUES ('default', 5.0, true, true, true, 2, 500)
ON CONFLICT (id) DO NOTHING;