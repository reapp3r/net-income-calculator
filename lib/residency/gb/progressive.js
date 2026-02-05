/**
 * @module ukProgressive
 * UK Progressive Tax Calculation
 *
 * Calculates UK income tax using tax bands and personal allowance.
 *
 * KEY FEATURE: The 60% Marginal Tax Trap
 * When income exceeds the Personal Allowance reduction threshold (defined in Deductions.csv),
 * the allowance is tapered at the reduction rate. For income in the higher-rate tax band,
 * this creates an effective marginal rate equal to:
 * - Higher-rate tax (from TaxBrackets.csv) + (reduction rate × higher-rate tax)
 *
 * Example: If higher-rate is 40% and reduction rate is 50%, effective marginal rate = 40% + (50% × 40%) = 60%
 *
 * This is implemented through the Personal Allowance reduction mechanism
 * in calculateUKPersonalAllowance(), not as a separate tax bracket.
 */

/**
 * Calculate UK income tax using progressive tax bands
 * @param {number} taxableIncome - Taxable income after personal allowance
 * @param {number} year - Tax year
 * @param {Array} taxBands - Tax band data from reference files
 * @returns {number} Tax amount
 */
function calculateUKProgressiveTax(taxableIncome, year, taxBands) {
  const bands = taxBands.filter(band => band.Year === year);

  if (bands.length === 0) {
    throw new Error(`No tax bands found for year ${year}`);
  }

  let tax = 0;
  let remainingIncome = taxableIncome;

  // Sort bands by min income
  bands.sort((a, b) => a.MinIncome - b.MinIncome);

  for (const band of bands) {
    if (remainingIncome <= 0) break;

    const minIncome = parseFloat(band.MinIncome);
    const maxIncome = parseFloat(band.MaxIncome) || Infinity;
    const rate = parseFloat(band.Rate);

    // Calculate taxable portion in this band
    const bandStart = Math.max(minIncome, 0);
    const bandEnd = maxIncome;
    const taxableInBand = Math.min(remainingIncome, bandEnd - bandStart);

    if (taxableInBand > 0) {
      tax += taxableInBand * rate;
      remainingIncome -= taxableInBand;
    }
  }

  return tax;
}

/**
 * Calculate UK personal allowance reduction
 *
 * THE 60% MARGINAL TAX TRAP EFFECT:
 * When gross income exceeds the reduction threshold, the Personal Allowance is tapered.
 * The reduction threshold, base allowance amount, and reduction rate are defined in Deductions.csv.
 * For income taxed at the higher rate, this creates an effective marginal rate higher than the
 * nominal higher-rate tax bracket.
 *
 * Example: If reduction threshold is £100,000, reduction rate is 50% (i.e., £1 allowance lost
 * per £2 earned above threshold), and higher-rate tax is 40%, then for every £100 earned in
 * this band: £40 goes to income tax + £10 allowance lost × 40% = £4, so only £56 is kept.
 *
 * @param {number} grossIncome - Gross income
 * @param {number} year - Tax year
 * @param {Array} deductions - Deduction data from reference files
 * @returns {number} Personal allowance amount
 */
function calculateUKPersonalAllowance(grossIncome, year, deductions) {
  const deductionData = deductions.find(
    d => d.Year === year && d.Type === 'PersonalAllowance'
  );

  if (!deductionData) {
    throw new Error(`Personal allowance data not found for year ${year}`);
  }

  const baseAllowance = parseFloat(deductionData.Amount);
  const reductionThreshold =
    parseFloat(deductionData.ReductionThreshold) || 100000;
  const reductionRate = parseFloat(deductionData.ReductionRate) || 0.5;

  // Calculate allowance reduction for high earners
  if (grossIncome > reductionThreshold) {
    const excess = grossIncome - reductionThreshold;
    const reduction = excess * reductionRate;
    return Math.max(0, baseAllowance - reduction);
  }

  return baseAllowance;
}

module.exports = {
  calculateUKProgressiveTax,
  calculateUKPersonalAllowance,
};
