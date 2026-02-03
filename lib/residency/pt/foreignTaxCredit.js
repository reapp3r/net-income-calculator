/**
 * @module foreignTaxCredit
 * Foreign Tax Credit (FTC) Calculator
 *
 * Implements OECD Model Tax Convention Article 23A/23B relief for double taxation.
 *
 * Calculation:
 * 1. Calculate tax attributable to foreign income:
 *    attributableTax = totalTax * (foreignIncome / totalIncome)
 *
 * 2. Credit limited to lesser of:
 *    - Foreign tax actually paid
 *    - Attributable Portuguese tax on that income
 *
 * Limitations:
 * - Credit cannot exceed tax attributable to foreign income
 * - Unused credits generally cannot be carried forward in Portugal
 * - Per-country limitation (cannot pool foreign taxes across countries)
 *
 * References:
 * - OECD Model Tax Convention (2017), Article 23A/23B
 * - Portugal-UK DTT (1968, updated 2025)
 * - Portugal-Germany DTT (1980)
 */

const { getTemporalMatch } = require('../../temporal');

/**
 * Calculate Foreign Tax Credit
 *
 * @param {number} totalIncome - Total taxable income worldwide
 * @param {number} foreignIncome - Income from foreign source
 * @param {number} totalTax - Total Portuguese tax on worldwide income
 * @param {number} foreignTaxPaid - Tax already paid to foreign country
 * @returns {Object} FTC calculation result
 */
function calculateForeignTaxCredit(
  totalIncome,
  foreignIncome,
  totalTax,
  foreignTaxPaid
) {
  if (!totalIncome || totalIncome <= 0) {
    return {
      foreignIncome: 0,
      attributableTax: 0,
      foreignTaxPaid,
      creditLimit: 0,
      allowedCredit: 0,
      unusedCredit: 0,
      note: 'No total income',
    };
  }

  if (!foreignIncome || foreignIncome <= 0) {
    return {
      foreignIncome: 0,
      attributableTax: 0,
      foreignTaxPaid: 0,
      creditLimit: 0,
      allowedCredit: 0,
      unusedCredit: 0,
      note: 'No foreign income',
    };
  }

  // Calculate proportion of foreign income
  const foreignRatio = foreignIncome / totalIncome;

  // Calculate tax attributable to foreign income
  const attributableTax = totalTax * foreignRatio;

  // Credit limited to lesser of foreign tax paid or attributable tax
  const creditLimit = Math.min(foreignTaxPaid, attributableTax);

  // Actual credit allowed (cannot exceed credit limit)
  const allowedCredit = creditLimit;

  // Unused credit (generally lost in Portugal)
  const unusedCredit = foreignTaxPaid - allowedCredit;

  return {
    foreignIncome,
    totalIncome,
    foreignRatio,
    attributableTax,
    foreignTaxPaid,
    creditLimit,
    allowedCredit,
    unusedCredit: Math.max(0, unusedCredit),
    note:
      unusedCredit > 0
        ? 'Unused credit lost (Portugal FTC limitation)'
        : 'Full credit applied',
  };
}

function getWithholdingRate(
  year,
  sourceCountry,
  incomeType,
  foreignTaxCreditData
) {
  const ftcData = getTemporalMatch(
    foreignTaxCreditData,
    year,
    'SourceCountry',
    sourceCountry
  );

  if (!ftcData) {
    return 0;
  }

  const fieldMap = {
    employment: 'WithholdingRateEmployment',
    freelance: 'WithholdingRateFreelance',
    dividend: 'WithholdingRateDividend',
  };

  const field = fieldMap[incomeType];
  return field ? ftcData[field] || 0 : 0;
}

module.exports = {
  calculateForeignTaxCredit,
  getWithholdingRate,
};
