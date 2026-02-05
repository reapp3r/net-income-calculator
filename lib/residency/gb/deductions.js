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

/**
 * Calculate UK Personal Savings Allowance (PSA)
 * Allowance is tiered based on the taxpayer's income tax band.
 * Uses reference data to determine band by finding the tax bracket
 * where the adjusted net income falls, then looking up PSA amount from
 * the reference data by tax band.
 * @param {number} adjustedNetIncome - Adjusted net income to determine tax band
 * @param {number} year - Tax year
 * @param {Array} taxBrackets - Tax bracket data to determine band
 * @param {Array} deductions - Deduction data from reference files
 * @returns {number} Personal Savings Allowance amount
 */
function calculateUKPersonalSavingsAllowance(
  adjustedNetIncome,
  year,
  taxBrackets,
  deductions
) {
  let taxBand = null;

  for (const bracket of taxBrackets) {
    const minIncome = parseFloat(bracket.MinIncome);
    const maxIncome =
      bracket.MaxIncome !== null ? parseFloat(bracket.MaxIncome) : Infinity;

    if (adjustedNetIncome >= minIncome && adjustedNetIncome < maxIncome) {
      taxBand = bracket.TaxBand;
      break;
    }
  }

  if (!taxBand) {
    const highestBracket = taxBrackets[taxBrackets.length - 1];
    if (
      highestBracket &&
      adjustedNetIncome >= parseFloat(highestBracket.MinIncome)
    ) {
      taxBand = highestBracket.TaxBand;
    }
  }

  if (!taxBand) {
    return 0;
  }

  const psaData = deductions.find(
    d =>
      d.Year === year &&
      d.Type === 'PersonalSavingsAllowance' &&
      d.TaxBand === taxBand
  );

  if (!psaData) {
    throw new Error(
      `Personal Savings Allowance data not found for year ${year}, band ${taxBand}`
    );
  }

  return parseFloat(psaData.Amount);
}

module.exports = {
  calculateUKTradingAllowance,
  calculateUKDividendAllowance,
  calculateUKPersonalSavingsAllowance,
};
