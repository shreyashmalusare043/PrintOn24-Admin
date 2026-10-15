CREATE POLICY "Allow all on home_banners"
  ON home_banners
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (
    true
  )
  WITH CHECK (
    true
  ); CREATE POLICY "Allow all on upload_page_ads"
  ON upload_page_ads
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (
    true
  )
  WITH CHECK (
    true
  );