// invoiceTemplate.js
// Builds a printable A4 GST tax-invoice HTML string for PharmaFlow (sales & purchase).
// Self-contained: includes a small number-to-Indian-words helper. No external deps.

/* ---------------- helpers ---------------- */

// Escape HTML so stray characters never break the layout.
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Show a value or a blank string (never "undefined"/"null").
function val(v, fallback = '') {
  if (v === null || v === undefined || v === '') return fallback;
  return v;
}

function num(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function money(v) {
  return num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Quantities are whole STRIPS — render as integers (no decimals).
function qtyInt(v) {
  return String(Math.round(num(v)));
}

// Indian numbering number-to-words (handles up to crores). Integer rupees.
function numberToIndianWords(amount) {
  const n = Math.floor(Math.abs(num(amount)));
  if (n === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (x) => {
    if (x < 20) return ones[x];
    return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
  };
  const threeDigits = (x) => {
    const h = Math.floor(x / 100);
    const rest = x % 100;
    let s = '';
    if (h) s += ones[h] + ' Hundred';
    if (rest) s += (s ? ' ' : '') + twoDigits(rest);
    return s;
  };

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts = [];
  if (crore) parts.push(twoDigits(crore) + ' Crore');
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(' ').trim();
}

function amountInWords(amount) {
  const rupees = Math.floor(num(amount));
  const paise = Math.round((num(amount) - rupees) * 100);
  let words = numberToIndianWords(rupees) + ' Rupees';
  if (paise > 0) {
    words += ' and ' + numberToIndianWords(paise) + ' Paise';
  }
  return words + ' Only';
}

/* ---------------- main builder ---------------- */

/**
 * buildInvoiceHtml — returns a printable A4 landscape dot-matrix style HTML string.
 * Exactly matches standard pharmaceutical wholesale/retail landscape invoice layouts.
 * @param {Object}   opts
 * @param {'sales'|'purchase'} opts.type
 * @param {Object}   opts.company  seller company profile
 * @param {Object}   opts.party    bill-to customer / from supplier
 * @param {Object}   opts.invoice  { no, date, type (Credit/Cash), discount, netPayable, note }
 * @param {Array}    opts.items    [{ mfg, name, hsn, pack, batch, exp, qty, free, mrp, pts, ptr, amount, gst, disc }]
 */
export function buildInvoiceHtml({ type = 'sales', company = {}, party = {}, invoice = {}, items = [] } = {}) {
  const isPurchase = type === 'purchase' || type === 'purchase_return';
  const list = Array.isArray(items) ? items : [];

  // ---- per-item derived taxable + gst (self-consistent from the net amount) ----
  const slabs = { 5: t(), 12: t(), 18: t(), 28: t(), 0: t() };
  function t() { return { taxable: 0, cgst: 0, sgst: 0 }; }

  let unitsSum = 0;
  let taxableSum = 0;
  let gstSum = 0;

  const rowsHtml = list.map((it) => {
    const rate = num(it.gst);
    const lineTotal = num(it.amount);
    const taxable = rate > 0 ? lineTotal / (1 + rate / 100) : lineTotal;
    const gstAmt = lineTotal - taxable;

    unitsSum += num(it.qty) + num(it.free);
    taxableSum += taxable;
    gstSum += gstAmt;

    const slabKey = [5, 12, 18, 28, 0].includes(rate) ? rate : 0;
    slabs[slabKey].taxable += taxable;
    slabs[slabKey].cgst += gstAmt / 2;
    slabs[slabKey].sgst += gstAmt / 2;

    const ptsVal = it.pts !== undefined && it.pts !== '' && it.pts !== null ? money(it.pts) : (it.ptr !== undefined && it.ptr !== '' && it.ptr !== null ? money(it.ptr) : '0.00');
    const ptrVal = it.ptr !== undefined && it.ptr !== '' && it.ptr !== null ? money(it.ptr) : '0.00';
    const gstVal = Number.isInteger(num(it.gst)) ? String(num(it.gst)) : num(it.gst).toFixed(2);
    const discVal = Number.isInteger(num(it.disc)) ? String(num(it.disc)) : num(it.disc).toFixed(2);

    return `<tr>
      <td class="ln">${esc(val(it.mfg))}</td>
      <td class="ln" style="font-weight:bold; white-space:normal;">${esc(val(it.name))}</td>
      <td class="ln">${esc(val(it.hsn))}</td>
      <td class="ln">${esc(val(it.pack))}</td>
      <td class="ln">${esc(val(it.batch))}</td>
      <td class="ln">${esc(val(it.exp))}</td>
      <td class="r" style="font-weight:bold;">${qtyInt(it.qty)}</td>
      <td class="r">${qtyInt(it.free)}</td>
      <td class="r">${money(it.mrp)}</td>
      <td class="r">${ptsVal}</td>
      <td class="r">${ptrVal}</td>
      <td class="r" style="font-weight:bold;">${money(it.amount)}</td>
      <td class="r">${esc(gstVal)}</td>
      <td class="r">${esc(discVal)}</td>
    </tr>`;
  }).join('');

  const grand = taxableSum + gstSum;
  const lessDisc = num(invoice.discount);
  const subTotalGross = taxableSum + lessDisc;
  const netPayable = invoice.netPayable !== undefined && invoice.netPayable !== null
    ? num(invoice.netPayable)
    : Math.round(grand);
  const rounding = netPayable - grand;

  const companyName = esc(val(company.name, isPurchase ? 'Purchase Enterprise' : 'Medical Enterprise'));
  const dlLine1 = val(party.drug_license1 ?? party.drug_license);
  const dlLine2 = val(party.drug_license2);
  let titleText = isPurchase ? 'PURCHASE INVOICE' : 'INVOICE / TAX INVOICE';
  if (type === 'sales_return') titleText = 'CREDIT NOTE / RETURN';
  if (type === 'purchase_return') titleText = 'DEBIT NOTE / RETURN';

  let formattedDate = val(invoice.date, '');
  if (formattedDate) {
    const d = new Date(formattedDate);
    if (!isNaN(d)) {
      formattedDate = `${String(d.getDate()).padStart(2, '0')} ${String(d.getMonth() + 1).padStart(2, '0')} ${d.getFullYear()}`;
    }
  }

  return `<!-- PharmaFlow ${isPurchase ? 'Purchase' : 'Sales'} Landscape Invoice -->
<div class="invoice-container" style="font-family:'Courier New',Courier,monospace;color:#000;background:#fff;width:275mm;min-height:185mm;margin:0 auto;padding:6mm 8mm;box-sizing:border-box;font-size:13px;line-height:1.4;display:flex;flex-direction:column;">
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    @media print {
      body { margin: 0; padding: 0; background: #fff; color: #000; -webkit-print-color-adjust: exact; }
      .invoice-container { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; min-height: 100vh !important; }
    }
    .inv-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    .inv-table th, .inv-table td { border: none; padding: 6px 6px; font-size: 16px; vertical-align: top; white-space: nowrap; }
    .inv-table th { text-align: left; font-weight: bold; font-size: 16px; }
    .inv-table td.c { text-align: center; }
    .inv-table td.r, .inv-table th.r { text-align: right; }
    .inv-table td.ln { text-align: left; }
    .no-border { width: 100%; border-collapse: collapse; }
    .no-border td, .no-border th { border: none; padding: 1px 2px; }
    .dashed-divider { border-top: 1px dashed #000; width: 100%; margin: 4px 0; }
  </style>

  <!-- Top Title & Company details -->
  <div style="flex: 1;">
  <div style="text-align:center; font-size:14px; font-weight:bold; letter-spacing:2px;">${titleText}</div>
  <div style="text-align:center; font-size:24px; font-weight:bold; margin-top:4px; margin-bottom:8px; letter-spacing:1px;">${companyName.toUpperCase()}</div>

  <table class="no-border" style="width:100%; margin-bottom:4px;">
    <tr>
      <td style="width:60%; vertical-align:top; font-size:13px;">
        <div style="font-weight:bold; font-size:15px;">${esc(val(company.address))}</div>
        <div>${[company.city, company.pincode].filter(Boolean).join(' - ')}${company.state ? ', ' + esc(company.state) : ''}</div>
        <div>${company.phone ? 'Phone No:' + esc(company.phone) : ''}${company.phone && company.email ? '  ' : ''}${company.email ? 'Email:' + esc(company.email) : ''}</div>
      </td>
      <td style="width:40%; vertical-align:top; text-align:right;">
        <table class="no-border" style="width:100%; text-align:right;">
          <tr><td style="text-align:right;"><b>GSTIN:</b> ${esc(val(company.gstin))}</td></tr>
          <tr><td style="text-align:right;"><b>D.L.NO 20B:</b> ${esc(val(company.drug_license_20b))}</td></tr>
          <tr><td style="text-align:right;"><b>D.L.NO 21B:</b> ${esc(val(company.drug_license_21b))}</td></tr>
          <tr><td style="text-align:right;"><b>FSSAI:</b> ${esc(val(company.fssai_license))}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Divider 1 -->
  <div class="dashed-divider"></div>

  <!-- Party Details & Invoice Metadata -->
  <table class="no-border" style="width:100%; margin: 3px 0;">
    <tr>
      <td style="width:40%; vertical-align:top; padding-right:15px;">
        <table class="no-border" style="width:100%;">
          <tr>
            <td style="width:45px; font-weight:bold; vertical-align:top;">${isPurchase ? 'From:' : 'To  :'}</td>
            <td style="font-weight:bold; vertical-align:top;">${esc(val(party.name, isPurchase ? 'Supplier' : 'Customer'))}</td>
          </tr>
          ${party.address ? `<tr><td></td><td style="vertical-align:top;">${esc(party.address)}</td></tr>` : ''}
          ${(party.city || party.pincode || party.state) ? `<tr><td></td><td style="vertical-align:top;">${[party.city, party.pincode].filter(Boolean).join(' - ')}${party.state ? ', ' + esc(party.state) : ''}</td></tr>` : ''}
        </table>
      </td>
      <td style="width:35%; vertical-align:top; padding-right:15px;">
        <table class="no-border" style="width:100%;">
          <tr><td style="width:80px; font-weight:bold; white-space:nowrap;">GSTIN</td><td>: ${esc(val(party.gstin, ''))}</td></tr>
          <tr><td style="font-weight:bold; white-space:nowrap;">DL NO1</td><td>: ${esc(val(dlLine1, ''))}</td></tr>
          <tr><td style="font-weight:bold; white-space:nowrap;">DL NO2</td><td>: ${esc(val(dlLine2, ''))}</td></tr>
        </table>
      </td>
      <td style="width:25%; vertical-align:top;">
        <table class="no-border" style="width:100%;">
          <tr><td style="width:90px; font-weight:bold; white-space:nowrap;">Invoice No</td><td>: <b>${esc(val(invoice.no))}</b></td></tr>
          <tr><td style="font-weight:bold; white-space:nowrap;">Inv Dt</td><td>: ${esc(formattedDate)}</td></tr>
          <tr><td style="font-weight:bold; white-space:nowrap;">Type</td><td>: ${esc(val(invoice.type, 'Credit'))}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Divider 2 -->
  <div class="dashed-divider"></div>

  <!-- Table Column Headers -->
  <table class="inv-table">
    <thead>
      <tr style="border-bottom:1px dashed #000;">
        <th style="width:7%;">MFG</th>
        <th style="width:20%;">PRODUCT NAME</th>
        <th style="width:8%;">HSN.CODE</th>
        <th style="width:6%;">PACK</th>
        <th style="width:9%;">BATCH</th>
        <th style="width:6%;">EXP</th>
        <th class="r" style="width:5%;">Qty</th>
        <th class="r" style="width:4%;">Free</th>
        <th class="r" style="width:7%;">M.R.P</th>
        <th class="r" style="width:7%;">P.T.S</th>
        <th class="r" style="width:7%;">P.T.R</th>
        <th class="r" style="width:8%;">Amount</th>
        <th class="r" style="width:4%;">GSTT%</th>
        <th class="r" style="width:4%;">DIS%</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="14" style="text-align:center; padding:12px; font-size:13px;">No items</td></tr>`}
    </tbody>
  </table>

  <div style="min-height:20px;"></div>
  </div> <!-- end flex: 1 main content -->

  <div style="margin-top: auto;">
  <!-- Notes & Ledger Balance -->
  <table class="no-border" style="width:100%; margin-top:10px; font-size:14px; line-height:1.4;">
    <tr>
      <td style="width:65%; vertical-align:bottom;">
        <span style="font-weight:bold;">Note :</span> ${esc(val(invoice.note, ''))}
      </td>
      <td style="width:35%; text-align:right; vertical-align:bottom;">
        <b>Ledger Balance:</b> &nbsp; &nbsp; <b>0.00</b>
      </td>
    </tr>
  </table>

  <!-- Divider 3 -->
  <div class="dashed-divider"></div>

  <!-- Tax Breakdown & Summary Calculations -->
  <table class="no-border" style="width:100%; margin-top:6px; font-size:14px; line-height:1.4;">
    <tr>
      <td style="width:30%; vertical-align:top; padding-right:15px;">
        <table class="no-border" style="width:100%; font-size:14px;">
          <tr><td style="white-space:nowrap; font-weight:bold;">Taxable</td><td class="r" style="white-space:nowrap; font-weight:bold;">Value</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">5% Value:</td><td class="r" style="white-space:nowrap;">${money(slabs[5].taxable)}</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">12% Value:</td><td class="r" style="white-space:nowrap;">${money(slabs[12].taxable)}</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">18% Value:</td><td class="r" style="white-space:nowrap;">${money(slabs[18].taxable)}</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">28% Value:</td><td class="r" style="white-space:nowrap;">${money(slabs[28].taxable)}</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">0% Value:</td><td class="r" style="white-space:nowrap;">${money(slabs[0].taxable)}</td></tr>
        </table>
      </td>
      <td style="width:40%; vertical-align:top; padding-right:15px;">
        <table class="no-border" style="width:100%; font-size:14px;">
          <tr><td style="white-space:nowrap; font-weight:bold;">Taxable</td><td class="r" style="white-space:nowrap; font-weight:bold;">CGST Amt</td><td class="r" style="white-space:nowrap; font-weight:bold;">SGST Amt</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">5% GST:</td><td class="r" style="white-space:nowrap;">${money(slabs[5].cgst)}</td><td class="r" style="white-space:nowrap;">${money(slabs[5].sgst)}</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">12% GST:</td><td class="r" style="white-space:nowrap;">${money(slabs[12].cgst)}</td><td class="r" style="white-space:nowrap;">${money(slabs[12].sgst)}</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">18% GST:</td><td class="r" style="white-space:nowrap;">${money(slabs[18].cgst)}</td><td class="r" style="white-space:nowrap;">${money(slabs[18].sgst)}</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">28% GST:</td><td class="r" style="white-space:nowrap;">${money(slabs[28].cgst)}</td><td class="r" style="white-space:nowrap;">${money(slabs[28].sgst)}</td></tr>
          <tr><td style="white-space:nowrap; padding-right:8px;">Adjust:</td><td class="r" style="white-space:nowrap;">0.00</td><td class="r" style="white-space:nowrap;"></td></tr>
        </table>
      </td>
      <td style="width:30%; vertical-align:top;">
        <table class="no-border" style="width:100%; font-size:14px;">
          <tr><td style="text-align:right; white-space:nowrap; padding-right:15px;">Items:</td><td class="r" style="width:90px; font-weight:bold;">${list.length}</td></tr>
          <tr><td style="text-align:right; white-space:nowrap; padding-right:15px;">Units:</td><td class="r" style="font-weight:bold;">${qtyInt(unitsSum)}</td></tr>
          <tr><td style="text-align:right; white-space:nowrap; padding-right:15px;">Sub Total:</td><td class="r">${money(subTotalGross)}</td></tr>
          <tr><td style="text-align:right; white-space:nowrap; padding-right:15px;">Less Disc:</td><td class="r">${money(lessDisc)}</td></tr>
          <tr><td style="text-align:right; white-space:nowrap; padding-right:15px;">Rounding :</td><td class="r">${money(rounding)}</td></tr>
          <tr><td style="text-align:right; white-space:nowrap; padding-right:15px;">GST%:</td><td class="r">${money(gstSum)}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Divider 4 -->
  <div class="dashed-divider"></div>

  <!-- Net Payable & Words -->
  <table class="no-border" style="width:100%; margin: 6px 0;">
    <tr>
      <td style="vertical-align:middle; font-size:13px; font-weight:bold;">
        ${esc(amountInWords(netPayable))}
      </td>
      <td style="text-align:right; font-weight:bold; font-size:18px; vertical-align:middle;">
        NET PAYABLE: &nbsp; ${money(netPayable)}
      </td>
    </tr>
  </table>

  <!-- Divider 5 -->
  <div class="dashed-divider"></div>

  <!-- Footer -->
  <table class="no-border" style="width:100%; margin-top:6px;">
    <tr>
      <td style="width:60%; vertical-align:top; font-size:12px;">
        Goods covered under this bill donot contravene section 18 of the drugs &amp; cosmetics act 1940
      </td>
      <td style="width:40%; text-align:right; vertical-align:top;">
        <div style="font-weight:bold; font-size:13px;">For ${companyName.toUpperCase()}</div>
        <div style="height:45px;"></div>
        <div style="font-weight:bold; font-size:13px;">For M/s. ${companyName.toUpperCase()}</div>
        <div style="margin-top:4px; font-size:12px;">${esc(val(company.authorized_sign, 'M.Partner / Authorised Signatory'))}</div>
      </td>
    </tr>
  </table>
  </div> <!-- end margin-top: auto footer -->
</div>`;
}

export async function exportPastInvoice(type = 'sales', recordId, action = 'pdf') {
  try {
    const companyRes = await window.pharmaAPI.db.query("SELECT * FROM companies LIMIT 1");
    const company = companyRes?.data?.[0] || {};

    let party = {};
    let invoice = {};
    let items = [];

    if (type === 'sales' || type === 'sale') {
      const saleRes = await window.pharmaAPI.db.query(
        "SELECT * FROM sales WHERE id = ? OR invoice_no = ? LIMIT 1",
        [recordId, recordId]
      );
      const sale = saleRes?.data?.[0];
      if (!sale) {
        alert('Invoice record not found in database.');
        return;
      }

      const partyRes = await window.pharmaAPI.db.query(
        "SELECT * FROM customers WHERE id = ?",
        [sale.customer_id]
      );
      party = partyRes?.data?.[0] || {};

      const itemsRes = await window.pharmaAPI.db.query(
        `SELECT si.*, p.name AS product_name, p.hsn_code, p.packing, m.name AS mfg_name, b.batch_no, b.expiry_date, b.pts AS batch_pts
         FROM sale_items si
         LEFT JOIN products p ON si.product_id = p.id
         LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
         LEFT JOIN batches b ON si.batch_id = b.id
         WHERE si.sale_id = ?`,
        [sale.id]
      );

      items = (itemsRes?.data || []).map(item => ({
        mfg: item.mfg_name || '',
        name: item.product_name || 'Product',
        hsn: item.hsn_code || '',
        pack: item.packing || '1x10',
        batch: item.batch_no || '',
        exp: item.expiry_date || '',
        qty: item.qty || 0,
        free: item.free_qty || 0,
        mrp: item.mrp || 0,
        pts: party.type === 'wholesale' ? (item.batch_pts || 0) : (item.ptr || item.sale_price || 0),
        ptr: item.ptr || item.sale_price || 0,
        amount: item.net_amount || 0,
        gst: item.gst_rate || 0,
        disc: item.disc_percent || 0
      }));

      invoice = {
        no: sale.invoice_no || sale.id,
        date: sale.date,
        type: sale.payment_mode || 'Credit/Cash',
        discount: sale.discount_amount || 0,
        netPayable: sale.net_amount || 0,
        note: sale.notes || ''
      };
    } else if (type === 'sales_return') {
      const srRes = await window.pharmaAPI.db.query(
        "SELECT * FROM sale_returns WHERE id = ? OR entry_no = ? LIMIT 1",
        [recordId, recordId]
      );
      const sr = srRes?.data?.[0];
      if (!sr) {
        alert('Sales return not found in database.');
        return;
      }

      const partyRes = await window.pharmaAPI.db.query("SELECT * FROM customers WHERE id = ?", [sr.customer_id]);
      party = partyRes?.data?.[0] || {};

      const itemsRes = await window.pharmaAPI.db.query(
        `SELECT sri.*, p.name AS product_name, p.hsn_code, p.packing, m.name AS mfg_name, b.batch_no, b.expiry_date, b.pts AS batch_pts
         FROM sale_return_items sri
         LEFT JOIN products p ON sri.product_id = p.id
         LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
         LEFT JOIN batches b ON sri.batch_id = b.id
         WHERE sri.return_id = ?`,
        [sr.id]
      );

      items = (itemsRes?.data || []).map(item => ({
        mfg: item.mfg_name || '',
        name: item.product_name || 'Product',
        hsn: item.hsn_code || '',
        pack: item.packing || '1x10',
        batch: item.batch_no || '',
        exp: item.expiry_date || '',
        qty: item.qty || 0,
        free: 0,
        mrp: item.mrp || 0,
        pts: party.type === 'wholesale' ? (item.batch_pts || 0) : (item.ptr || item.sale_price || 0),
        ptr: item.ptr || item.sale_price || 0,
        amount: item.net_amount || 0,
        gst: item.gst_rate || 0,
        disc: item.disc_percent || 0
      }));

      invoice = {
        no: sr.entry_no || sr.credit_note_no || sr.id,
        date: sr.return_date,
        type: 'Credit Note',
        discount: sr.discount_amount || 0,
        netPayable: sr.net_amount || 0,
        note: sr.reason || ''
      };
    } else if (type === 'purchase_return') {
      const prRes = await window.pharmaAPI.db.query(
        "SELECT * FROM purchase_returns WHERE id = ? OR entry_no = ? LIMIT 1",
        [recordId, recordId]
      );
      const pr = prRes?.data?.[0];
      if (!pr) {
        alert('Purchase return not found in database.');
        return;
      }

      const partyRes = await window.pharmaAPI.db.query("SELECT * FROM suppliers WHERE id = ?", [pr.supplier_id]);
      party = partyRes?.data?.[0] || {};

      const itemsRes = await window.pharmaAPI.db.query(
        `SELECT pri.*, p.name AS product_name, p.hsn_code, p.packing, m.name AS mfg_name, b.batch_no, b.expiry_date, b.pts AS batch_pts
         FROM purchase_return_items pri
         LEFT JOIN products p ON pri.product_id = p.id
         LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
         LEFT JOIN batches b ON pri.batch_id = b.id
         WHERE pri.return_id = ?`,
        [pr.id]
      );

      items = (itemsRes?.data || []).map(item => ({
        mfg: item.mfg_name || '',
        name: item.product_name || 'Product',
        hsn: item.hsn_code || '',
        pack: item.packing || '1x10',
        batch: item.batch_no || '',
        exp: item.expiry_date || '',
        qty: item.qty || 0,
        free: 0,
        mrp: item.mrp || 0,
        pts: item.batch_pts || item.ptr || 0,
        ptr: item.ptr || item.purchase_price || 0,
        amount: item.net_amount || 0,
        gst: item.gst_rate || 0,
        disc: item.disc_percent || 0
      }));

      invoice = {
        no: pr.entry_no || pr.debit_note_no || pr.id,
        date: pr.return_date,
        type: 'Debit Note',
        discount: pr.discount_amount || 0,
        netPayable: pr.net_amount || 0,
        note: pr.reason || ''
      };
    } else {
      const purRes = await window.pharmaAPI.db.query(
        "SELECT * FROM purchases WHERE id = ? OR entry_no = ? OR invoice_no = ? LIMIT 1",
        [recordId, recordId, recordId]
      );
      const pur = purRes?.data?.[0];
      if (!pur) {
        alert('Purchase invoice not found in database.');
        return;
      }

      const partyRes = await window.pharmaAPI.db.query(
        "SELECT * FROM suppliers WHERE id = ?",
        [pur.supplier_id]
      );
      party = partyRes?.data?.[0] || {};

      const itemsRes = await window.pharmaAPI.db.query(
        `SELECT pi.*, p.name AS product_name, p.hsn_code, p.packing, m.name AS mfg_name, b.batch_no, b.expiry_date, b.pts AS batch_pts
         FROM purchase_items pi
         LEFT JOIN products p ON pi.product_id = p.id
         LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
         LEFT JOIN batches b ON pi.batch_id = b.id
         WHERE pi.purchase_id = ?`,
        [pur.id]
      );

      items = (itemsRes?.data || []).map(item => ({
        mfg: item.mfg_name || '',
        name: item.product_name || 'Product',
        hsn: item.hsn_code || '',
        pack: item.packing || '1x10',
        batch: item.batch_no || '',
        exp: item.expiry_date || '',
        qty: item.qty || 0,
        free: item.free_qty || 0,
        mrp: item.mrp || 0,
        pts: item.batch_pts || item.ptr || 0,
        ptr: item.ptr || item.purchase_price || 0,
        amount: item.net_amount || 0,
        gst: item.gst_rate || 0,
        disc: item.disc_percent || 0
      }));

      invoice = {
        no: pur.invoice_no || pur.entry_no || pur.id,
        date: pur.invoice_date,
        type: pur.payment_mode || 'Credit/Cash',
        discount: pur.discount_amount || 0,
        netPayable: pur.net_amount || 0,
        note: pur.notes || ''
      };
    }

    const html = buildInvoiceHtml({ type, company, party, invoice, items });
    if (action === 'print') {
      await window.pharmaAPI.print.invoice(html);
    } else {
      await window.pharmaAPI.export.pdf(html, 'Invoice_' + (invoice.no || 'Doc').replace(/[^a-z0-9]/gi, '_'));
    }
  } catch (err) {
    console.error('Error exporting past invoice:', err);
    alert('Failed to process invoice: ' + err.message);
  }
}

export async function normalizeInvoiceNumbers() {
  try {
    const res = await window.pharmaAPI.db.query("SELECT id, invoice_no, date, created_at FROM sales ORDER BY date ASC, created_at ASC, rowid ASC");
    if (res?.data && res.data.length > 0) {
      // Check if any invoice number is legacy random (> 5000) or irregular
      const needRenumbering = res.data.some((s, idx) => {
        const m = (s.invoice_no || '').match(/\d+$/);
        const n = m ? parseInt(m[0], 10) : 999999;
        return isNaN(n) || n >= 5000 || n !== idx + 1;
      });

      if (needRenumbering) {
        let seq = 1;
        for (const s of res.data) {
          const newInvNo = `INV-${seq}`;
          if (s.invoice_no !== newInvNo) {
            await window.pharmaAPI.db.query("UPDATE sales SET invoice_no = ? WHERE id = ?", [newInvNo, s.id]);
            try {
              await window.pharmaAPI.db.query("UPDATE receipts SET notes = ? WHERE notes LIKE ? OR (customer_id = ? AND amount = (SELECT net_amount FROM sales WHERE id = ?))", [`Against Sale ${newInvNo}`, `%${s.invoice_no}%`, s.customer_id, s.id]);
            } catch (e) {}
          }
          seq++;
        }
      }
    }
  } catch (err) {
    console.error("Failed to normalize invoice numbers:", err);
  }
}

export default buildInvoiceHtml;
