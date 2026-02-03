/**
 * @module socialSecurity
 * Social Security Calculator
 *
 * Rules:
 * - Employment: Rate% of gross (no annual cap)
 * - Freelance: Rate% of coefficient% of gross (services/goods), capped monthly
 * - Dividend: 0% (no social security)
 */

const { getTemporalMatch } = require('../../temporal');

function getSSDataForYear(year, socialSecurityData) {
  const ssData = getTemporalMatch(socialSecurityData, year);
  if (!ssData) {
    throw new Error(`No social security data found for year ${year}`);
  }
  return ssData;
}

function calculateSocialSecurity(
  grossIncome,
  incomeType,
  freelanceType = 'services',
  year,
  socialSecurityData
) {
  if (!grossIncome || grossIncome <= 0) return 0;

  const ssData = getSSDataForYear(year, socialSecurityData);

  switch (incomeType) {
    case 'employment':
      return grossIncome * ssData.EmploymentRate;

    case 'freelance':
      const coefficient = ssData.FreelanceCoefficient;
      const taxableBase = grossIncome * coefficient;
      const ssAmount = taxableBase * ssData.FreelanceRate;
      const annualCap = ssData.FreelanceCapMonthly * 12;
      return Math.min(ssAmount, annualCap);

    case 'dividend':
      return grossIncome * ssData.DividendRate;

    default:
      return 0;
  }
}

function getFreelanceTaxableBase(grossIncome, year, socialSecurityData) {
  const ssData = getSSDataForYear(year, socialSecurityData);
  return grossIncome * ssData.FreelanceCoefficient;
}

module.exports = {
  calculateSocialSecurity,
  getFreelanceTaxableBase,
  getSSDataForYear,
};
