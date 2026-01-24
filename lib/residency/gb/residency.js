/**
 * @module ukResidency
 * UK Tax Residency
 *
 * Tax residency implementation for the United Kingdom.
 * All tax rules loaded from reference data (no hardcoded values).
 */

const { TaxResidency } = require('../base');
const { calculateUKProgressiveTax, calculateUKPersonalAllowance } = require('./progressive');
const { calculateUKEmploymentNI, calculateUKFreelanceNI } = require('./nationalInsurance');
const { calculateUKTradingAllowance, calculateUKDividendAllowance } = require('./deductions');

class GBResidency extends TaxResidency {
  constructor(referenceData) {
    super();
    this.countryCode = 'GB';
    this.countryName = 'United Kingdom';
    this.referenceData = referenceData;
  }

  setReferenceData(referenceData) {
    this.referenceData = referenceData;
  }

  getFiscalYearMapping() {
    return {
      type: 'custom',
      startMonth: 4,
      startDay: 6,
      description: 'UK tax year (April 6 - April 5)'
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
      regimeStatusLabel: 'SpecialRegimeStatus'
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

  getWithholdingRates() {
    return {
      employment: 0, // PAYE handled differently
      freelance: 0,
      dividend: 0
    };
  }

  calculateEmploymentTax(grossIncome, specialRegimeStatus, isUKSource, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for UKResidency');
    }

    // Tax calculation is done entirely in GBP
    const incomeGBP = grossIncome;

    // Calculate personal allowance
    const personalAllowance = calculateUKPersonalAllowance(incomeGBP, year, this.referenceData.deductions);
    const taxableIncome = Math.max(0, incomeGBP - personalAllowance);

    // Calculate income tax
    const taxAmount = calculateUKProgressiveTax(taxableIncome, year, this.referenceData.taxBrackets);

    // Calculate National Insurance (Class 1)
    const nationalInsurance = calculateUKEmploymentNI(incomeGBP, year, this.referenceData.socialSecurity);

    return {
      taxType: 'PROGRESSIVE',
      taxableIncome,
      taxAmount,
      socialSecurity: nationalInsurance,
      solidarityTax: 0,
      isExempt: false,
      personalAllowance
    };
  }

  calculateFreelanceTax(grossIncome, specialRegimeStatus, isUKSource, freelanceType, expenses, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for UKResidency');
    }

    // Tax calculation is done entirely in GBP
    const incomeGBP = grossIncome;

    // Calculate trading allowance
    const tradingAllowance = calculateUKTradingAllowance(incomeGBP, year, this.referenceData.deductions);
    const taxableIncome = Math.max(0, incomeGBP - tradingAllowance - expenses);

    // Calculate personal allowance (reduced for high earners)
    const personalAllowance = calculateUKPersonalAllowance(incomeGBP, year, this.referenceData.deductions);
    const afterAllowance = Math.max(0, taxableIncome - personalAllowance);

    // Calculate income tax
    const taxAmount = calculateUKProgressiveTax(afterAllowance, year, this.referenceData.taxBrackets);

    // Calculate National Insurance (Class 2 + Class 4)
    const niBreakdown = calculateUKFreelanceNI(incomeGBP, year, this.referenceData.socialSecurity);

    return {
      taxType: freelanceType === 'services' ? 'FREELANCE_SERVICES' : 'FREELANCE_GOODS',
      taxableIncome,
      taxAmount,
      socialSecurity: niBreakdown.total,
      solidarityTax: 0,
      isExempt: false,
      personalAllowance,
      tradingAllowance,
      class2NI: niBreakdown.class2,
      class4NI: niBreakdown.class4
    };
  }

  calculateDividendTax(grossIncome, specialRegimeStatus, sourceCountry, aggregate, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for UKResidency');
    }

    // Tax calculation is done entirely in GBP
    const incomeGBP = grossIncome;

    // Calculate dividend allowance
    const dividendAllowance = calculateUKDividendAllowance(incomeGBP, year, this.referenceData.deductions);
    const taxableIncome = Math.max(0, incomeGBP - dividendAllowance);

    // UK has specific dividend tax rates (different from income tax rates)
    // For now, we'll use progressive tax with dividend-specific bands
    const taxAmount = calculateUKProgressiveTax(taxableIncome, year, this.referenceData.taxBrackets.filter(band => band.IncomeType === 'dividend'));

    return {
      taxType: 'DIVIDEND',
      taxableIncome,
      taxAmount,
      socialSecurity: 0,
      solidarityTax: 0,
      isExempt: false,
      dividendAllowance
    };
  }

  calculateWithholdingForIncome(grossIncome, incomeType, sourceCountry, year) {
    // UK withholding tax is handled through PAYE for employment
    // For foreign income, use double taxation treaties
    return 0;
  }

  getSocialSecurityAmount(grossIncome, incomeType, freelanceType, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for UKResidency');
    }

    if (incomeType === 'employment') {
      return calculateUKEmploymentNI(grossIncome, year, this.referenceData.socialSecurity);
    } else if (incomeType === 'freelance') {
      const niBreakdown = calculateUKFreelanceNI(grossIncome, year, this.referenceData.socialSecurity);
      return niBreakdown.total;
    }

    return 0;
  }

  calculateStandardTaxOnIncome(grossIncome, specialRegimeStatus, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for UKResidency');
    }

    const personalAllowance = calculateUKPersonalAllowance(grossIncome, year, this.referenceData.deductions);
    const taxable = Math.max(0, grossIncome - personalAllowance);
    
    return calculateUKProgressiveTax(taxable, year, this.referenceData.taxBrackets);
  }
}

module.exports = GBResidency;