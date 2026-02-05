/**
 * @module ptResidency
 * Portugal Tax Residency
 *
 * Tax residency implementation for Portugal.
 * All tax rules loaded from reference data (no hardcoded values).
 */

const { convertCurrency } = require('../../utils/currency');
const { TaxResidency } = require('../base');
const { calculateSpecificDeduction } = require('./deductions');
const { getWithholdingRate } = require('./foreignTaxCredit');
const { getNHRStatus, getNHRRegimeData } = require('./nhr');
const { calculateProgressiveTax } = require('./progressive');
const {
  calculateSocialSecurity,
  getFreelanceTaxableBase,
} = require('./socialSecurity');
const { calculateSolidarityTax } = require('./solidarity');

const REQUIRED_EXPENSE_RATIO_SERVICES = 0.15;

function calculateFreelanceTaxableBaseInternal(
  grossIncome,
  freelanceType,
  expenses,
  year,
  socialSecurityData
) {
  let taxableBase = getFreelanceTaxableBase(
    grossIncome,
    year,
    socialSecurityData
  );

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
   * Get country code (ISO 3166-1 alpha-2)
   * @returns {string} ISO 3166-1 alpha-2 country code
   */
  getCountryCode() {
    return this.countryCode;
  }

  /**
   * Get currency code (ISO 4217)
   * @returns {string} ISO 4217 currency code
   */
  getCurrency() {
    return 'EUR';
  }

  /**
   * Get tax brackets for the specified year
   * @param {number} year - Tax year
   * @returns {Array} Array of bracket objects
   */
  getTaxBrackets(year) {
    if (!this.referenceData || !this.referenceData.taxBrackets) return [];
    return this.referenceData.taxBrackets.filter(b => b.Year === year);
  }

  /**
   * Get social security rates for the specified year
   * @param {number} year - Tax year
   * @returns {Array} Array of rate objects
   */
  getSocialSecurityRates(year) {
    if (!this.referenceData || !this.referenceData.socialSecurity) return [];
    return this.referenceData.socialSecurity.filter(s => s.Year === year);
  }

  /**
   * Get solidarity tax configuration for the specified year
   * @param {number} year - Tax year
   * @returns {Object|null} Solidarity tax config or null (if not applicable)
   */
  getSolidarityTaxConfig(year) {
    if (!this.referenceData || !this.referenceData.solidarity) return null;
    const config = this.referenceData.solidarity.find(s => s.Year === year);
    return config || null;
  }

  /**
   * Get special regime configuration for the specified year
   * @param {number} year - Tax year
   * @returns {Array} Array of special regime objects
   */
  getSpecialRegimes(year) {
    if (!this.referenceData || !this.referenceData.specialRegimes) return [];
    return this.referenceData.specialRegimes.filter(r => r.Year === year);
  }

  /**
   * Calculate tax for income with given parameters
   * @param {number} grossIncome - Gross income amount
   * @param {string} incomeType - Type of income (employment, freelance, dividend)
   * @param {Object} options - Calculation options
   * @returns {Object} Tax calculation result
   */
  calculateTax(grossIncome, incomeType, options = {}) {
    const {
      year,
      specialRegime,
      sourceCountry = 'PT',
      freelanceType,
      expenses,
      aggregate = false,
    } = options;

    const specialRegimeStatus = specialRegime
      ? this.getSpecialRegimeStatus(specialRegime, year)
      : { active: false };

    const isPortugueseSource = sourceCountry === 'PT';

    switch (incomeType) {
      case 'employment':
        return this.calculateEmploymentTax(
          grossIncome,
          specialRegimeStatus,
          isPortugueseSource,
          year
        );

      case 'freelance':
        return this.calculateFreelanceTax(
          grossIncome,
          specialRegimeStatus,
          isPortugueseSource,
          freelanceType,
          expenses,
          year
        );

      case 'dividend':
        return this.calculateDividendTax(
          grossIncome,
          specialRegimeStatus,
          sourceCountry,
          aggregate,
          year
        );

      default:
        throw new Error(`Unsupported income type: ${incomeType}`);
    }
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
    const hasPTIncome =
      data.incomeRecords &&
      data.incomeRecords.some(
        r =>
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
    return (
      data.incomeRecords &&
      data.incomeRecords.some(
        r =>
          (r.SourceCountry === 'PT' || r.sourceCountry === 'PT') &&
          (r.Year === year || r.year === year)
      )
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
    const hasPTIncome =
      data.incomeRecords &&
      data.incomeRecords.some(
        r =>
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
    return convertCurrency(
      amount,
      sourceCurrency,
      'EUR',
      [],
      null,
      null,
      exchangeRate
    );
  }

  calculateEmploymentTax(grossIncome, nhrStatus, isPortugueseSource, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    const nhrData = getNHRRegimeData(this.referenceData.specialRegimes);

    if (nhrStatus?.active && isPortugueseSource) {
      const nhrRate = nhrData.DomesticEmploymentRate;
      const ss = calculateSocialSecurity(
        grossIncome,
        'employment',
        'services',
        year,
        this.referenceData.socialSecurity
      );
      const taxAmount = grossIncome * nhrRate;
      return {
        taxType: 'NHR_FLAT_20',
        taxableIncome: grossIncome,
        taxAmount,
        socialSecurity: ss,
        solidarityTax: 0,
        isExempt: false,
        netIncome: grossIncome - taxAmount - ss,
      };
    }

    if (
      nhrStatus?.active &&
      !isPortugueseSource &&
      nhrData.ForeignIncomeExempt
    ) {
      return {
        taxType: 'NHR_EXEMPT',
        taxableIncome: 0,
        taxAmount: 0,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: true,
        netIncome: grossIncome,
      };
    }

    const ss = calculateSocialSecurity(
      grossIncome,
      'employment',
      'services',
      year,
      this.referenceData.socialSecurity
    );
    const deduction = calculateSpecificDeduction(
      grossIncome,
      year,
      this.referenceData.deductions
    );
    const taxableIncome = Math.max(0, grossIncome - ss - deduction);
    const taxAmount = calculateProgressiveTax(
      taxableIncome,
      year,
      this.referenceData.taxBrackets
    );
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
      netIncome: grossIncome - taxAmount - ss,
    };
  }

  calculateFreelanceTax(
    grossIncome,
    nhrStatus,
    isPortugueseSource,
    freelanceType,
    expenses,
    year
  ) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    const nhrData = getNHRRegimeData(this.referenceData.specialRegimes);

    if (
      nhrStatus?.active &&
      !isPortugueseSource &&
      nhrData.ForeignIncomeExempt
    ) {
      return {
        taxType: 'NHR_EXEMPT',
        taxableIncome: 0,
        taxAmount: 0,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: true,
        netIncome: grossIncome,
      };
    }

    const { taxableBase, expenseShortfall } =
      calculateFreelanceTaxableBaseInternal(
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
    const taxAmount = calculateProgressiveTax(
      actualTaxable,
      year,
      this.referenceData.taxBrackets
    );
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
      netIncome: grossIncome - taxAmount - ss,
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
        netIncome: grossIncome,
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
        netIncome: grossIncome - taxAmount,
      };
    }

    if (aggregate && !isEUEEA && !isPT) {
      const taxAmount = calculateProgressiveTax(
        grossIncome,
        year,
        this.referenceData.taxBrackets
      );

      return {
        taxType: 'AGGREGATED_PROGRESSIVE',
        taxableIncome: grossIncome,
        taxAmount,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: false,
        note: 'Aggregated at progressive rates (no 50% exemption)',
        netIncome: grossIncome - taxAmount,
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
          netIncome: grossIncome - progressiveTax,
        };
      }
    }

    if (this.isTaxHaven(country)) {
      const taxAmount = grossIncome * 0.35;
      return {
        taxType: 'DIVIDEND_35',
        taxableIncome: grossIncome,
        taxAmount,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: false,
        note: 'Tax haven: 35% flat rate',
        netIncome: grossIncome - taxAmount,
      };
    }

    const taxAmount = grossIncome * 0.28;
    return {
      taxType: 'DIVIDEND_28',
      taxableIncome: grossIncome,
      taxAmount,
      socialSecurity: 0,
      solidarityTax: 0,
      isExempt: false,
      netIncome: grossIncome - taxAmount,
    };
  }

  /**
   * Check if country is in EU/EEA
   * Used for 50% dividend exemption eligibility
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code
   * @returns {boolean} True if country is EU/EEA member
   */
  isEUEEA(countryCode) {
    if (!countryCode) return false;
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
    if (!countryCode) return false;
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

  getMinimumSubsistenceForYear(year) {
    if (!this.referenceData || !this.referenceData.minimumSubsistence)
      return null;
    const config = this.referenceData.minimumSubsistence.find(
      s => s.Year === year
    );
    return config && config.Amount > 0 ? config.Amount : null;
  }

  getAnnualAdjustments(totalNetIncome, year) {
    const minimumSubsistence = this.getMinimumSubsistenceForYear(year);
    if (!minimumSubsistence) {
      return {};
    }
    if (totalNetIncome < minimumSubsistence) {
      const adjustment = minimumSubsistence - totalNetIncome;
      return {
        MinimumSubsistenceAdjustment: adjustment,
      };
    }
    return {};
  }

  calculateAnnualSummary(period, monthlyResults) {
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

    // Apply minimum subsistence adjustment
    const adjustments = this.getAnnualAdjustments(netIncome, period.year);
    let adjustedNetIncome = netIncome;
    const adjustmentFields = {};

    for (const [key, value] of Object.entries(adjustments)) {
      adjustmentFields[key] = value.toFixed(2);
      adjustedNetIncome += parseFloat(value);
    }

    return {
      Year: period.year,
      ResidencyCountry: period.country,
      GrossIncome: totalGross.toFixed(2),
      TaxAmount: totalTax.toFixed(2),
      SocialSecurity: totalSocialSecurity.toFixed(2),
      PersonalDeductions: totalPersonalDeductions.toFixed(2),
      SolidarityTax: totalSolidarityTax.toFixed(2),
      NetIncome: adjustedNetIncome.toFixed(2),
      SpecialRegimeStatus: period.specialRegimeStatus
        ? period.specialRegimeStatus.regime || 'Standard'
        : 'Standard',
      ...adjustmentFields,
    };
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
      const localAmount = this.convertToLocalCurrency(
        record.grossIncome,
        record.sourceCurrency,
        record.exchangeRate
      );
      aggregates[record.incomeType].total += localAmount;
    }

    for (const [incomeType, data] of Object.entries(aggregates)) {
      if (data.total === 0) continue;

      let taxResult;
      switch (incomeType) {
        case 'employment':
          taxResult = this.calculateEmploymentTax(
            data.total,
            specialRegimeStatus,
            true,
            year
          );
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
          taxResult = this.calculateDividendTax(
            data.total,
            specialRegimeStatus,
            'PT',
            false,
            year
          );
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

    if (specialRegimeStatus.active) return 0;

    const ss = calculateSocialSecurity(
      grossIncome,
      'employment',
      'services',
      year,
      this.referenceData.socialSecurity
    );
    const deduction = calculateSpecificDeduction(
      grossIncome,
      year,
      this.referenceData.deductions
    );
    const taxable = Math.max(0, grossIncome - ss - deduction);

    const tax = calculateProgressiveTax(
      taxable,
      year,
      this.referenceData.taxBrackets
    );
    const solidarity = calculateSolidarityTax(
      taxable,
      year,
      this.referenceData.solidarity
    );

    return tax + solidarity;
  }
}

module.exports = PortugalResidency;
