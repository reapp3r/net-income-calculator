/**
 * @module ukResidency
 * UK Tax Residency
 *
 * Tax residency implementation for the United Kingdom.
 * All tax rules loaded from reference data (no hardcoded values).
 */

const { TaxResidency } = require('../base');
const {
  calculateUKTradingAllowance,
  calculateUKDividendAllowance,
} = require('./deductions');
const {
  calculateUKEmploymentNI,
  calculateUKFreelanceNI,
} = require('./nationalInsurance');
const {
  calculateUKProgressiveTax,
  calculateUKPersonalAllowance,
} = require('./progressive');

class GBResidency extends TaxResidency {
  constructor(referenceData) {
    super(referenceData);
    this.countryCode = 'GB';
    this.countryName = 'United Kingdom';
  }

  getCountryCode() {
    return this.countryCode;
  }

  getCurrency() {
    return 'GBP';
  }

  // --- UK Specific Helpers (Legacy/Extensions) ---

  getFiscalYearMapping() {
    return {
      type: 'custom',
      startMonth: 4,
      startDay: 6,
      description: 'UK tax year (April 6 - April 5)',
    };
  }

  getSpecialRegimeName() {
    return 'None';
  }

  getOutputFields() {
    return {
      includeSolidarityTax: false,
      includePersonalDeductions: true,
      includeSocialSecurity: true,
      includeForeignWithholding: true,
      includeTaxType: true,
      includeRegimeStatus: false,
      regimeStatusLabel: 'SpecialRegimeStatus',
    };
  }

  getDefaultCurrency() {
    return 'GBP';
  }

  /**
   * Get deduction functions module for this residency
   * @returns {Object} Deduction functions module
   */
  getDeductionsModule() {
    return require('./deductions');
  }

  /**
   * Test if taxpayer is resident in the UK for the given year
   * For MVP, assumes UK residency if income records exist
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset
   * @returns {Object} Residency test result
   */
  testResidency(year, data) {
    const hasGBIncome =
      data.incomeRecords &&
      data.incomeRecords.some(
        r =>
          (r.SourceCountry === 'GB' || r.sourceCountry === 'GB') &&
          (r.Year === year || r.year === year)
      );

    return {
      isResident: hasGBIncome,
      test: hasGBIncome ? 'income-presence' : 'no-income',
    };
  }

  /**
   * Check if taxpayer has a permanent home in the UK
   * For MVP, returns true if there's UK income
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset
   * @returns {boolean} True if permanent home in the UK
   */
  hasPermanentHome(year, data) {
    return (
      data.incomeRecords &&
      data.incomeRecords.some(
        r =>
          (r.SourceCountry === 'GB' || r.sourceCountry === 'GB') &&
          (r.Year === year || r.year === year)
      )
    );
  }

  /**
   * Calculate strength of vital interests in the UK
   * For MVP, returns high value if UK income exists
   * @param {number} year - Tax year
   * @param {Object} data - Complete dataset
   * @returns {number} Strength of vital interests (0-100)
   */
  calculateVitalInterestsStrength(year, data) {
    const hasGBIncome =
      data.incomeRecords &&
      data.incomeRecords.some(
        r =>
          (r.SourceCountry === 'GB' || r.sourceCountry === 'GB') &&
          (r.Year === year || r.year === year)
      );

    return hasGBIncome ? 100 : 0;
  }

  getWithholdingRates() {
    return {
      employment: 0, // PAYE handled differently
      freelance: 0,
      dividend: 0,
    };
  }

  // --- Main Calculation Method ---

  calculateTax(grossIncome, incomeType, options = {}) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for UKResidency');
    }

    const {
      year,
      specialRegime,
      sourceCountry = 'GB',
      freelanceType,
      expenses,
      aggregate = false,
      region = 'default',
    } = options;

    // UK has no special regimes (yet)
    const specialRegimeStatus = specialRegime
      ? { active: false }
      : { active: false };

    const isUKSource = sourceCountry === 'GB';

    switch (incomeType) {
      case 'employment':
        return this.calculateEmploymentTax(
          grossIncome,
          specialRegimeStatus,
          isUKSource,
          year,
          region
        );

      case 'freelance':
        return this.calculateFreelanceTax(
          grossIncome,
          specialRegimeStatus,
          isUKSource,
          freelanceType,
          expenses,
          year,
          region
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

  // --- Helper for Tax Brackets ---

  _getShiftedTaxBrackets(year, type, region = 'default') {
    // For income tax, we shift bands by the Standard Personal Allowance
    // because CSV bands usually include the PA band (0-12570).
    // We want bands relative to Taxable Income.

    const brackets = this.referenceData.taxBrackets.filter(b => {
      const typeMatch = b.IncomeType === type;
      const regionMatch =
        region === 'default' || !b.Region
          ? typeMatch
          : b.Region === region && typeMatch;
      return regionMatch;
    });

    if (type !== 'income') {
      return brackets;
    }

    const stdPADeduction = this.referenceData.deductions.find(
      d => d.Year == year && d.Type === 'PersonalAllowance'
    );
    const stdPA = stdPADeduction ? parseFloat(stdPADeduction.Amount) : 0;

    return brackets
      .map(b => ({
        ...b,
        MinIncome: Math.max(0, parseFloat(b.MinIncome) - stdPA),
        MaxIncome: b.MaxIncome ? parseFloat(b.MaxIncome) - stdPA : null,
      }))
      .filter(b => {
        if (b.MaxIncome !== null && b.MaxIncome <= b.MinIncome) return false;
        return true;
      });
  }

  // --- Specific Tax Calculations ---

  calculateEmploymentTax(
    grossIncome,
    specialRegimeStatus,
    isUKSource,
    year,
    region = 'default'
  ) {
    const incomeGBP = grossIncome;

    const personalAllowance = calculateUKPersonalAllowance(
      incomeGBP,
      year,
      this.referenceData.deductions
    );
    const taxableIncome = Math.max(0, incomeGBP - personalAllowance);

    const incomeBrackets = this._getShiftedTaxBrackets(year, 'income', region);
    const taxAmount = calculateUKProgressiveTax(
      taxableIncome,
      year,
      incomeBrackets
    );

    const nationalInsurance = calculateUKEmploymentNI(
      incomeGBP,
      year,
      this.referenceData.socialSecurity
    );

    return {
      taxType: 'PROGRESSIVE',
      taxableIncome,
      taxAmount,
      socialSecurity: nationalInsurance,
      solidarityTax: 0,
      isExempt: false,
      personalAllowance,
      region,
    };
  }

  calculateFreelanceTax(
    grossIncome,
    specialRegimeStatus,
    isUKSource,
    freelanceType,
    expenses = 0,
    year,
    region = 'default'
  ) {
    const incomeGBP = grossIncome;

    const tradingAllowance = calculateUKTradingAllowance(
      incomeGBP,
      year,
      this.referenceData.deductions
    );

    const deduction = Math.max(expenses, tradingAllowance);

    const taxableIncome = Math.max(0, incomeGBP - deduction);

    const personalAllowance = calculateUKPersonalAllowance(
      incomeGBP,
      year,
      this.referenceData.deductions
    );
    const afterAllowance = Math.max(0, taxableIncome - personalAllowance);

    const incomeBrackets = this._getShiftedTaxBrackets(year, 'income', region);
    const taxAmount = calculateUKProgressiveTax(
      afterAllowance,
      year,
      incomeBrackets
    );

    const niBreakdown = calculateUKFreelanceNI(
      incomeGBP,
      year,
      this.referenceData.socialSecurity
    );

    return {
      taxType:
        freelanceType === 'services' ? 'FREELANCE_SERVICES' : 'FREELANCE_GOODS',
      taxableIncome,
      taxAmount,
      socialSecurity: niBreakdown.total,
      solidarityTax: 0,
      isExempt: false,
      personalAllowance,
      tradingAllowance: deduction === tradingAllowance ? tradingAllowance : 0,
      expenses: deduction === expenses ? expenses : 0,
      class2NI: niBreakdown.class2,
      class4NI: niBreakdown.class4,
      region,
    };
  }

  calculateDividendTax(
    grossIncome,
    specialRegimeStatus,
    sourceCountry,
    aggregate,
    year
  ) {
    // Tax calculation is done entirely in GBP
    const incomeGBP = grossIncome;

    // Calculate dividend allowance
    const dividendAllowance = calculateUKDividendAllowance(
      incomeGBP,
      year,
      this.referenceData.deductions
    );
    const taxableIncome = Math.max(0, incomeGBP - dividendAllowance);

    // UK has specific dividend tax rates (different from income tax rates)
    const dividendBands = this.referenceData.taxBrackets.filter(
      band => band.IncomeType === 'dividend'
    );
    const taxAmount = calculateUKProgressiveTax(
      taxableIncome,
      year,
      dividendBands
    );

    return {
      taxType: 'DIVIDEND',
      taxableIncome,
      taxAmount,
      socialSecurity: 0,
      solidarityTax: 0,
      isExempt: false,
      dividendAllowance,
    };
  }

  calculateWithholdingForIncome(
    _grossIncome,
    _incomeType,
    _sourceCountry,
    _year
  ) {
    // UK withholding tax is handled through PAYE for employment
    // For foreign income, use double taxation treaties
    return 0;
  }

  getSocialSecurityAmount(grossIncome, incomeType, freelanceType, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for UKResidency');
    }

    if (incomeType === 'employment') {
      return calculateUKEmploymentNI(
        grossIncome,
        year,
        this.referenceData.socialSecurity
      );
    } else if (incomeType === 'freelance') {
      const niBreakdown = calculateUKFreelanceNI(
        grossIncome,
        year,
        this.referenceData.socialSecurity
      );
      return niBreakdown.total;
    }

    return 0;
  }

  calculateStandardTaxOnIncome(
    grossIncome,
    specialRegimeStatus,
    year,
    region = 'default'
  ) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for UKResidency');
    }

    const personalAllowance = calculateUKPersonalAllowance(
      grossIncome,
      year,
      this.referenceData.deductions
    );
    const taxable = Math.max(0, grossIncome - personalAllowance);

    const incomeBrackets = this._getShiftedTaxBrackets(year, 'income', region);
    return calculateUKProgressiveTax(taxable, year, incomeBrackets);
  }
}

module.exports = GBResidency;
