import sqlite3
import os
import json

db_path = os.path.join(os.path.expanduser("~"), 'AppData', 'Roaming', 'pharmaflow-desktop', 'pharmaflow.db')
print("Opening database at:", db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Fixing SaleReturnItem and PurchaseReturnItem payloads...")
cursor.execute("SELECT id, payload FROM sync_queue WHERE table_name IN ('SaleReturnItem', 'PurchaseReturnItem')")
rows = cursor.fetchall()
updated = 0
for row in rows:
    row_id, payload_str = row
    try:
        payload = json.loads(payload_str)
        changed = False
        for field in ['qty', 'mrp', 'ptr', 'salePrice', 'netAmount']:
            if field in payload and isinstance(payload[field], str):
                try:
                    payload[field] = float(payload[field])
                    changed = True
                except ValueError:
                    pass
        if changed:
            new_payload_str = json.dumps(payload)
            cursor.execute("UPDATE sync_queue SET payload = ? WHERE id = ?", (new_payload_str, row_id))
            updated += 1
    except Exception as e:
        print("Error processing row", row_id, e)

print(f"Updated {updated} sync_queue payloads.")

print("Resetting failed/dead-lettered sync_queue records for retry...")
cursor.execute("UPDATE sync_queue SET is_synced = 0, retry_count = 0, next_retry_at = NULL, sync_error = NULL WHERE is_synced = 2 OR (is_synced = 0 AND sync_error IS NOT NULL)")
print(f"Reset {cursor.rowcount} sync_queue records.")

conn.commit()
conn.close()
