import sqlite3, os
db_path = os.path.join(os.environ['APPDATA'], 'pharmaflow-desktop', 'pharmaflow.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
tables = ['companies', 'users', 'customers', 'suppliers', 'products', 'batches', 'manufacturers', 'categories', 'racks', 'sales', 'sale_items', 'purchases', 'purchase_items', 'purchase_returns', 'sale_returns', 'receipts', 'payments', 'stock_adjustments']
for t in tables:
    try:
        count = cursor.execute(f'SELECT COUNT(1) FROM {t}').fetchone()[0]
        print(f'{t.upper()}: {count}')
    except Exception as e:
        print(f'{t.upper()}: ERROR - {e}')
