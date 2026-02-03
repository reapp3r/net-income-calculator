/**
 * @module ukDeductions
 * UK Tax Deductions and Allowances
 *
 * Handles UK-specific deductions like personal allowance and trading allowance.
 */

/**
 * Calculate UK trading allowance for freelance income
 * @param {number} grossIncome - Gross freelance income
 * @param {number} year - Tax year
 * @param {Array} deductions - Deduction data from reference files
 * @returns {number} Trading allowance amount
 */
function calculateUKTradingAllowance(grossIncome, year, deductions) {
  const tradingData = deductions.find(
    d => d.Year === year && d.Type === 'TradingAllowance'
  );

  if (!tradingData) {
    throw new Error(`Trading allowance data not found for year ${year}`);
  }

  const allowance = parseFloat(tradingData.Amount);
  const maxIncome = parseFloat(tradingData.MaxIncome) || Infinity;

  // Trading allowance only applies up to max income threshold
  if (grossIncome <= maxIncome) {
    return Math.min(allowance, grossIncome);
  }

  return allowance;
}

/**
 * Calculate UK dividend allowance
 * @param {number} grossIncome - Gross dividend income
 * @param {number} year - Tax year
 * @param {Array} deductions - Deduction data from reference files
 * @returns {number} Dividend allowance amount
 */
function calculateUKDividendAllowance(grossIncome, year, deductions) {
  const dividendData = deductions.find(
    d => d.Year === year && d.Type === 'DividendAllowance'
  );

  if (!dividendData) {
    throw new Error(`Dividend allowance data not found for year ${year}`);
  }

  const allowance = parseFloat(dividendData.Amount);

  return Math.min(allowance, grossIncome);
}

module.exports = {
  calculateUKTradingAllowance,
  calculateUKDividendAllowance,
};
