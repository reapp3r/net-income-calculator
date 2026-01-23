/**
 * @module calculator
 * Core Net Income Calculator
 *
 * Generic multi-country tax residency calculator.
 * Delegates all country-specific logic to residency implementations.
 *
 * Supports any tax residency by implementing the TaxResidency interface.
 */

const {
  convertToEUR
} = require('./utils');

const { getResidency } = require('./residency');

/**
 * Parse a CSV record into a normalized income record
 *
 * @param {Object} record - CSV row object with keys like Year, Month, GrossIncome, etc.
 * @param {Object} options - Parsing options
 * @param {string} options.defaultCountry - Default residency country code
 * @param {Object} options.residency - Residency instance for defaults
 * @returns {Object} Normalized income record with typed fields
 */
function parseIncomeRecord(record, options = {}) {
  const residency = options.residency || getResidency(options.defaultCountry || 'PT');
  const defaultCountry = residency.getDefaultCountry();
  const defaultCurrency = residency.getDefaultCurrency();
  const simParams = options.simulationParameters || {};

  return {
    year: parseInt(record.Year),
    month: parseInt(record.Month),
    grossIncome: parseFloat(record.GrossIncome) || 0,
    incomeType: record.IncomeType || 'employment',
    sourceCountry: record.SourceCountry || defaultCountry,
    sourceCurrency: record.SourceCurrency || defaultCurrency,
    exchangeRate: parseFloat(record.ExchangeRate) || 1.0,
    residencyCountry: (record.ResidencyCountry || record.TaxResidency || defaultCountry).toUpperCase(),
    specialRegimeAcquiredDate: simParams.NHRStatusAcquiredDate || null,
    dividendAggregation: simParams.DividendAggregation || false,
    freelanceExpenses: parseFloat(record.FreelanceExpenses) || 0,
    freelanceType: record.FreelanceType || 'services'
  };
}

/**
 * Calculate net income from a list of income records
 *
 * @param {Array<Object>} incomeRecords - Array of income record objects from CSV
 * @param {Object} referenceData - Tax reference data (brackets, SS, solidarity, etc.)
 * @param {Object} options - Calculation options
 * @param {number} options.year - Override tax year (defaults to current year)
 * @returns {Object} Calculation results with monthly, annual, byType, and specialRegime
 * @throws {Error} If incomeRecords is not a non-empty array
 */
function calculateNetIncome(incomeRecords, referenceData, options = {}) {
  // FUTURE: Multi-country support
  // Current: Single country (Portugal) with incomeRecords from data/portugal/Income.csv
  // Future enhancements:
  // 1. Accept incomeRecords from global data/Income.csv (all countries)
  // 2. Accept residencyRecords from data/Residency.csv (optional)
  // 3. Determine tax residency per month:
  //    - Use Residency.csv if present (manual override)
  //    - Otherwise auto-calculate (183-day test, tie-breakers)
  // 4. Handle split-year treatment when residency changes mid-year
  // 5. Aggregate multiple jobs per month across different countries
  // 6. Apply foreign tax credits for cross-border income
  // See docs/FUTURE_ARCHITECTURE.md for complete specification
  
  if (!Array.isArray(incomeRecords) || incomeRecords.length === 0) {
    throw new Error('incomeRecords must be a non-empty array');
  }

  if (!referenceData) {
    throw new Error('referenceData is required');
  }

  const currentYear = options.year || new Date().getFullYear();

  const parsedRecords = incomeRecords.map(record => {
    const residency = getResidency(record.ResidencyCountry || record.TaxResidency || options.defaultCountry, referenceData);
    return parseIncomeRecord(record, { 
      residency, 
      defaultCountry: options.defaultCountry,
      simulationParameters: referenceData.simulationParameters
    });
  });

  const byYear = {};
  for (const record of parsedRecords) {
    const residency = getResidency(record.residencyCountry, referenceData);
    const fiscalYear = residency.getFiscalYearForRecord(record.year, record.month);
    const key = `${fiscalYear}_${record.residencyCountry}`;

    if (!byYear[key]) {
      byYear[key] = {
        fiscalYear,
        residencyCountry: record.residencyCountry,
        records: []
      };
    }
    byYear[key].records.push(record);
  }

  const results = {
    monthly: [],
    annual: [],
    byType: []
  };

  for (const key of Object.keys(byYear)) {
    const { fiscalYear, residencyCountry, records } = byYear[key];
    const yearResults = processYear(fiscalYear, residencyCountry, records, currentYear, referenceData);

    results.monthly.push(...yearResults.monthly);
    results.annual.push(yearResults.annual);
    results.byType.push(...yearResults.byType);
  }

  return results;
}

/**
 * Process a single fiscal year's data
 *
 * @param {number} year - Tax year to process
 * @param {string} residencyCountry - Country code of tax residency
 * @param {Array<Object>} yearRecords - Income records for this year
 * @param {number} currentYear - Current calendar year for reference
 * @param {Object} referenceData - Tax reference data
 * @returns {Object} Year results with monthly, annual, byType, and specialRegime
 */
function processYear(year, residencyCountry, yearRecords, currentYear, referenceData) {
  const residency = getResidency(residencyCountry, referenceData);
  const outputFields = residency.getOutputFields();
  const specialRegimeName = residency.getSpecialRegimeName();

  const sampleRecord = yearRecords[0];
  const specialRegimeStatus = residency.getSpecialRegimeStatus(sampleRecord.specialRegimeAcquiredDate, year);

  const aggregates = {
    employment: { bySource: {}, total: 0 },
    freelance: { bySource: {}, total: 0 },
    dividend: { bySource: {}, total: 0 }
  };

  for (const record of yearRecords) {
    const eurAmount = convertToEUR(record.grossIncome, record.exchangeRate);
    const key = record.sourceCountry.toUpperCase();

    if (!aggregates[record.incomeType].bySource[key]) {
      aggregates[record.incomeType].bySource[key] = 0;
    }
    aggregates[record.incomeType].bySource[key] += eurAmount;
    aggregates[record.incomeType].total += eurAmount;
  }

  const { getPersonalDeductionsForMonth, applyAllDeductions } = require('./residency/pt/deductions');

  const monthly = yearRecords.map(record => {
    const eurAmount = convertToEUR(record.grossIncome, record.exchangeRate);
    const regimeStat = residency.getSpecialRegimeStatus(record.specialRegimeAcquiredDate, year);

    let taxResult;
    const isResidencySource = record.sourceCountry.toUpperCase() === residencyCountry.toUpperCase();

    switch (record.incomeType) {
      case 'employment':
        taxResult = residency.calculateEmploymentTax(eurAmount, regimeStat, isResidencySource, year);
        break;

      case 'freelance':
        taxResult = residency.calculateFreelanceTax(
          eurAmount,
          regimeStat,
          isResidencySource,
          record.freelanceType,
          record.freelanceExpenses,
          year
        );
        break;

      case 'dividend':
        taxResult = residency.calculateDividendTax(
          eurAmount,
          regimeStat,
          record.sourceCountry,
          record.dividendAggregation,
          year
        );
        break;
    }

    const withholding = residency.calculateWithholdingForIncome(eurAmount, record.incomeType, record.sourceCountry, year);
    const socialSec = residency.getSocialSecurityAmount(eurAmount, record.incomeType, record.freelanceType, year);

    const deductionBreakdown = getPersonalDeductionsForMonth(year, record.month, referenceData.personalDeductions);
    const totalTaxBeforeDeductions = taxResult.taxAmount + (taxResult.solidarityTax || 0);
    const deductionResult = applyAllDeductions(totalTaxBeforeDeductions, deductionBreakdown, year, referenceData.deductions);
    const actualDeductions = deductionResult.totalDeductions;

    const monthlyRecord = {
      Year: year,
      ResidencyCountry: residencyCountry,
      Month: record.month,
      GrossIncome: eurAmount.toFixed(2),
      IncomeType: record.incomeType,
      SourceCountry: record.sourceCountry,
      [outputFields.regimeStatusLabel || 'SpecialRegimeStatus']: regimeStat.status,
      ForeignWithholding: withholding.toFixed(2),
      TaxAmount: taxResult.taxAmount.toFixed(2),
      SocialSecurity: socialSec.toFixed(2),
      PersonalDeductions: actualDeductions.toFixed(2),
      NetIncome: (eurAmount - withholding - deductionResult.finalTax - socialSec).toFixed(2)
    };

    if (outputFields.includeSolidarityTax) {
      monthlyRecord.SolidarityTax = (taxResult.solidarityTax || 0).toFixed(2);
    }

    if (outputFields.includeTaxType && taxResult.taxType) {
      monthlyRecord.TaxType = taxResult.taxType;
    }

    return monthlyRecord;
  });

  const annualByType = [];
  let totalGross = 0;
  let totalForeignWithholding = 0;
  let totalTax = 0;
  let totalSocialSecurity = 0;
  let totalPersonalDeductions = 0;
  let totalSolidarityTax = 0;
  let exemptIncome = 0;
  let taxableIncome = 0;

  for (const [incomeType, data] of Object.entries(aggregates)) {
    if (data.total === 0) continue;

    let taxResult;

    switch (incomeType) {
      case 'employment':
        taxResult = residency.calculateEmploymentTax(
          data.total,
          specialRegimeStatus,
          true,
          year
        );
        break;

      case 'freelance':
        taxResult = residency.calculateFreelanceTax(
          data.total,
          specialRegimeStatus,
          true,
          yearRecords[0]?.freelanceType || 'services',
          yearRecords
            .filter(r => r.incomeType === 'freelance')
            .reduce((sum, r) => sum + r.freelanceExpenses, 0),
          year
        );
        break;

      case 'dividend':
        // Determine source country for dividend tax calculation
        // Priority: PT source (50% exemption) > first source in aggregation > residency country
        const dividendSourceCountries = Object.keys(data.bySource);
        let dividendSourceCountry = residencyCountry;
        
        // If we have PT source dividends, prioritize them (for 50% exemption)
        if (dividendSourceCountries.includes('PT')) {
          dividendSourceCountry = 'PT';
        } else if (dividendSourceCountries.length > 0) {
          // Use first available source country
          dividendSourceCountry = dividendSourceCountries[0];
        }
        
        taxResult = residency.calculateDividendTax(
          data.total,
          specialRegimeStatus,
          dividendSourceCountry,
          yearRecords.some(r => r.incomeType === 'dividend' && r.dividendAggregation),
          year
        );
        break;
    }

    let foreignWithholding = 0;
    for (const [sourceCountry, amount] of Object.entries(data.bySource)) {
      if (sourceCountry !== residencyCountry) {
        foreignWithholding += residency.calculateWithholdingForIncome(amount, incomeType, sourceCountry);
      }
    }

    const typePersonalDeductions = monthly
      .filter(m => m.IncomeType === incomeType)
      .reduce((sum, m) => sum + parseFloat(m.PersonalDeductions), 0);

    const typeRecord = {
      Year: year,
      ResidencyCountry: residencyCountry,
      IncomeType: incomeType,
      [outputFields.regimeStatusLabel || 'SpecialRegimeStatus']: specialRegimeStatus.status,
      GrossIncome: data.total.toFixed(2),
      TaxableAmount: (taxResult.taxableIncome || data.total).toFixed(2),
      TaxAmount: taxResult.taxAmount.toFixed(2),
      ForeignWithholding: foreignWithholding.toFixed(2),
      SocialSecurity: (taxResult.socialSecurity || 0).toFixed(2),
      PersonalDeductions: typePersonalDeductions.toFixed(2),
      NetIncome: (data.total - taxResult.taxAmount - (taxResult.solidarityTax || 0) - (taxResult.socialSecurity || 0) - foreignWithholding - typePersonalDeductions).toFixed(2)
    };

    if (outputFields.includeSolidarityTax) {
      typeRecord.SolidarityTax = (taxResult.solidarityTax || 0).toFixed(2);
    }

    annualByType.push(typeRecord);

    totalGross += data.total;
    totalForeignWithholding += foreignWithholding;
    totalTax += taxResult.taxAmount;
    totalSocialSecurity += taxResult.socialSecurity || 0;
    totalPersonalDeductions += typePersonalDeductions;
    totalSolidarityTax += taxResult.solidarityTax || 0;

    if (taxResult.isExempt) {
      exemptIncome += data.total;
    } else {
      taxableIncome += taxResult.taxableIncome || data.total;
    }
  }

  const annual = {
    Year: year,
    ResidencyCountry: residencyCountry,
    [outputFields.regimeStatusLabel || 'SpecialRegimeStatus']: specialRegimeStatus.status,
    GrossIncome: totalGross.toFixed(2),
    ForeignWithholding: totalForeignWithholding.toFixed(2),
    TaxAmount: totalTax.toFixed(2),
    SocialSecurity: totalSocialSecurity.toFixed(2),
    PersonalDeductions: totalPersonalDeductions.toFixed(2),
    NetIncome: (totalGross - totalTax - totalSocialSecurity - totalForeignWithholding - totalPersonalDeductions).toFixed(2)
  };

  if (outputFields.includeSolidarityTax) {
    annual.SolidarityTax = totalSolidarityTax.toFixed(2);
  }

  return {
    monthly,
    annual,
    byType: annualByType
  };
}

module.exports = {
  /**
   * Parse a CSV record into a normalized income record
   * @param {Object} record - CSV row object
   * @returns {Object} Normalized income record
   */
  parseIncomeRecord,
  /**
   * Calculate net income from a list of income records
   * @param {Array<Object>} incomeRecords - Array of income record objects
   * @param {Object} options - Calculation options
   * @returns {Object} Calculation results
   */
  calculateNetIncome,
  /**
   * Process income records for a single tax year and residency
   * @param {number} year - Tax year
   * @param {string} residencyCountry - Country code
   * @param {Array<Object>} yearRecords - Income records
   * @param {number} currentYear - Current year
   * @returns {Object} Year results
   */
  processYear
};
