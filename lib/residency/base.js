/**
 * @class TaxResidency
 * Abstract base class for tax residency implementations.
 *
 * Each country implements this interface to provide country-specific tax calculations.
 * This abstraction allows the calculator to support multiple tax jurisdictions.
 * 
 * FUTURE: Multi-country enhancements
 * When implementing multi-country support, add these methods to base class:
 * - determineTaxResidency(year, month, incomeRecords, residencyHints)
 *   Determines tax residency based on 183-day test and tie-breaker rules
 * - apply183DayTest(year, daysInCountryMap)
 *   Applies 183-day substantial presence test
 * - applyTieBreaker(countries, residencyHints)
 *   Applies OECD Model Tax Convention Article 4 tie-breaker hierarchy
 * - handleSplitYear(startMonth, endMonth, country)
 *   Handles split-year treatment when residency changes mid-year
 * - aggregateMultiJobIncome(monthRecords, taxResidency)
 *   Aggregates multiple employers per month with foreign tax credits
 * See docs/FUTURE_ARCHITECTURE.md for complete specification
 */
class TaxResidency {
  constructor() {
    if (this.constructor === TaxResidency) {
      throw new Error('TaxResidency is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Get default country code for this residency
   * Used when parsing records without explicit country
   * @returns {string} Default country code (ISO 3166-1 alpha-2)
   */
  getDefaultCountry() {
    return this.countryCode;
  }

  /**
   * Get default currency for this residency
   * @returns {string} Currency code (ISO 4217)
   */
  getDefaultCurrency() {
    return 'EUR';
  }

  /**
   * Convert amount to local currency
   * @param {number} amount - Amount in source currency
   * @param {string} sourceCurrency - Source currency code
   * @param {number} exchangeRate - Optional custom exchange rate
   * @returns {number} Amount in local currency
   */
  convertToLocalCurrency(amount, sourceCurrency, exchangeRate = null) {
    const { convertCurrency } = require('../utils/currency');
    const localCurrency = this.getDefaultCurrency();
    
    return convertCurrency(amount, sourceCurrency, localCurrency, exchangeRate);
  }

  /**
   * Get deduction functions module for this residency
   * @returns {Object} Deduction functions module
   */
  getDeductionsModule() {
    // Default to Portugal deductions - override in country-specific implementations
    return require('./pt/deductions');
  }

  /**
   * Get tax brackets for the current tax year
   * @param {number} year - Tax year
   * @returns {Array} Array of bracket objects {min, max, rate}
   */
  getTaxBrackets(year) {
    throw new Error('getTaxBrackets() must be implemented by subclass');
  }

  /**
   * Get specific deduction for employment income
   * @param {number} year - Tax year
   * @returns {number} Deduction amount
   */
  getSpecificDeduction(year) {
    throw new Error('getSpecificDeduction() must be implemented by subclass');
  }

  /**
   * Get social security parameters
   * @param {number} year - Tax year
   * @returns {Object} SS parameters {employeeRate, freelanceRate, freelanceCoefficient, cap}
   */
  getSocialSecurityParams(year) {
    throw new Error('getSocialSecurityParams() must be implemented by subclass');
  }

  /**
   * Calculate tax on employment income
   * @param {number} grossIncome - Gross employment income
   * @param {Object} nhrStatus - NHR status object
   * @param {boolean} isPortugueseSource - Whether income is from this country
   * @param {number} year - Tax year
   * @returns {Object} Tax calculation result
   */
  calculateEmploymentTax(grossIncome, nhrStatus, isPortugueseSource, year) {
    throw new Error('calculateEmploymentTax() must be implemented by subclass');
  }

  /**
   * Calculate tax on freelance income
   * @param {number} grossIncome - Gross freelance income
   * @param {Object} nhrStatus - NHR status object
   * @param {boolean} isPortugueseSource - Whether income is from this country
   * @param {string} freelanceType - 'services' or 'goods'
   * @param {number} expenses - Documented expenses
   * @param {number} year - Tax year
   * @returns {Object} Tax calculation result
   */
  calculateFreelanceTax(grossIncome, nhrStatus, isPortugueseSource, freelanceType, expenses, year) {
    throw new Error('calculateFreelanceTax() must be implemented by subclass');
  }

  /**
   * Calculate tax on dividend income
   * @param {number} grossIncome - Gross dividend income
   * @param {Object} nhrStatus - NHR status object
   * @param {string} sourceCountry - Source country code
   * @param {boolean} aggregate - Whether to use aggregation
   * @param {number} year - Tax year
   * @returns {Object} Tax calculation result
   */
  calculateDividendTax(grossIncome, nhrStatus, sourceCountry, aggregate, year) {
    throw new Error('calculateDividendTax() must be implemented by subclass');
  }

  /**
   * Get personal deduction limits for a year
   * @param {number} year - Tax year
   * @returns {Object} Deduction limits by category
   */
  getPersonalDeductionLimits(year) {
    throw new Error('getPersonalDeductionLimits() must be implemented by subclass');
  }

  /**
   * Calculate minimum subsistence threshold (safety net)
   * @param {number} year - Tax year
   * @returns {number} Minimum subsistence amount
   */
  getMinimumSubsistence(year) {
    return null; // Optional - not all countries have this
  }

  /**
   * Get withholding tax rates for this country (as source country)
   * @returns {Object} WHT rates by income type {employment, freelance, dividend}
   */
  getWithholdingRates() {
    return {
      employment: 0,
      freelance: 0,
      dividend: 0
    };
  }

  /**
   * Check if dividends from this country qualify for 50% exemption
   * Used by Portugal/EU residencies for dividend aggregation
   * @returns {boolean}
   */
  isEligibleFor50PercentDividendExemption() {
    return false;
  }

  /**
   * Check if a country is in EU/EEA for dividend aggregation
   * @param {string} countryCode - Country code
   * @returns {boolean}
   */
  isEUEEA(countryCode) {
    const euEea = new Set([
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'NO', 'IS', 'LI', 'CH'
    ]);
    return euEea.has(countryCode.toUpperCase());
  }

  /**
   * Check if a country is a tax haven (for dividend treatment)
   * @param {string} countryCode - Country code
   * @returns {boolean}
   */
  isTaxHaven(countryCode) {
    const taxHavens = new Set([
      'AE', 'AG', 'BB', 'BH', 'BM', 'BS', 'BZ', 'KY', 'VG', 'VI',
      'VG', 'KY', 'PA', 'PY', 'UY', 'VE', 'ZW'
    ]);
    return taxHavens.has(countryCode.toUpperCase());
  }

  /**
   * Get country info
   * @returns {Object}
   */
  getInfo() {
    return {
      code: this.countryCode,
      name: this.countryName
    };
  }

  /**
   * Calculate withholding tax for income from a source country
   * @param {number} grossIncome - Gross income amount
   * @param {string} incomeType - employment/freelance/dividend
   * @param {string} sourceCountry - Source country code
   * @returns {number} Withholding tax amount
   */
  calculateWithholdingForIncome(grossIncome, incomeType, sourceCountry) {
    // Default implementation - override in subclass for source-specific rules
    return 0;
  }

  /**
   * Calculate social security amount
   * @param {number} grossIncome - Gross income
   * @param {string} incomeType - employment/freelance/dividend
   * @param {string} freelanceType - services/goods
   * @param {number} year - Tax year
   * @returns {number} Social security amount
   */
  getSocialSecurityAmount(grossIncome, incomeType, freelanceType, year) {
    // Default implementation - override in subclass
    return 0;
  }

  /**
   * Get NHR/special regime status for a taxpayer
   * @param {string|null} acquiredDate - Date special regime was acquired (YYYY-MM-DD)
   * @param {number} year - Tax year
   * @returns {Object} Status object with active, status, remainingYears, etc.
   */
  getSpecialRegimeStatus(acquiredDate, year) {
    // Default: no special regime
    return {
      status: 'none',
      active: false,
      yearsActive: 0,
      remainingYears: 0
    };
  }

  /**
   * Get fiscal year mapping for this residency
   * @returns {Object} Fiscal year configuration
   */
  getFiscalYearMapping() {
    return {
      type: 'calendar', // 'calendar' or 'custom'
      startMonth: 1,
      startDay: 1,
      description: 'Calendar year (January 1 - December 31)'
    };
  }

  /**
   * Get the name of the special regime for this country
   * @returns {string} e.g., 'NHR', 'Remittance Basis', 'Non-Dom'
   */
  getSpecialRegimeName() {
    return 'Special Regime';
  }

  /**
   * Get additional tax components (e.g., solidarity tax) for a tax calculation
   * @param {Object} taxResult - Tax calculation result from calculateXxxTax methods
   * @param {Object} context - Additional context (record, incomeType, etc.)
   * @param {number} year - Tax year
   * @returns {Object} Additional tax components with names and amounts
   */
  getAdditionalTaxes(taxResult, context, year) {
    // Default: no additional taxes
    return {};
  }

  /**
   * Get annual additional taxes summary
   * @param {Array} yearRecords - All income records for the year
   * @param {Object} specialRegimeStatus - Special regime status
   * @param {number} year - Tax year
   * @returns {Object} Annual additional tax summary
   */
  getAnnualAdditionalTaxes(yearRecords, specialRegimeStatus, year) {
    // Default: no additional taxes
    return {};
  }

  /**
   * Format additional taxes for output (CSV field names)
   * @param {Object} additionalTaxes - Additional taxes object
   * @returns {Object} Formatted additional taxes for output
   */
  formatAdditionalTaxesForOutput(additionalTaxes) {
    const formatted = {};
    for (const [key, value] of Object.entries(additionalTaxes)) {
      if (key !== 'amount') {
        formatted[key] = typeof value === 'number' ? value.toFixed(2) : value;
      }
    }
    return formatted;
  }

  /**
   * Get output fields that this residency uses
   * @returns {Object} Field configuration
   */
  getOutputFields() {
    return {
      includePersonalDeductions: true,
      includeSocialSecurity: true,
      includeForeignWithholding: true,
      includeTaxType: true,
      includeRegimeStatus: true
    };
  }

  /**
   * Calculate standard tax on income (for comparison with special regime)
   * @param {number} grossIncome - Gross income
   * @param {Object} specialRegimeStatus - Special regime status
   * @param {number} year - Tax year
   * @returns {number} Standard tax amount
   */
  calculateStandardTaxOnIncome(grossIncome, specialRegimeStatus, year) {
    throw new Error('calculateStandardTaxOnIncome() must be implemented by subclass');
  }

  /**
   * Parse a record date into a fiscal year for this residency
   * @param {string} year - Calendar year from record
   * @param {number} month - Month from record (1-12)
   * @param {number} day - Day from record (optional, defaults to 1)
   * @returns {number} Fiscal year this record belongs to
   */
  getFiscalYearForRecord(year, month, day = 1) {
    const mapping = this.getFiscalYearMapping();
    
    if (mapping.type === 'calendar') {
      return year;
    }
    
    // Custom fiscal year (e.g., UK April 6 start)
    // If month >= startMonth (April), fiscal year is year
    // Otherwise, fiscal year is year - 1
    if (month >= mapping.startMonth) {
      return year;
    }
    return year - 1;
  }
}

module.exports = { TaxResidency };