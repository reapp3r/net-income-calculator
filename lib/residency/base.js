/**
 * @class TaxResidency
 * Abstract base class for tax residency implementations.
 *
 * Each country implements this interface to provide country-specific tax calculations.
 * This abstraction allows the calculator to support multiple tax jurisdictions.
 *
 * Only generic concepts are exposed here. Country-specific tax components
 * (social security, solidarity tax, special regimes, etc.) are implemented
 * directly by each country's residency class.
 */
class TaxResidency {
  constructor(referenceData) {
    if (this.constructor === TaxResidency) {
      throw new Error('TaxResidency is abstract and cannot be instantiated directly');
    }
    this.referenceData = referenceData;
  }

  /**
   * Get country code (ISO 3166-1 alpha-2)
   * @returns {string} ISO 3166-1 alpha-2 country code
   */
  getCountryCode() {
    throw new Error('getCountryCode() must be implemented by subclass');
  }

  /**
   * Get currency code (ISO 4217)
   * @returns {string} ISO 4217 currency code
   */
  getCurrency() {
    throw new Error('getCurrency() must be implemented by subclass');
  }

  /**
   * Calculate tax for income with given parameters
   * @param {number} grossIncome - Gross income amount
   * @param {string} incomeType - Type of income (employment, freelance, dividend)
   * @param {Object} options - Calculation options (year, sourceCountry, etc.)
   * @returns {Object} Tax calculation result with standard fields:
   *   - taxableIncome: number
   *   - taxAmount: number
   *   - socialSecurity: number (or 0 if not applicable)
   *   - solidarityTax: number (or 0 if not applicable)
   *   - isExempt: boolean
   */
  calculateTax(grossIncome, incomeType, options = {}) {
    throw new Error('calculateTax() must be implemented by subclass');
  }

  /**
   * Determine if taxpayer is resident in this country for the given year
   * Default implementation: assume resident if any income records exist for the year
   * Countries can override for specific residency tests (183-day rule, etc.)
   *
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset with incomeRecords
   * @returns {Object} Residency test result { isResident, method, test }
   */
  testResidency(year, data) {
    if (data.incomeRecords) {
      // Check if any income record has this year
      const hasIncome = data.incomeRecords.some(r =>
        (r.Year == year || r.year == year)
      );

      if (hasIncome) {
        return {
          isResident: true,
          method: 'automatic_income_presence',
          test: 'income_records'
        };
      }
    }

    return { isResident: false };
  }
}

module.exports = { TaxResidency };
