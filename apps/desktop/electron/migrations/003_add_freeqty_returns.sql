-- Add free_qty to sale and purchase return items
ALTER TABLE sale_return_items ADD COLUMN free_qty REAL DEFAULT 0;
ALTER TABLE purchase_return_items ADD COLUMN free_qty REAL DEFAULT 0;
