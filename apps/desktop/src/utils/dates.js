// Batch expiry is entered/displayed as MM/YY (Indian pharma convention) and stored
// locally as that text, but the cloud `Batch.expiryDate` column is a DateTime.
// These helpers convert at the sync boundary so pushes are valid ISO-8601 and
// pulled values display back as MM/YY.

// "12/26" | "12/2026" | ISO | Date  ->  ISO-8601 string (last day of that month).
export function toIsoExpiry(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString();
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {            // already ISO-ish
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const m = s.match(/^(\d{1,2})\/(\d{2}|\d{4})$/); // MM/YY or MM/YYYY
  if (m) {
    const mon = parseInt(m[1], 10);
    const yr = m[2].length === 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10);
    // Date.UTC(yr, mon, 0) = last day of calendar month `mon` (1-12).
    const d = new Date(Date.UTC(yr, mon, 0, 23, 59, 59));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ISO / Date / "12/26"  ->  "MM/YY" for display + local storage.
export function toDisplayExpiry(v) {
  if (!v) return '';
  const s = String(v);
  const m = s.match(/^(\d{1,2})\/(\d{2}|\d{4})$/);
  if (m) return `${m[1].padStart(2, '0')}/${m[2].slice(-2)}`;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${mm}/${yy}`;
}
