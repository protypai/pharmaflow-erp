/**
 * Server-side GST / totals calculator.
 *
 * We never trust client-sent subtotal / tax / netAmount. Instead we recompute taxable amount,
 * CGST/SGST/IGST and net from the line items (qty, unit price, discount, gstRate, gstType) and
 * derive header totals from those lines. The header fields produced here are exactly the ones the
 * reports read (taxableAmount, cgstAmount, sgstAmount, igstAmount, netAmount).
 */

export type GstType = 'exclusive' | 'inclusive';

export interface RawLine {
  qty: number;
  unitPrice: number; // salePrice (sales) or purchasePrice (purchase)
  discPercent?: number;
  discAmount?: number;
  gstRate: number;
  isIgst?: boolean; // inter-state supply => IGST, otherwise CGST + SGST split
}

export interface ComputedLine {
  taxableAmt: number;
  cgst: number;
  sgst: number;
  igst: number;
  netAmount: number;
  discAmount: number;
  gstRate: number;
}

export interface ComputedHeader {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  netAmount: number;
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeLine(line: RawLine, gstType: GstType): ComputedLine {
  const qty = Number(line.qty) || 0;
  const price = Number(line.unitPrice) || 0;
  const rate = Number(line.gstRate) || 0;
  const gross = qty * price;

  const disc =
    line.discAmount != null && line.discAmount !== undefined
      ? Number(line.discAmount) || 0
      : line.discPercent
        ? (gross * (Number(line.discPercent) || 0)) / 100
        : 0;

  let taxable: number;
  let tax: number;
  if (gstType === 'inclusive') {
    const netBeforeTax = gross - disc;
    taxable = netBeforeTax / (1 + rate / 100);
    tax = netBeforeTax - taxable;
  } else {
    taxable = gross - disc;
    tax = (taxable * rate) / 100;
  }

  const igst = line.isIgst ? tax : 0;
  const cgst = line.isIgst ? 0 : tax / 2;
  const sgst = line.isIgst ? 0 : tax / 2;

  return {
    taxableAmt: round2(taxable),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    netAmount: round2(taxable + tax),
    discAmount: round2(disc),
    gstRate: rate,
  };
}

export function computeHeader(
  lines: Array<{ qty: number; unitPrice: number; computed: ComputedLine }>,
  roundOff = 0,
): ComputedHeader {
  let subtotal = 0;
  let discountAmount = 0;
  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  for (const line of lines) {
    subtotal += (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
    discountAmount += line.computed.discAmount;
    taxableAmount += line.computed.taxableAmt;
    cgstAmount += line.computed.cgst;
    sgstAmount += line.computed.sgst;
    igstAmount += line.computed.igst;
  }

  return {
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount),
    taxableAmount: round2(taxableAmount),
    cgstAmount: round2(cgstAmount),
    sgstAmount: round2(sgstAmount),
    igstAmount: round2(igstAmount),
    netAmount: round2(taxableAmount + cgstAmount + sgstAmount + igstAmount + (Number(roundOff) || 0)),
  };
}
