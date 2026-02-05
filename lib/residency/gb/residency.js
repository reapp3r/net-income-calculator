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
  calculateUKPersonalSavingsAllowance,
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
      employment: 0,
      freelance: 0,
      dividend: 0,
    };
  }

  // --- UK Tax Stack Order ---

  /**
   * Allocate Personal Allowance across income types following UK tax stack order
   * Order: 1. Employment/Pension (non-savings), 2. Interest/Savings, 3. Dividends
   *
   * @param {Array} incomeRecords - Array of income records for the period
   * @param {number} year - Tax year
   * @returns {Object} Allocation mapping: { employment: PA_amount, interest: PA_amount, dividend: PA_amount }
   */
  allocatePersonalAllowanceByTaxStack(incomeRecords, year) {
    const totalPA = calculateUKPersonalAllowance(
      0,
      year,
      this.referenceData.deductions
    );

    const allocation = {
      employment: 0,
      pension: 0,
      interest: 0,
      dividend: 0,
    };

    let remainingPA = totalPA;

    const incomesByType = {
      employment: 0,
      pension: 0,
      interest: 0,
      dividend: 0,
    };

    for (const record of incomeRecords) {
      const type = record.incomeType;
      if (type === 'employment' || type === 'pension') {
        incomesByType[type] += record.amount || 0;
      } else if (type === 'interest' || type === 'dividend') {
        incomesByType[type] += record.amount || 0;
      }
    }

    const employmentPensionTotal =
      incomesByType.employment + incomesByType.pension;
    if (employmentPensionTotal > 0 && remainingPA > 0) {
      const paForEmploymentPension = Math.min(
        employmentPensionTotal,
        remainingPA
      );
      const ratio = incomesByType.employment / employmentPensionTotal;
      allocation.employment = paForEmploymentPension * ratio;
      allocation.pension = paForEmploymentPension * (1 - ratio);
      remainingPA -= paForEmploymentPension;
    }

    if (incomesByType.interest > 0 && remainingPA > 0) {
      allocation.interest = Math.min(incomesByType.interest, remainingPA);
      remainingPA -= allocation.interest;
    }

    if (incomesByType.dividend > 0 && remainingPA > 0) {
      allocation.dividend = Math.min(incomesByType.dividend, remainingPA);
      remainingPA -= allocation.dividend;
    }

    return allocation;
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
      region,
      allocatedPersonalAllowance,
    } = options;

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
          allocatedPersonalAllowance,
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
          allocatedPersonalAllowance,
          region
        );

      case 'dividend':
        return this.calculateDividendTax(
          grossIncome,
          specialRegimeStatus,
          sourceCountry,
          aggregate,
          year,
          allocatedPersonalAllowance,
          region
        );

      case 'interest':
        return this.calculateInterestTax(
          grossIncome,
          specialRegimeStatus,
          year,
          allocatedPersonalAllowance,
          region
        );

      case 'pension':
        return this.calculateEmploymentTax(
          grossIncome,
          specialRegimeStatus,
          isUKSource,
          year,
          allocatedPersonalAllowance,
          region
        );

      default:
        throw new Error(`Unsupported income type: ${incomeType}`);
    }
  }

  // --- Helper for Tax Brackets ---

  _getShiftedTaxBrackets(year, type, region = null) {
    let brackets = this.referenceData.taxBrackets.filter(
      b => b.IncomeType === type
    );

    if (
      region &&
      brackets.some(
        b => b.Region !== undefined && b.Region !== null && b.Region !== ''
      )
    ) {
      const regionSpecific = brackets.filter(b => b.Region === region);
      if (regionSpecific.length > 0) {
        brackets = regionSpecific;
      }
    }

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
    allocatedPersonalAllowance = null,
    region = null
  ) {
    const incomeGBP = grossIncome;

    const personalAllowance =
      allocatedPersonalAllowance !== null
        ? allocatedPersonalAllowance
        : calculateUKPersonalAllowance(
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
    allocatedPersonalAllowance = null,
    region = null
  ) {
    const incomeGBP = grossIncome;

    const tradingAllowance = calculateUKTradingAllowance(
      incomeGBP,
      year,
      this.referenceData.deductions
    );

    const deduction = Math.max(expenses, tradingAllowance);
    const taxableIncome = Math.max(0, incomeGBP - deduction);

    const personalAllowance =
      allocatedPersonalAllowance !== null
        ? allocatedPersonalAllowance
        : calculateUKPersonalAllowance(
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
    year,
    allocatedPersonalAllowance = null,
    region = null
  ) {
    const incomeGBP = grossIncome;

    const dividendAllowance = calculateUKDividendAllowance(
      incomeGBP,
      year,
      this.referenceData.deductions
    );

    const afterDividendAllowance = Math.max(0, incomeGBP - dividendAllowance);

    const personalAllowance =
      allocatedPersonalAllowance !== null ? allocatedPersonalAllowance : 0;

    const taxableIncome = Math.max(
      0,
      afterDividendAllowance - personalAllowance
    );

    let dividendBands = this.referenceData.taxBrackets.filter(
      band => band.IncomeType === 'dividend'
    );

    if (
      region &&
      dividendBands.some(
        b => b.Region !== undefined && b.Region !== null && b.Region !== ''
      )
    ) {
      const regionSpecific = dividendBands.filter(b => b.Region === region);
      if (regionSpecific.length > 0) {
        dividendBands = regionSpecific;
      }
    }

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
      personalAllowance,
    };
  }

  calculateInterestTax(
    grossIncome,
    specialRegimeStatus,
    year,
    allocatedPersonalAllowance = null,
    region = null
  ) {
    const incomeGBP = grossIncome;

    const incomeBrackets = this._getShiftedTaxBrackets(year, 'income', region);

    const personalAllowance =
      allocatedPersonalAllowance !== null
        ? allocatedPersonalAllowance
        : calculateUKPersonalAllowance(0, year, this.referenceData.deductions);

    const personalSavingsAllowance = calculateUKPersonalSavingsAllowance(
      incomeGBP,
      year,
      incomeBrackets,
      this.referenceData.deductions
    );

    const taxableIncome = Math.max(0, incomeGBP - personalSavingsAllowance);
    const afterAllowance = Math.max(0, taxableIncome - personalAllowance);

    const taxAmount = calculateUKProgressiveTax(
      afterAllowance,
      year,
      incomeBrackets
    );

    return {
      taxType: 'INTEREST',
      taxableIncome,
      taxAmount,
      socialSecurity: 0,
      solidarityTax: 0,
      isExempt: false,
      personalSavingsAllowance,
      personalAllowance,
      region,
    };
  }

  calculateWithholdingForIncome(
    _grossIncome,
    _incomeType,
    _sourceCountry,
    _year
  ) {
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
    region = null
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
