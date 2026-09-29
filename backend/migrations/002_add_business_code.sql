ALTER TABLE businesses
  ADD COLUMN business_code VARCHAR(20) NOT NULL,
  ADD UNIQUE KEY uq_businesses_business_code (business_code);
