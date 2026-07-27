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
 * buildInvoiceHtml — returns a printable A4 HTML string.
 * @param {Object}   opts
 * @param {'sales'|'purchase'} opts.type
 * @param {Object}   opts.company  seller company profile (companies row, snake_case)
 * @param {Object}   opts.party    bill-to customer / from supplier
 * @param {Object}   opts.invoice  { no, date, type (Credit/Cash), discount, netPayable }
 * @param {Array}    opts.items    [{ mfg, name, hsn, pack, batch, exp, qty, free, mrp, pts, ptr, amount, gst, disc }]
 */
export function buildInvoiceHtml({ type = 'sales', company = {}, party = {}, invoice = {}, items = [] } = {}) {
  const isPurchase = type === 'purchase';
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

    unitsSum += num(it.qty);
    taxableSum += taxable;
    gstSum += gstAmt;

    const slabKey = [5, 12, 18, 28, 0].includes(rate) ? rate : 0;
    slabs[slabKey].taxable += taxable;
    slabs[slabKey].cgst += gstAmt / 2;
    slabs[slabKey].sgst += gstAmt / 2;

    return `<tr>
      <td>${esc(val(it.mfg))}</td>
      <td class="ln">${esc(val(it.name))}</td>
      <td class="c">${esc(val(it.hsn))}</td>
      <td class="c">${esc(val(it.pack))}</td>
      <td class="c">${esc(val(it.batch))}</td>
      <td class="c">${esc(val(it.exp))}</td>
      <td class="r">${qtyInt(it.qty)}</td>
      <td class="r">${qtyInt(it.free)}</td>
      <td class="r">${money(it.mrp)}</td>
      <td class="r">${it.pts !== undefined && it.pts !== '' && it.pts !== null ? money(it.pts) : ''}</td>
      <td class="r">${money(it.ptr)}</td>
      <td class="r">${money(it.amount)}</td>
      <td class="c">${esc(val(it.gst, 0))}</td>
      <td class="c">${esc(val(it.disc, 0))}</td>
    </tr>`;
  }).join('');

  const grand = taxableSum + gstSum;
  const lessDisc = num(invoice.discount);
  const subTotalGross = taxableSum + lessDisc;
  const netPayable = invoice.netPayable !== undefined && invoice.netPayable !== null
    ? num(invoice.netPayable)
    : Math.round(grand);
  const rounding = netPayable - grand;

  const companyName = esc(val(company.name, 'Company Name'));
  const partyLabel = isPurchase ? 'From (Supplier)' : 'To';
  const partyRoleTitle = isPurchase ? 'Supplier Details' : 'Bill To';

  // GST summary rows (only slabs that carry a taxable value, but keep 0% last if present)
  const slabOrder = [5, 12, 18, 28, 0];
  const gstSummaryRows = slabOrder.map((s) => {
    const row = slabs[s];
    if (row.taxable === 0 && row.cgst === 0) return '';
    return `<tr>
      <td class="c">${s}%</td>
      <td class="r">${money(row.taxable)}</td>
      <td class="r">${money(row.cgst)}</td>
      <td class="r">${money(row.sgst)}</td>
    </tr>`;
  }).join('') || `<tr><td class="c">-</td><td class="r">0.00</td><td class="r">0.00</td><td class="r">0.00</td></tr>`;

  const dlLine1 = val(party.drug_license1 ?? party.drug_license);
  const dlLine2 = val(party.drug_license2);

  return `<!-- PharmaFlow ${isPurchase ? 'Purchase' : 'Sales'} Invoice -->
<div style="font-family:'Courier New',monospace;color:#000;background:#fff;width:190mm;margin:0 auto;padding:6mm 4mm;box-sizing:border-box;font-size:11px;">
  <style>
    .inv-table{width:100%;border-collapse:collapse;}
    .inv-table th,.inv-table td{border:1px solid #000;padding:2px 4px;font-size:10px;vertical-align:top;}
    .inv-table th{background:#f0f0f0;text-align:center;font-weight:bold;}
    .inv-table td.c{text-align:center;}
    .inv-table td.r{text-align:right;}
    .inv-table td.ln{text-align:left;}
    .no-border td{border:none;padding:1px 2px;}
    .box{border:1px solid #000;padding:4px 6px;}
  </style>

  <!-- Header -->
  <table class="no-border" style="width:100%;margin-bottom:4px;">
    <tr>
      <td style="width:60%;vertical-align:top;">
        <div style="text-align:center;">
          <div style="font-size:11px;letter-spacing:2px;font-weight:bold;">INVOICE / TAX INVOICE</div>
          <div style="font-size:16px;font-weight:bold;margin-top:2px;">${companyName}</div>
          <div>${esc(val(company.address))}</div>
          <div>${esc(val(company.city))}${company.city && company.pincode ? ' - ' : ''}${esc(val(company.pincode))}${company.state ? ', ' + esc(val(company.state)) : ''}</div>
          <div>${company.phone ? 'Ph: ' + esc(val(company.phone)) : ''}${company.phone && company.email ? '  ' : ''}${company.email ? 'Email: ' + esc(val(company.email)) : ''}</div>
        </div>
      </td>
      <td style="width:40%;vertical-align:top;">
        <div class="box" style="font-size:10px;line-height:1.5;">
          <div><b>GSTIN:</b> ${esc(val(company.gstin))}</div>
          <div><b>D.L.No 20B:</b> ${esc(val(company.drug_license_20b))}</div>
          <div><b>D.L.No 21B:</b> ${esc(val(company.drug_license_21b))}</div>
          <div><b>FSSAI:</b> ${esc(val(company.fssai_license))}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Party + invoice meta -->
  <table class="no-border" style="width:100%;margin-bottom:4px;">
    <tr>
      <td style="width:60%;vertical-align:top;">
        <div class="box" style="min-height:70px;">
          <div style="font-weight:bold;text-decoration:underline;margin-bottom:2px;">${partyLabel}: ${partyRoleTitle}</div>
          <div style="font-weight:bold;">${esc(val(party.name))}</div>
          <div>${esc(val(party.address))}</div>
          <div>${esc(val(party.city))}${party.city && party.pincode ? ' - ' : ''}${esc(val(party.pincode))}${party.state ? ', ' + esc(val(party.state)) : ''}</div>
          <div><b>D.L.No1:</b> ${esc(dlLine1)}${dlLine2 ? '  <b>DL.No2:</b> ' + esc(dlLine2) : ''}</div>
          <div><b>GSTIN:</b> ${esc(val(party.gstin))}</div>
        </div>
      </td>
      <td style="width:40%;vertical-align:top;">
        <div class="box" style="min-height:70px;">
          <table class="no-border" style="width:100%;">
            <tr><td><b>Invoice No</b></td><td style="text-align:right;">${esc(val(invoice.no))}</td></tr>
            <tr><td><b>Inv Date</b></td><td style="text-align:right;">${esc(val(invoice.date))}</td></tr>
            <tr><td><b>Type</b></td><td style="text-align:right;">${esc(val(invoice.type, 'Credit'))}</td></tr>
          </table>
        </div>
      </td>
    </tr>
  </table>

  <!-- Line items -->
  <table class="inv-table">
    <thead>
      <tr>
        <th style="width:8%;">MFG</th>
        <th style="width:20%;">PRODUCT NAME</th>
        <th>HSN.CODE</th>
        <th>PACK</th>
        <th>BATCH</th>
        <th>EXP</th>
        <th>Qty</th>
        <th>Free</th>
        <th>M.R.P</th>
        <th>P.T.S</th>
        <th>P.T.R</th>
        <th>Amount</th>
        <th>GST%</th>
        <th>Dis%</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="14" style="text-align:center;">No items</td></tr>`}
    </tbody>
  </table>

  <!-- Summary blocks -->
  <table class="no-border" style="width:100%;margin-top:6px;">
    <tr>
      <td style="width:55%;vertical-align:top;">
        <table class="inv-table">
          <thead>
            <tr><th>GST%</th><th>Taxable Value</th><th>CGST Amt</th><th>SGST Amt</th></tr>
          </thead>
          <tbody>${gstSummaryRows}</tbody>
        </table>
      </td>
      <td style="width:45%;vertical-align:top;padding-left:8px;">
        <table class="no-border" style="width:100%;font-size:11px;">
          <tr><td>Items</td><td style="text-align:right;">${list.length}</td></tr>
          <tr><td>Units (Qty)</td><td style="text-align:right;">${money(unitsSum).replace('.00','')}</td></tr>
          <tr><td>Sub Total</td><td style="text-align:right;">${money(subTotalGross)}</td></tr>
          <tr><td>Less Disc</td><td style="text-align:right;">${money(lessDisc)}</td></tr>
          <tr><td>GST Total</td><td style="text-align:right;">${money(gstSum)}</td></tr>
          <tr><td>Rounding</td><td style="text-align:right;">${money(rounding)}</td></tr>
          <tr style="font-weight:bold;font-size:13px;border-top:1px solid #000;">
            <td style="border-top:1px solid #000;padding-top:3px;">NET PAYABLE</td>
            <td style="text-align:right;border-top:1px solid #000;padding-top:3px;">&#8377; ${money(netPayable)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Amount in words -->
  <div class="box" style="margin-top:6px;font-size:11px;">
    <b>Amount in Words:</b> ${esc(amountInWords(netPayable))}
  </div>

  <!-- Footer -->
  <table class="no-border" style="width:100%;margin-top:10px;">
    <tr>
      <td style="width:60%;vertical-align:bottom;font-size:9px;">
        Goods covered under this bill donot contravene section 18 of the drugs &amp; cosmetics act 1940.
        <div style="margin-top:4px;">E. &amp; O.E.</div>
      </td>
      <td style="width:40%;text-align:center;vertical-align:bottom;">
        <div style="font-weight:bold;">For ${companyName}</div>
        <div style="height:36px;"></div>
        <div style="border-top:1px solid #000;padding-top:2px;">${esc(val(company.authorized_sign, 'Authorised Signatory'))}</div>
      </td>
    </tr>
  </table>
</div>`;
}

export default buildInvoiceHtml;
