INSERT INTO shop_subscriptions (id, shop_id, plan_id, plan_name, price, pc_limit, validity_days, start_date, expiry_date, status, auto_renew, payment_status)
VALUES
  ('sub_hinjewadi', 'shop_hinjewadi_tech', 'plan-enterprise', 'Enterprise Hub Plan', 8000, 8, 30, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'active', true, 'success'),
  ('sub_viman', 'shop_viman_xpress', 'plan-pro', 'Pro Shop Plan', 5000, 4, 30, NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', 'active', true, 'success'),
  ('sub_campus', 'shop_campus_fc', 'plan-starter', 'Starter Print Plan', 2000, 2, 30, NOW() - INTERVAL '18 days', NOW() + INTERVAL '12 days', 'active', false, 'success'),
  ('sub_kothrud', 'shop_kothrud_doc', 'plan-starter', 'Starter Print Plan', 2000, 2, 30, NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days', 'expired', false, 'success'),
  ('sub_aundh', 'shop_aundh_deluxe', 'plan-starter', 'Starter Print Plan', 2000, 2, 30, NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'active', false, 'success')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  expiry_date = EXCLUDED.expiry_date;