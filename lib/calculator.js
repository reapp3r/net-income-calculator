/**
 * @module calculator
 *
 * Multi-country net income calculator with automatic tax residency determination.
 * Delegates all country-specific logic to residency implementations.
 */

const { loadData } = require('./loader');
const { getResidency } = require('./residency');
const { ResidencyDetermination } = require('./residency/determination');
const { convertCurrency } = require('./utils/currency');

/**
 * Calculate net income from income records
 *
 * @param {Object} data - Complete dataset from loadData()
 * @param {Object} _options - Calculation options
 * @returns {Object} Results with monthly, annual, byType arrays
 */
function calculateNetIncome(data, _options = {}) {
  if (!data || !data.incomeRecords) {
    throw new Error('Income records required');
  }

  if (!Array.isArray(data.incomeRecords) || data.incomeRecords.length === 0) {
    throw new Error('incomeRecords must be a non-empty array');
  }

  if (!data.referenceData) {
    throw new Error('Reference data required');
  }

  // Initialize country residency implementations
  const countries = new Map();
  for (const [countryCode, refData] of Object.entries(data.referenceData)) {
    countries.set(countryCode, getResidency(countryCode, refData));
  }

  // Create residency determination orchestrator
  const determination = new ResidencyDetermination(countries);

  // Determine residency for all years
  const residencyByYear = determination.determineResidency(
    data,
    data.taxResidency || {}
  );

  const results = {
    monthly: [],
    annual: [],
    annualByType: [],
  };

  // Iterate through years (sorted)
  const sortedYears = Array.from(residencyByYear.keys()).sort((a, b) => a - b);

  for (const year of sortedYears) {
    const periods = residencyByYear.get(year);

    // Process each residency period in the year
    for (const period of periods) {
      const residencyCountry = period.country;
      const residencyImpl = countries.get(residencyCountry);

      if (!residencyImpl) {
        throw new Error(
          `Residency implementation not found for ${residencyCountry}`
        );
      }

      // Get all income for this period (in original currencies)
      const periodIncomeRecords = getIncomeForPeriod(
        period,
        data.incomeRecords
      );

      // Process each income record
      const periodMonthlyResults = [];
      const periodIncomeRecordsWithNet = [];

      for (const record of periodIncomeRecords) {
        // Convert gross income to residency currency for tax calculation
        const localGross = convertCurrency(
          record.amount,
          record.currency,
          residencyImpl.getCurrency(),
          data.exchangeRates,
          record.year,
          record.month
        );

        // Calculate taxes for this record
        const taxResult = residencyImpl.calculateTax(
          localGross,
          record.incomeType,
          {
            residency: period,
            specialRegime: period.specialRegimeStatus,
            year: record.year,
            sourceCountry: record.sourceCountry,
            aggregate: record.aggregate,
            freelanceType: record.freelanceType,
            expenses: record.expenses,
            incomeRecord: record,
          }
        );

        // Enrich result with metadata
        const fullResult = {
          ...record,
          ...taxResult,
          ResidencyCountry: residencyCountry,
          SpecialRegimeStatus: period.specialRegimeStatus
            ? period.specialRegimeStatus.regime || 'Standard'
            : 'Standard',
        };

        periodMonthlyResults.push(fullResult);
        periodIncomeRecordsWithNet.push(fullResult);
      }

      // Calculate annual summary for this residency period
      const annualResult = calculateAnnualSummaryForPeriod(
        period,
        periodMonthlyResults,
        residencyImpl
      );
      const typeResults = calculateAnnualTypeResultsForPeriod(
        period,
        periodMonthlyResults
      );

      results.monthly.push(...periodMonthlyResults);
      results.annual.push(annualResult);
      results.annualByType.push(...typeResults);
    }
  }

  return results;
}

/**
 * Filter income records for a specific residency period
 *
 * @param {Object} period - Residency period definition
 * @param {Array} incomeRecords - All income records (or Map)
 * @returns {Array} Records falling within period
 */
function getIncomeForPeriod(period, incomeRecords) {
  // Handle if incomeRecords is a Map (grouped by country) or Array
  let allRecords = [];
  if (Array.isArray(incomeRecords)) {
    allRecords = incomeRecords;
  } else if (incomeRecords instanceof Map) {
    for (const records of incomeRecords.values()) {
      allRecords.push(...records);
    }
  } else {
    // If it's an object (legacy loader might return object?)
    allRecords = Object.values(incomeRecords).flat();
  }

  return allRecords.filter(record => {
    // Check year
    if (record.year !== period.year) return false;

    // Check start date (inclusive)
    if (period.startMonth && period.startDay) {
      if (record.month < period.startMonth) return false;
      if (record.month === period.startMonth && record.day < period.startDay)
        return false;
    }

    // Check end date (inclusive)
    if (period.endMonth && period.endDay) {
      if (record.month > period.endMonth) return false;
      if (record.month === period.endMonth && record.day > period.endDay)
        return false;
    }

    return true;
  });
}

/**
 * Calculate annual tax summary for a residency period
 *
 * @param {Object} period - Residency period
 * @param {Array} monthlyResults - Calculated monthly results
 * @param {Object} _residencyImpl - Residency implementation
 * @returns {Object} Annual summary
 */
function calculateAnnualSummaryForPeriod(
  period,
  monthlyResults,
  residencyImpl
) {
  if (residencyImpl.calculateAnnualSummary) {
    return residencyImpl.calculateAnnualSummary(period, monthlyResults);
  }

  // Default implementation if country doesn't provide one
  let totalGross = 0;
  let totalTax = 0;
  let totalSocialSecurity = 0;
  let totalPersonalDeductions = 0;
  let totalSolidarityTax = 0;
  let netIncome = 0;

  for (const result of monthlyResults) {
    const grossIncome =
      result.GrossIncome !== undefined
        ? result.GrossIncome
        : result.amount !== undefined
          ? result.amount
          : 0;
    const taxAmount =
      result.TaxAmount !== undefined
        ? result.TaxAmount
        : result.taxAmount !== undefined
          ? result.taxAmount
          : 0;
    const socialSecurity =
      result.SocialSecurity !== undefined
        ? result.SocialSecurity
        : result.socialSecurity !== undefined
          ? result.socialSecurity
          : 0;
    const personalDeductions =
      result.PersonalDeductions !== undefined
        ? result.PersonalDeductions
        : result.personalDeductions !== undefined
          ? result.personalDeductions
          : 0;
    const solidarityTax =
      result.SolidarityTax !== undefined
        ? result.SolidarityTax
        : result.solidarityTax !== undefined
          ? result.solidarityTax
          : 0;
    const net =
      result.NetIncome !== undefined
        ? result.NetIncome
        : result.netIncome !== undefined
          ? result.netIncome
          : 0;

    totalGross += parseFloat(grossIncome);
    totalTax += parseFloat(taxAmount);
    totalSocialSecurity += parseFloat(socialSecurity);
    totalPersonalDeductions += parseFloat(personalDeductions);
    totalSolidarityTax += parseFloat(solidarityTax);
    netIncome += parseFloat(net);
  }

  return {
    Year: period.year,
    ResidencyCountry: period.country,
    GrossIncome: totalGross.toFixed(2),
    TaxAmount: totalTax.toFixed(2),
    SocialSecurity: totalSocialSecurity.toFixed(2),
    PersonalDeductions: totalPersonalDeductions.toFixed(2),
    SolidarityTax: totalSolidarityTax.toFixed(2),
    NetIncome: netIncome.toFixed(2),
    SpecialRegimeStatus: period.specialRegimeStatus
      ? period.specialRegimeStatus.regime || 'Standard'
      : 'Standard',
  };
}

/**
 * Calculate annual results for each income type
 *
 * @param {Object} period - Residency period
 * @param {Array} monthlyResults - Monthly results
 * @returns {Array} Annual summary by type
 */
function calculateAnnualTypeResultsForPeriod(period, monthlyResults) {
  const byType = new Map();

  for (const result of monthlyResults) {
    const type = result.incomeType || 'unknown';
    if (!byType.has(type)) {
      byType.set(type, {
        gross: 0,
        taxable: 0,
        tax: 0,
        socialSecurity: 0,
        net: 0,
      });
    }

    const stats = byType.get(type);
    // Handle both legacy (PascalCase) and new (camelCase) field names
    const grossIncome =
      result.GrossIncome !== undefined
        ? result.GrossIncome
        : result.amount || 0;
    const taxableIncome =
      result.TaxableIncome !== undefined
        ? result.TaxableIncome
        : result.taxableIncome || 0;
    const taxAmount =
      result.TaxAmount !== undefined ? result.TaxAmount : result.taxAmount || 0;
    const socialSecurity =
      result.SocialSecurity !== undefined
        ? result.SocialSecurity
        : result.socialSecurity || 0;
    const net =
      result.NetIncome !== undefined ? result.NetIncome : result.netIncome || 0;

    stats.gross += parseFloat(grossIncome);
    stats.taxable += parseFloat(taxableIncome);
    stats.tax += parseFloat(taxAmount);
    stats.socialSecurity += parseFloat(socialSecurity);
    stats.net += parseFloat(net);
  }

  const results = [];
  for (const [type, stats] of byType.entries()) {
    results.push({
      Year: period.year,
      IncomeType: type,
      SpecialRegimeStatus: period.specialRegimeStatus
        ? period.specialRegimeStatus.regime || 'Standard'
        : 'Standard',
      GrossIncome: stats.gross.toFixed(2),
      TaxableAmount: stats.taxable.toFixed(2),
      TaxAmount: stats.tax.toFixed(2),
      SocialSecurity: stats.socialSecurity.toFixed(2),
      NetIncome: stats.net.toFixed(2),
    });
  }

  return results;
}

module.exports = {
  calculateNetIncome,
  loadData,
  getResidency,
};
