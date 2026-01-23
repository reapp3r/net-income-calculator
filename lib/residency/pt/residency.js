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

const REQUIRED_EXPENSE_RATIO_SERVICES = 0.15;

function calculateFreelanceTaxableBaseInternal(grossIncome, freelanceType, expenses, year, socialSecurityData) {
  const coefficient = 0.70;
  let taxableBase = getFreelanceTaxableBase(grossIncome, year, socialSecurityData);

  if (freelanceType === 'services') {
    const requiredExpenses = grossIncome * REQUIRED_EXPENSE_RATIO_SERVICES;
    if (expenses < requiredExpenses) {
      const shortfall = requiredExpenses - expenses;
      taxableBase = taxableBase + shortfall;
      return { taxableBase, expenseShortfall: shortfall, requiredExpenses };
    }
  }

  return { taxableBase, expenseShortfall: 0, requiredExpenses: grossIncome * REQUIRED_EXPENSE_RATIO_SERVICES };
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
        socialSecurity: calculateSocialSecurity(grossIncome, 'employment', 'services', year, this.referenceData.socialSecurity),
        solidarityTax: 0,
        isExempt: false
      };
    }

    if (nhrStatus?.active && !isPortugueseSource && nhrData.ForeignIncomeExempt) {
      return {
        taxType: 'NHR_EXEMPT',
        taxableIncome: 0,
        taxAmount: 0,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: true
      };
    }

    const ss = calculateSocialSecurity(grossIncome, 'employment', 'services', year, this.referenceData.socialSecurity);
    const deduction = calculateSpecificDeduction(grossIncome, year, this.referenceData.deductions);
    const taxableIncome = Math.max(0, grossIncome - ss - deduction);
    const taxAmount = calculateProgressiveTax(taxableIncome, year, this.referenceData.taxBrackets);
    const solidarityTax = calculateSolidarityTax(taxableIncome, year, this.referenceData.solidarity);

    return {
      taxType: 'PROGRESSIVE',
      taxableIncome,
      taxAmount,
      socialSecurity: ss,
      solidarityTax,
      isExempt: false
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
        isExempt: true
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

    const ss = calculateSocialSecurity(grossIncome, 'freelance', freelanceType, year, this.referenceData.socialSecurity);
    const taxAmount = calculateProgressiveTax(actualTaxable, year, this.referenceData.taxBrackets);
    const solidarityTax = calculateSolidarityTax(actualTaxable, year, this.referenceData.solidarity);

    return {
      taxType: freelanceType === 'services' ? 'SERVICES_70' : 'GOODS_20',
      taxableIncome: actualTaxable,
      taxAmount,
      socialSecurity: ss,
      solidarityTax,
      isExempt: false,
      expenseShortfall
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
        isExempt: true
      };
    }

    if (aggregate && (isPT || isEUEEA)) {
      const taxableAmount = grossIncome * 0.50;
      const taxAmount = calculateProgressiveTax(taxableAmount, year, this.referenceData.taxBrackets);

      return {
        taxType: 'AGGREGATED_50',
        taxableIncome: taxableAmount,
        taxAmount,
        socialSecurity: 0,
        solidarityTax: 0,
        isExempt: false,
        note: '50% exemption for PT/EU/EEA dividends'
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
        note: 'Aggregated at progressive rates (no 50% exemption)'
      };
    }

    if (country === 'UK') {
      const progressiveTax = calculateProgressiveTax(grossIncome, year, this.referenceData.taxBrackets);
      if (progressiveTax < grossIncome * 0.28) {
        return {
          taxType: 'AGGREGATED_PROGRESSIVE',
          taxableIncome: grossIncome,
          taxAmount: progressiveTax,
          socialSecurity: 0,
          solidarityTax: 0,
          isExempt: false,
          note: 'UK dividend: Progressive rates cheaper than 28% flat'
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
        note: 'Tax haven: 35% flat rate'
      };
    }

    return {
      taxType: 'DIVIDEND_28',
      taxableIncome: grossIncome,
      taxAmount: grossIncome * 0.28,
      socialSecurity: 0,
      solidarityTax: 0,
      isExempt: false
    };
  }

  getFiscalYearMapping() {
    return {
      type: 'calendar',
      startMonth: 1,
      startDay: 1,
      description: 'Calendar year (January 1 - December 31)'
    };
  }

  getSpecialRegimeName() {
    return 'NHR';
  }

  getOutputFields() {
    return {
      includeSolidarityTax: true,
      includePersonalDeductions: true,
      includeSocialSecurity: true,
      includeForeignWithholding: true,
      includeTaxType: true,
      includeRegimeStatus: true,
      solidarityTaxLabel: 'SolidarityTax',
      regimeStatusLabel: 'SpecialRegimeStatus'
    };
  }

  getWithholdingRates() {
    return {
      employment: 0,
      freelance: 0.25,
      dividend: 0.25
    };
  }

  isEligibleFor50PercentDividendExemption() {
    return true;
  }

  calculateWithholdingForIncome(grossIncome, incomeType, sourceCountry, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    const rate = getWithholdingRate(year, sourceCountry, incomeType, this.referenceData.foreignTaxCredit);
    return grossIncome * rate;
  }

  getSocialSecurityAmount(grossIncome, incomeType, freelanceType, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    return calculateSocialSecurity(grossIncome, incomeType, freelanceType, year, this.referenceData.socialSecurity);
  }

  getSpecialRegimeStatus(acquiredDate, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    return getNHRStatus(acquiredDate, year, this.referenceData.specialRegimes);
  }

  calculateStandardTaxOnIncome(grossIncome, specialRegimeStatus, year) {
    if (!this.referenceData) {
      throw new Error('Reference data not set for PortugalResidency');
    }

    if (specialRegimeStatus.active) return 0;

    const ss = calculateSocialSecurity(grossIncome, 'employment', 'services', year, this.referenceData.socialSecurity);
    const deduction = calculateSpecificDeduction(grossIncome, year, this.referenceData.deductions);
    const taxable = Math.max(0, grossIncome - ss - deduction);
    
    const tax = calculateProgressiveTax(taxable, year, this.referenceData.taxBrackets);
    const solidarity = calculateSolidarityTax(taxable, year, this.referenceData.solidarity);
    
    return tax + solidarity;
  }
}

module.exports = PortugalResidency;
