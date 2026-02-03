/**
 * @module ptResidency
 * Portugal Tax Residency
 *
 * Tax residency implementation for Portugal.
 * All tax rules loaded from reference data (no hardcoded values).
 */

const { TaxResidency } = require('../base');
const { calculateProgressiveTax } = require('./progressive');
const { calculateSolidarityTax } = require('./solidarity');
const { calculateSocialSecurity, getFreelanceTaxableBase } = require('./socialSecurity');
const { getNHRStatus, getNHRRegimeData } = require('./nhr');
const { calculateSpecificDeduction } = require('./deductions');
const { getWithholdingRate } = require('./foreignTaxCredit');
const { convertCurrency } = require('../../utils/currency');

const REQUIRED_EXPENSE_RATIO_SERVICES = 0.15;

function calculateFreelanceTaxableBaseInternal(
  grossIncome,
  freelanceType,
  expenses,
  year,
  socialSecurityData
) {
  let taxableBase = getFreelanceTaxableBase(grossIncome, year, socialSecurityData);

  if (freelanceType === 'services') {
    const requiredExpenses = grossIncome * REQUIRED_EXPENSE_RATIO_SERVICES;
    if (expenses < requiredExpenses) {
      const shortfall = requiredExpenses - expenses;
      taxableBase = taxableBase + shortfall;
      return { taxableBase, expenseShortfall: shortfall, requiredExpenses };
    }
  }

  return {
    taxableBase,
    expenseShortfall: 0,
    requiredExpenses: grossIncome * REQUIRED_EXPENSE_RATIO_SERVICES,
  };
}

class PortugalResidency extends TaxResidency {
  constructor(referenceData) {
    super();
    this.countryCode = 'PT';
    this.countryName = 'Portugal';
    this.referenceData = referenceData;
  }

  setReferenceData(referenceData) {
    this.referenceData = referenceData;
  }

  /**
   * Get deduction functions module for this residency
   * @returns {Object} Deduction functions module
   */
  getDeductionsModule() {
    return require('./deductions');
  }

  /**
   * Test if taxpayer is resident in Portugal for the given year
   * For MVP, assumes Portuguese residency if income records exist
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset
   * @returns {Object} Residency test result
   */
  testResidency(year, data) {
    const hasPTIncome = data.incomeRecords && data.incomeRecords.some((r) =>
      (r.SourceCountry === 'PT' || r.sourceCountry === 'PT') &&
      (r.Year === year || r.year === year)
    );

    return {
      isResident: hasPTIncome,
      test: hasPTIncome ? 'income-presence' : 'no-income',
    };
  }

  /**
   * Check if taxpayer has a permanent home in Portugal
   * For MVP, returns true if there's Portuguese income
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset
   * @returns {boolean} True if permanent home in Portugal
   */
  hasPermanentHome(year, data) {
    return data.incomeRecords && data.incomeRecords.some((r) =>
      (r.SourceCountry === 'PT' || r.sourceCountry === 'PT') &&
      (r.Year === year || r.year === year)
    );
  }

  /**
   * Calculate strength of vital interests in Portugal
   * For MVP, returns high value if Portuguese income exists
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset
   * @returns {number} Strength of vital interests (0-100)
   */
  calculateVitalInterestsStrength(year, data) {
    const hasPTIncome = data.incomeRecords && data.incomeRecords.some((r) =>
      (r.SourceCountry === 'PT' || r.sourceCountry === 'PT') &&
      (r.Year === year || r.year === year)
    );

    return hasPTIncome ? 100 : 0;
  }

  /**
   * Convert amount to local currency (EUR)
   * Delegates to convertCurrency utility with custom rate
   * @param {number} amount - Amount in source currency
   * @param {string} sourceCurrency - Source currency code
   * @param {number} exchangeRate - Exchange rate to EUR
   * @returns {number} Amount in EUR
   */
  convertToLocalCurrency(amount, sourceCurrency, exchangeRate) {
    return convertCurrency(amount, sourceCurrency, 'EUR', [], null, null, exchangeRate);
  }

  calculateEmploymentTax(grossIncome, nhrStatus, isPortugueseSource, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    const nhrData = getNHRRegimeData(this.referenceData.specialRegimes);

    if (nhrStatus?.active && isPortugueseSource) {
      const nhrRate = nhrData.DomesticEmploymentRate;
      return {
        taxType: 'NHR_FLAT_20',
        taxableIncome: grossIncome,
        taxAmount: grossIncome * nhrRate,
        socialSecurity: calculateSocialSecurity(
          grossIncome,
          'employment',
          'services',
          year,
          this.referenceData.socialSecurity
        ),
        solidarityTax: 0,
        isExempt: false,
      };
    }

    if (nhrStatus?.active && !isPortugueseSource && nhrData.ForeignIncomeExempt) {
      return {
        taxType: 'NHR_EXEMPT',
        taxableIncome: 0,
        taxAmount: 0,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: true,
      };
    }

    const ss = calculateSocialSecurity(
      grossIncome,
      'employment',
      'services',
      year,
      this.referenceData.socialSecurity
    );
    const deduction = calculateSpecificDeduction(grossIncome, year, this.referenceData.deductions);
    const taxableIncome = Math.max(0, grossIncome - ss - deduction);
    const taxAmount = calculateProgressiveTax(taxableIncome, year, this.referenceData.taxBrackets);
    const solidarityTax = calculateSolidarityTax(
      taxableIncome,
      year,
      this.referenceData.solidarity
    );

    return {
      taxType: 'PROGRESSIVE',
      taxableIncome,
      taxAmount,
      socialSecurity: ss,
      solidarityTax,
      isExempt: false,
    };
  }

  calculateFreelanceTax(grossIncome, nhrStatus, isPortugueseSource, freelanceType, expenses, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    const nhrData = getNHRRegimeData(this.referenceData.specialRegimes);

    if (nhrStatus?.active && !isPortugueseSource && nhrData.ForeignIncomeExempt) {
      return {
        taxType: 'NHR_EXEMPT',
        taxableIncome: 0,
        taxAmount: 0,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: true,
      };
    }

    const { taxableBase, expenseShortfall } = calculateFreelanceTaxableBaseInternal(
      grossIncome,
      freelanceType,
      expenses,
      year,
      this.referenceData.socialSecurity
    );
    const actualTaxable = Math.max(0, taxableBase - expenses);

    const ss = calculateSocialSecurity(
      grossIncome,
      'freelance',
      freelanceType,
      year,
      this.referenceData.socialSecurity
    );
    const taxAmount = calculateProgressiveTax(actualTaxable, year, this.referenceData.taxBrackets);
    const solidarityTax = calculateSolidarityTax(
      actualTaxable,
      year,
      this.referenceData.solidarity
    );

    return {
      taxType: freelanceType === 'services' ? 'SERVICES_70' : 'GOODS_20',
      taxableIncome: actualTaxable,
      taxAmount,
      socialSecurity: ss,
      solidarityTax,
      isExempt: false,
      expenseShortfall,
    };
  }

  calculateDividendTax(grossIncome, nhrStatus, sourceCountry, aggregate, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    const nhrData = getNHRRegimeData(this.referenceData.specialRegimes);
    const country = (sourceCountry || 'PT').toUpperCase();
    const isEUEEA = this.isEUEEA(country);
    const isPT = country === 'PT';

    if (nhrStatus?.active && nhrData.ForeignIncomeExempt) {
      return {
        taxType: 'NHR_EXEMPT',
        taxableIncome: 0,
        taxAmount: 0,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: true,
      };
    }

    if (aggregate && (isPT || isEUEEA)) {
      const taxableAmount = grossIncome * 0.5;
      const taxAmount = calculateProgressiveTax(
        taxableAmount,
        year,
        this.referenceData.taxBrackets
      );

      return {
        taxType: 'AGGREGATED_50',
        taxableIncome: taxableAmount,
        taxAmount,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: false,
        note: '50% exemption for PT/EU/EEA dividends',
      };
    }

    if (aggregate && !isEUEEA && !isPT) {
      const taxAmount = calculateProgressiveTax(grossIncome, year, this.referenceData.taxBrackets);

      return {
        taxType: 'AGGREGATED_PROGRESSIVE',
        taxableIncome: grossIncome,
        taxAmount,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: false,
        note: 'Aggregated at progressive rates (no 50% exemption)',
      };
    }

    if (country === 'UK') {
      const progressiveTax = calculateProgressiveTax(
        grossIncome,
        year,
        this.referenceData.taxBrackets
      );
      if (progressiveTax < grossIncome * 0.28) {
        return {
          taxType: 'AGGREGATED_PROGRESSIVE',
          taxableIncome: grossIncome,
          taxAmount: progressiveTax,
          socialSecurity: 0,
          solidarityTax: 0,
          isExempt: false,
          note: 'UK dividend: Progressive rates cheaper than 28% flat',
        };
      }
    }

    if (this.isTaxHaven(country)) {
      return {
        taxType: 'DIVIDEND_35',
        taxableIncome: grossIncome,
        taxAmount: grossIncome * 0.35,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: false,
        note: 'Tax haven: 35% flat rate',
      };
    }

    return {
      taxType: 'DIVIDEND_28',
      taxableIncome: grossIncome,
      taxAmount: grossIncome * 0.28,
      socialSecurity: 0,
      solidarityTax: 0,
      isExempt: false,
    };
  }

  /**
   * Check if country is in EU/EEA
   * Used for 50% dividend exemption eligibility
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code
   * @returns {boolean} True if country is EU/EEA member
   */
  isEUEEA(countryCode) {
    if (!countryCode) {
      return false;
    }
    const eueeaCountries = [
      // EU-27
      'PT',
      'ES',
      'FR',
      'DE',
      'IT',
      'NL',
      'BE',
      'LU',
      'AT',
      'GR',
      'IE',
      'FI',
      'SE',
      'DK',
      'PL',
      'CZ',
      'HU',
      'SK',
      'SI',
      'EE',
      'LV',
      'LT',
      'CY',
      'MT',
      'BG',
      'RO',
      'HR',
      // EEA (non-EU)
      'NO',
      'IS',
      'LI',
    ];
    return eueeaCountries.includes(countryCode.toUpperCase());
  }

  /**
   * Check if country is classified as tax haven by Portuguese tax authority
   * Tax havens get 35% flat rate on dividends per Portuguese tax law
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code
   * @returns {boolean} True if country is tax haven
   */
  isTaxHaven(countryCode) {
    if (!countryCode) {
      return false;
    }
    const taxHavens = [
      'BM', // Bermuda
      'KY', // Cayman Islands
      'VG', // British Virgin Islands
      'BS', // Bahamas
      'PA', // Panama
      'LI', // Liechtenstein (also EEA but special tax regime)
      'MC', // Monaco
      'AD', // Andorra
      'GI', // Gibraltar
    ];
    return taxHavens.includes(countryCode.toUpperCase());
  }

  getFiscalYearMapping() {
    return {
      type: 'calendar',
      startMonth: 1,
      startDay: 1,
      description: 'Calendar year (January 1 - December 31)',
    };
  }

  getSpecialRegimeName() {
    return 'NHR';
  }

  getOutputFields() {
    return {
      includePersonalDeductions: true,
      includeSocialSecurity: true,
      includeForeignWithholding: true,
      includeTaxType: true,
      includeRegimeStatus: true,
      regimeStatusLabel: 'SpecialRegimeStatus',
    };
  }

  getWithholdingRates() {
    return {
      employment: 0,
      freelance: 0.25,
      dividend: 0.25,
    };
  }

  isEligibleFor50PercentDividendExemption() {
    return true;
  }

  calculateWithholdingForIncome(grossIncome, incomeType, sourceCountry, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    const rate = getWithholdingRate(
      year,
      sourceCountry,
      incomeType,
      this.referenceData.foreignTaxCredit
    );
    return grossIncome * rate;
  }

  getSocialSecurityAmount(grossIncome, incomeType, freelanceType, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    return calculateSocialSecurity(
      grossIncome,
      incomeType,
      freelanceType,
      year,
      this.referenceData.socialSecurity
    );
  }

  getSpecialRegimeStatus(acquiredDate, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    return getNHRStatus(acquiredDate, year, this.referenceData.specialRegimes);
  }

  getAdditionalTaxes(taxResult, _context, _year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    // Portugal has solidarity tax on high incomes
    const solidarityTaxAmount = taxResult.solidarityTax || 0;

    if (solidarityTaxAmount > 0) {
      return {
        SolidarityTax: solidarityTaxAmount,
        amount: solidarityTaxAmount,
      };
    }

    return { amount: 0 };
  }

  getAnnualAdditionalTaxes(yearRecords, specialRegimeStatus, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    // Calculate total solidarity tax for the year
    let totalSolidarityTax = 0;

    // Group by income type and calculate solidarity tax on each type's taxable income
    const aggregates = {
      employment: { total: 0 },
      freelance: { total: 0 },
      dividend: { total: 0 },
    };

    for (const record of yearRecords) {
      const localAmount = record.grossIncome || 0;
      aggregates[record.incomeType].total += localAmount;
    }

    for (const [incomeType, data] of Object.entries(aggregates)) {
      if (data.total === 0) {
        continue;
      }

      let taxResult;
      switch (incomeType) {
        case 'employment':
          taxResult = this.calculateEmploymentTax(data.total, specialRegimeStatus, true, year);
          break;
        case 'freelance':
          taxResult = this.calculateFreelanceTax(
            data.total,
            specialRegimeStatus,
            true,
            'services',
            0,
            year
          );
          break;
        case 'dividend':
          taxResult = this.calculateDividendTax(data.total, specialRegimeStatus, 'PT', false, year);
          break;
      }

      totalSolidarityTax += taxResult.solidarityTax || 0;
    }

    if (totalSolidarityTax > 0) {
      return {
        SolidarityTax: totalSolidarityTax,
        amount: totalSolidarityTax,
      };
    }

    return { amount: 0 };
  }

  formatAdditionalTaxesForOutput(additionalTaxes) {
    const formatted = {};
    for (const [key, value] of Object.entries(additionalTaxes)) {
      if (key !== 'amount') {
        formatted[key] = typeof value === 'number' ? value.toFixed(2) : value;
      }
    }
    return formatted;
  }

  calculateStandardTaxOnIncome(grossIncome, specialRegimeStatus, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    if (specialRegimeStatus.active) {
      return 0;
    }

    const ss = calculateSocialSecurity(
      grossIncome,
      'employment',
      'services',
      year,
      this.referenceData.socialSecurity
    );
    const deduction = calculateSpecificDeduction(grossIncome, year, this.referenceData.deductions);
    const taxable = Math.max(0, grossIncome - ss - deduction);

    const tax = calculateProgressiveTax(taxable, year, this.referenceData.taxBrackets);
    const solidarity = calculateSolidarityTax(taxable, year, this.referenceData.solidarity);

    return tax + solidarity;
  }
}

module.exports = PortugalResidency;
