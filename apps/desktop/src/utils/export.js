import * as XLSX from 'xlsx';

/*
 * Shared reporting/export utilities for PharmaFlow desktop.
 *
 * A "column" descriptor looks like:
 *   { header: 'Net Amount (₹)', key: 'net', format: 'number' }
 * Supported `format` values:
 *   'number'  -> en-IN currency style (2 decimals)
 *   'int'     -> plain integer (no decimals)
 *   Function  -> (rawValue, row) => displayValue  (custom formatter)
 *   undefined -> value rendered as-is
 *
 * `rows` is the array shown in the on-screen table.
 * `totals` (optional) is an object keyed by column `key` -> total value,
 * used to render a footer row in HTML/PDF exports.
 */

const isElectron = () =>
  typeof window !== 'undefined' && !!window.pharmaAPI;

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

export function numberFmt(value, digits = 2) {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function isNumericCol(col) {
  return col.format === 'number' || col.format === 'int' || col.align === 'right';
}

// Display string used by CSV / HTML.
function displayValue(row, col) {
  const raw = row[col.key];
  if (typeof col.format === 'function') return col.format(raw, row);
  if (col.format === 'number') return numberFmt(raw);
  if (col.format === 'int') return raw == null ? '' : String(Math.round(Number(raw) || 0));
  return raw == null ? '' : String(raw);
}

// Native value used by Excel (keep numbers numeric so they stay computable).
function excelValue(row, col) {
  const raw = row[col.key];
  if (typeof col.format === 'function') return col.format(raw, row);
  if (col.format === 'number' || col.format === 'int') return Number(raw) || 0;
  return raw == null ? '' : raw;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* -------------------------------------------------------------------------- */
/* Date-range helpers                                                         */
/* -------------------------------------------------------------------------- */

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/*
 * Returns { start, end } bounds usable in a SQL `BETWEEN ? AND ?` clause.
 * Dates in the DB are stored as full ISO strings (toISOString()), so the end
 * bound is padded to the end of the day. `start`/`end` are null when no range
 * should be applied (unknown range, or incomplete custom range).
 */
export function dateRangeBounds(range, customStart, customEnd) {
  const now = new Date();
  let start;
  let end;

  switch (range) {
    case 'today':
      start = new Date(now);
      end = new Date(now);
      break;
    case 'this_week': {
      const d = new Date(now);
      const dow = (d.getDay() + 6) % 7; // Monday = 0
      start = new Date(d);
      start.setDate(d.getDate() - dow);
      end = new Date(now);
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), q * 3 + 3, 0);
      break;
    }
    case 'this_year': {
      // Indian financial year: Apr 1 -> Mar 31.
      const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(fyStartYear, 3, 1);
      end = new Date(fyStartYear + 1, 2, 31);
      break;
    }
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: `${customEnd}T23:59:59.999Z` };
      }
      return { start: null, end: null };
    default:
      return { start: null, end: null };
  }

  return { start: fmtDate(start), end: `${fmtDate(end)}T23:59:59.999Z` };
}

/*
 * GST filing-period bounds (matches the fixed options in GSTReport).
 */
export function periodBounds(period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-11
  
  const fmt = (d) => d.toISOString().split('T')[0];
  
  switch (period) {
    case 'current_month': {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { start: fmt(start), end: fmt(end) + 'T23:59:59.999Z' };
    }
    case 'last_month': {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { start: fmt(start), end: fmt(end) + 'T23:59:59.999Z' };
    }
    case 'current_quarter': {
      const qStartMonth = Math.floor(m / 3) * 3;
      const start = new Date(y, qStartMonth, 1);
      const end = new Date(y, qStartMonth + 3, 0);
      return { start: fmt(start), end: fmt(end) + 'T23:59:59.999Z' };
    }
    case 'all_time':
    default:
      return { start: null, end: null };
  }
}

/* -------------------------------------------------------------------------- */
/* Company profile (report headers)                                           */
/* -------------------------------------------------------------------------- */

export async function getCompanyProfile() {
  try {
    if (!isElectron()) return {};
    const res = await window.pharmaAPI.db.query('SELECT * FROM companies LIMIT 1');
    return (res && res.data && res.data[0]) || {};
  } catch (err) {
    console.error('getCompanyProfile failed:', err);
    return {};
  }
}

/* -------------------------------------------------------------------------- */
/* Blob fallback (non-electron / browser preview)                             */
/* -------------------------------------------------------------------------- */

function downloadBlob(data, fileName, mime, base64 = false) {
  try {
    let blob;
    if (base64) {
      const bin = atob(data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      blob = new Blob([bytes], { type: mime });
    } else {
      blob = new Blob([data], { type: mime });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, path: fileName };
  } catch (err) {
    console.error('downloadBlob failed:', err);
    return { success: false };
  }
}

/* -------------------------------------------------------------------------- */
/* CSV                                                                        */
/* -------------------------------------------------------------------------- */

export function toCsv(columns, rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => esc(c.header)).join(',');
  const lines = (rows || []).map((row) =>
    columns.map((c) => esc(displayValue(row, c))).join(',')
  );
  return [header, ...lines].join('\r\n');
}

export async function exportCsv(fileName, columns, rows) {
  // BOM keeps ₹ and other unicode intact when opened in Excel.
  const csv = `﻿${toCsv(columns, rows)}`;
  if (isElectron()) {
    return window.pharmaAPI.export.save(`${fileName}.csv`, csv);
  }
  return downloadBlob(csv, `${fileName}.csv`, 'text/csv;charset=utf-8;');
}

/* -------------------------------------------------------------------------- */
/* Excel (SheetJS)                                                            */
/* -------------------------------------------------------------------------- */

export async function exportExcel(fileName, columns, rows, sheetName = 'Sheet1') {
  const headers = columns.map((c) => c.header);
  const data = (rows || []).map((row) => {
    const obj = {};
    columns.forEach((c) => {
      obj[c.header] = excelValue(row, c);
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  ws['!cols'] = columns.map((c) => ({
    wch: Math.max(12, String(c.header || '').length + 2, c.width || 0),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  if (isElectron()) {
    return window.pharmaAPI.export.save(`${fileName}.xlsx`, b64, { base64: true });
  }
  return downloadBlob(
    b64,
    `${fileName}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    true
  );
}

/* -------------------------------------------------------------------------- */
/* Printable HTML / PDF                                                       */
/* -------------------------------------------------------------------------- */

export function buildReportHtml({ title, company, subtitle, columns, rows, totals }) {
  const co = company || {};
  const generatedAt = new Date().toLocaleString('en-IN');

  const thead = columns
    .map(
      (col) =>
        `<th style="text-align:${isNumericCol(col) ? 'right' : 'left'}">${escapeHtml(
          col.header
        )}</th>`
    )
    .join('');

  const tbody = (rows || [])
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (col) =>
              `<td style="text-align:${isNumericCol(col) ? 'right' : 'left'}">${escapeHtml(
                displayValue(row, col)
              )}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  let tfoot = '';
  if (totals) {
    let labelPlaced = false;
    const cells = columns
      .map((col) => {
        const hasTotal = Object.prototype.hasOwnProperty.call(totals, col.key);
        if (hasTotal) {
          const val =
            typeof col.format === 'function'
              ? col.format(totals[col.key], totals)
              : col.format === 'int'
              ? String(Math.round(Number(totals[col.key]) || 0))
              : numberFmt(totals[col.key]);
          return `<td style="text-align:${isNumericCol(col) ? 'right' : 'left'}">${escapeHtml(
            val
          )}</td>`;
        }
        if (!labelPlaced) {
          labelPlaced = true;
          return '<td style="text-align:left">Grand Total</td>';
        }
        return '<td></td>';
      })
      .join('');
    tfoot = `<tfoot><tr>${cells}</tr></tfoot>`;
  }

  const gstLine = co.gstin ? ` &nbsp;|&nbsp; GSTIN: ${escapeHtml(co.gstin)}` : '';
  const addrLine = [co.address, co.city, co.state, co.pincode]
    .filter(Boolean)
    .map(escapeHtml)
    .join(', ');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title || 'Report')}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; font-size: 12px; margin: 0; }
  .rpt-head { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
  .rpt-company { font-size: 20px; font-weight: 700; }
  .rpt-meta { font-size: 11px; color: #333; margin-top: 2px; }
  .rpt-title { font-size: 15px; font-weight: 700; margin-top: 10px; }
  .rpt-sub { font-size: 11px; color: #444; margin-top: 2px; }
  .rpt-gen { font-size: 10px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #999; padding: 5px 7px; font-size: 11px; }
  thead th { background: #f0f0f0; font-weight: 700; }
  tfoot td { background: #f0f0f0; font-weight: 700; }
</style>
</head>
<body>
  <div class="rpt-head">
    <div class="rpt-company">${escapeHtml(co.name || 'PharmaFlow')}</div>
    ${addrLine ? `<div class="rpt-meta">${addrLine}</div>` : ''}
    <div class="rpt-meta">${co.phone ? `Ph: ${escapeHtml(co.phone)}` : ''}${gstLine}</div>
    <div class="rpt-title">${escapeHtml(title || 'Report')}</div>
    ${subtitle ? `<div class="rpt-sub">${escapeHtml(subtitle)}</div>` : ''}
    <div class="rpt-gen">Generated: ${escapeHtml(generatedAt)}</div>
  </div>
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody || `<tr><td colspan="${columns.length}" style="text-align:center">No data</td></tr>`}</tbody>
    ${tfoot}
  </table>
</body>
</html>`;
}

export async function exportPdf(fileName, htmlOrSpec) {
  const html = typeof htmlOrSpec === 'string' ? htmlOrSpec : buildReportHtml(htmlOrSpec);
  if (isElectron() && window.pharmaAPI.export && window.pharmaAPI.export.pdf) {
    return window.pharmaAPI.export.pdf(html, `${fileName}.pdf`);
  }
  // Browser fallback: open a print window.
  printHtml(html);
  return { success: true };
}

export function printHtml(html) {
  if (isElectron() && window.pharmaAPI.print && window.pharmaAPI.print.report) {
    return window.pharmaAPI.print.report(html);
  }
  const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  } else if (typeof window !== 'undefined') {
    window.print();
  }
  return { success: true };
}
