-- Add drug_license_2 to customers and suppliers
ALTER TABLE customers ADD COLUMN drug_license_2 TEXT;
ALTER TABLE suppliers ADD COLUMN drug_license_2 TEXT;
