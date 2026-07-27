// units.js
// Pure, dependency-free helpers for a SINGLE consistent inventory base unit: STRIPS.
//
// Invariant model (see refactor spec):
//  - batches.current_qty is a whole number of STRIPS.
//  - products.conversion_factor is the pack size = strips per box (default 10).
//  - Prices (mrp/ptr/pts/purchase_price) are always stored PER STRIP.
//
// This module has NO window / DOM / React dependencies so it is fully unit-testable
// in plain Node (e.g. `node -e "require('./src/utils/units.js')"`).

/**
 * Normalise a pack size (strips per box). Falsy / non-positive values fall back to 1
 * so callers never divide by zero or multiply by garbage.
 * @param {number|string} conversionFactor strips per box
 * @returns {number} a positive pack size (>= 1)
 */
export function packSize(conversionFactor) {
  const n = Number(conversionFactor);
  return n > 0 ? n : 1;
}

/**
 * Convert an entered quantity to STRIPS.
 * @param {number|string} qty quantity in the given unit
 * @param {'box'|'strip'} unit unit the qty was entered in
 * @param {number|string} conversionFactor strips per box
 * @returns {number} quantity expressed in strips
 */
export function toStrips(qty, unit, conversionFactor) {
  const q = Number(qty) || 0;
  const pack = packSize(conversionFactor);
  return unit === 'box' ? q * pack : q;
}

/**
 * Convert a strip count to a (possibly fractional) number of boxes.
 * @param {number|string} strips quantity in strips
 * @param {number|string} conversionFactor strips per box
 * @returns {number} quantity in boxes (may be fractional)
 */
export function toBoxesFloat(strips, conversionFactor) {
  const s = Number(strips) || 0;
  return s / packSize(conversionFactor);
}

/**
 * Split a strip count into whole boxes + loose strips.
 * @param {number|string} strips quantity in strips
 * @param {number|string} conversionFactor strips per box
 * @returns {{ boxes: number, strips: number }}
 */
export function splitStrips(strips, conversionFactor) {
  const s = Math.max(0, Math.round(Number(strips) || 0));
  const pack = packSize(conversionFactor);
  return { boxes: Math.floor(s / pack), strips: s % pack };
}

/**
 * Format a strip count for display, e.g. "100 Strips (10 Box)".
 * Safe for missing / undefined values. When pack <= 1 (or no whole boxes) it
 * shows just the strip count, e.g. "7 Strips".
 * @param {number|string} strips quantity in strips
 * @param {number|string} conversionFactor strips per box
 * @param {string} [saleUnit='Strip'] label for the base unit
 * @returns {string}
 */
export function formatStock(strips, conversionFactor, saleUnit = 'Strip') {
  const s = Math.round(Number(strips) || 0);
  const unit = saleUnit || 'Strip';
  const base = `${s} ${unit}${s === 1 ? '' : 's'}`;
  const pack = packSize(conversionFactor);
  if (pack <= 1) return base;
  const { boxes, strips: loose } = splitStrips(s, pack);
  if (boxes <= 0) return base;
  const boxPart = loose > 0 ? `${boxes} Box + ${loose}` : `${boxes} Box`;
  return `${base} (${boxPart})`;
}

/**
 * Convert an entered price to a PER-STRIP price.
 * @param {number|string} price price in the given unit
 * @param {'box'|'strip'} unit unit the price was entered in
 * @param {number|string} conversionFactor strips per box
 * @returns {number} price per strip
 */
export function perStripPrice(price, unit, conversionFactor) {
  const p = Number(price) || 0;
  const pack = packSize(conversionFactor);
  return unit === 'box' ? p / pack : p;
}

export default {
  packSize,
  toStrips,
  toBoxesFloat,
  splitStrips,
  formatStock,
  perStripPrice,
};
