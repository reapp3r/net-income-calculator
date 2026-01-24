/**
 * @module ukProgressive
 * UK Progressive Tax Calculation
 *
 * Calculates UK income tax using tax bands and personal allowance.
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
 * @param {number} grossIncome - Gross income
 * @param {number} year - Tax year
 * @param {Array} deductions - Deduction data from reference files
 * @returns {number} Personal allowance amount
 */
function calculateUKPersonalAllowance(grossIncome, year, deductions) {
  const deductionData = deductions.find(d => d.Year === year && d.Type === 'PersonalAllowance');
  
  if (!deductionData) {
    throw new Error(`Personal allowance data not found for year ${year}`);
  }
  
  const baseAllowance = parseFloat(deductionData.Amount);
  const reductionThreshold = parseFloat(deductionData.ReductionThreshold) || 100000;
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
  calculateUKPersonalAllowance
};