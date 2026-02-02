/**
 * @class TaxResidency
 * Abstract base class for tax residency implementations.
 * 
 * Each country implements this interface to provide country-specific tax calculations.
 * This abstraction allows the calculator to support multiple tax jurisdictions.
 * 
 * Removed all country-specific concepts and hardcoded values.
 * Only generic abstractions remain - implement in country packages.
 */

class TaxResidency {
  constructor(referenceData) {
    if (this.constructor === TaxResidency) {
      throw new Error('TaxResidency is abstract and cannot be instantiated directly');
    }
    this.referenceData = referenceData;
  }

  /**
   * Determine if taxpayer is resident in this country for the given year
   * Default implementation: assume resident if any income records exist for the year
   * 
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset
   * @returns {Object} Residency test result { isResident, method, test }
   */
  testResidency(year, data) {
    if (data.incomeRecords) {
      // Check if any income record has this year
      // Note: incomeRecords might have 'Year' (CSV) or 'year' (internal)
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

  /**
   * Get country code (ISO 3166-1 alpha-2)
   * Must be implemented by each country's residency class.
   * 
   * @returns {string} ISO 3166-1 alpha-2 country code
   */
  getCountryCode() {
    throw new Error('getCountryCode() must be implemented by subclass');
  }

  /**
   * Get currency code (ISO 4217)
   * Must be implemented by each country's residency class.
   * 
   * @returns {string} ISO 4217 currency code
   */
  getCurrency() {
    throw new Error('getCurrency() must be implemented by subclass');
  }

  /**
   * Get tax brackets for the specified year
   * Must be implemented by each country's residency class.
   * 
   * @param {number} year - Tax year
   * @returns {Array} Array of bracket objects {min, max, rate}
   */
  getTaxBrackets(year) {
    throw new Error('getTaxBrackets() must be implemented by subclass');
  }

  /**
   * Get social security rates for the specified year
   * Must be implemented by each country's residency class.
   * 
   * @param {number} year - Tax year
   * @returns {Array} Array of rate objects {type, rate, basis, cap}
   */
  getSocialSecurityRates(year) {
    throw new Error('getSocialSecurityRates() must be implemented by subclass');
  }

  /**
   * Get solidarity tax configuration for the specified year
   * Must be implemented by each country's residency class.
   * 
   * @param {number} year - Tax year
   * @returns {Object|null} Solidarity tax config {thresholds, rates} or null
   */
  getSolidarityTaxConfig(year) {
    throw new Error('getSolidarityTaxConfig() must be implemented by subclass');
  }

  /**
   * Get special regime configuration for the specified year
   * Must be implemented by each country's residency class.
   * 
   * @param {number} year - Tax year
   * @returns {Array} Array of special regime objects
   */
  getSpecialRegimes(year) {
    throw new Error('getSpecialRegimes() must be implemented by subclass');
  }

  /**
   * Calculate tax for income with given parameters
   * Must be implemented by each country's residency class.
   * 
   * @param {number} grossIncome - Gross income amount
   * @param {string} incomeType - Type of income (employment, freelance, dividend)
   * @param {Object} options - Calculation options
   * @returns {Object} Tax calculation result
   */
  calculateTax(grossIncome, incomeType, options = {}) {
    throw new Error('calculateTax() must be implemented by subclass');
  }

  /**
   * Check if special regime is applicable for the given conditions
   * Generic implementation - can be overridden by countries
   * 
   * @param {Object} options - Conditions to check
   * @returns {Object|null} Special regime status or null
   */
  checkSpecialRegime(options = {}) {
    const { year, specialRegime } = options;
    
    if (!specialRegime || !year) {
      return null;
    }
    
    // Get all special regimes for this country and year
    const regimes = this.getSpecialRegimes(year);
    
    // Check if any regime applies
    for (const regime of regimes) {
      if (this.isRegimeApplicable(regime, options)) {
        return {
          regime: regime.name,
          method: regime.method,
          status: 'active',
          details: regime
        };
      }
    }
    
    return null;
  }

  /**
   * Check if a specific regime applies to the given conditions
   * Generic implementation - can be overridden by countries
   * 
   * @param {Object} regime - Regime configuration
   * @param {Object} options - Conditions to check
   * @returns {boolean} True if regime applies
   */
  isRegimeApplicable(regime, options = {}) {
    // Generic logic - countries can override for specific rules
    return true;
  }

  /**
   * Apply special regime tax calculation
   * Generic implementation - can be overridden by countries
   * 
   * @param {Object} regime - Special regime configuration
   * @param {number} grossIncome - Gross income amount
   * @param {Object} options - Additional options
   * @returns {Object} Tax calculation result with special regime applied
   */
  applySpecialRegime(regime, grossIncome, options = {}) {
    // Default: Use standard calculation - countries can override
    return this.calculateTax(grossIncome, options.incomeType, {
      ...options,
      method: regime.method
    });
  }

  /**
   * Calculate progressive tax on income
   * Generic implementation using tax brackets
   * 
   * @param {number} taxableIncome - Taxable income amount
   * @param {Array} brackets - Tax brackets to apply
   * @returns {number} Tax amount
   */
  calculateProgressiveTax(taxableIncome, brackets) {
    let tax = 0;
    let remainingIncome = taxableIncome;
    
    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min + 1);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }
    
    return tax;
  }

  /**
   * Calculate withholding tax for income from a source country
   * Default implementation - can be overridden by countries
   * 
   * @param {number} grossIncome - Gross income amount
   * @param {string} incomeType - Type of income
   * @param {string} sourceCountry - Source country code
   * @returns {number} Withholding tax amount (default 0)
   */
  calculateWithholdingForIncome(grossIncome, incomeType, sourceCountry) {
    // Default: No withholding tax
    // Countries can override for specific withholding rules
    return 0;
  }

  /**
   * Calculate social security amount for income
   * Generic implementation using social security rates
   * 
   * @param {number} grossIncome - Gross income amount
   * @param {string} incomeType - Type of income
   * @param {number} year - Tax year
   * @returns {number} Social security amount
   */
  calculateSocialSecurity(grossIncome, incomeType, year) {
    const rates = this.getSocialSecurityRates(year);
    const rateConfig = rates.find(r => r.type === incomeType);
    
    if (!rateConfig) return 0;
    
    let taxableBase = grossIncome;
    if (rateConfig.basis === 'percentage') {
      taxableBase = grossIncome * rateConfig.percentage;
    }
    
    const ssAmount = taxableBase * rateConfig.rate;
    
    // Apply cap if specified
    if (rateConfig.cap && ssAmount > rateConfig.cap) {
      return rateConfig.cap;
    }
    
    return ssAmount;
  }

  /**
   * Calculate solidarity tax if applicable
   * Generic implementation using solidarity tax config
   * 
   * @param {number} taxableIncome - Taxable income amount
   * @param {number} year - Tax year
   * @returns {number} Solidarity tax amount
   */
  calculateSolidarityTax(taxableIncome, year) {
    const config = this.getSolidarityTaxConfig(year);
    if (!config) return 0;
    
    let solidarityTax = 0;
    
    for (const threshold of config.thresholds) {
      if (taxableIncome > threshold.min) {
        const excessIncome = taxableIncome - threshold.min;
        solidarityTax += excessIncome * threshold.rate;
      }
    }
    
    return solidarityTax;
  }

  /**
   * Get tax year for a given date
   * Generic implementation - can be overridden for countries with different tax year rules
   * 
   * @param {Date} date - Date to get tax year for
   * @returns {number} Tax year
   */
  getTaxYear(date) {
    const mapping = this.referenceData.find(r => r.Type === 'TaxYearMapping');
    if (mapping && mapping.StartMonth && mapping.StartMonth > 1) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      if (month >= mapping.StartMonth) {
        return year;
      }
      
      return year - 1;
    }
    
    return date.getFullYear();
  }

  /**
   * Calculate standard tax on income (for comparison with special regimes)
   * Default implementation - can be overridden by countries
   * 
   * @param {number} grossIncome - Gross income amount
   * @param {Object} specialRegimeStatus - Special regime status object
   * @param {number} year - Tax year
   * @returns {number} Standard tax amount
   */
  calculateStandardTaxOnIncome(grossIncome, specialRegimeStatus, year) {
    // Default: Implement basic calculation or defer to calculateTax()
    return this.calculateTax(grossIncome, {
      regime: specialRegimeStatus,
      year
    });
  }
}

module.exports = { TaxResidency };