ALTER TABLE shop_settlements 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS payout_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_mode TEXT;