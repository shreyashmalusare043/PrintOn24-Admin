ALTER TABLE platform_settings 
  ADD COLUMN IF NOT EXISTS maintenance_mode boolean
    DEFAULT false,
  ADD COLUMN IF NOT EXISTS new_shop_registrations_open boolean
    DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_settlement_enabled boolean
    DEFAULT true,
  ADD COLUMN IF NOT EXISTS vip_discount_system_active boolean
    DEFAULT true,
  ADD COLUMN IF NOT EXISTS ad_sponsorship_slots_open boolean
    DEFAULT true,
  ADD COLUMN IF NOT EXISTS live_file_upload_enabled boolean
    DEFAULT true;