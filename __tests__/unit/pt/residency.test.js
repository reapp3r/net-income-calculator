/**
 * Unit Test for PortugalResidency
 * Target: lib/residency/pt/residency.js
 */

const PortugalResidency = require('../../../lib/residency/pt/residency');
const { TaxResidency } = require('../../../lib/residency/base');

// Mock dependencies
jest.mock('../../../lib/residency/base');
jest.mock('../../../lib/residency/pt/progressive');
jest.mock('../../../lib/residency/pt/solidarity');
jest.mock('../../../lib/residency/pt/socialSecurity');
jest.mock('../../../lib/residency/pt/nhr');
jest.mock('../../../lib/residency/pt/deductions');
jest.mock('../../../lib/residency/pt/foreignTaxCredit');

const { calculateProgressiveTax } = require('../../../lib/residency/pt/progressive');
const { calculateSolidarityTax } = require('../../../lib/residency/pt/solidarity');
const { calculateSocialSecurity, getFreelanceTaxableBase } = require('../../../lib/residency/pt/socialSecurity');
const { getNHRStatus, getNHRRegimeData } = require('../../../lib/residency/pt/nhr');
const { calculateSpecificDeduction } = require('../../../lib/residency/pt/deductions');
const { getWithholdingRate } = require('../../../lib/residency/pt/foreignTaxCredit');

describe('PortugalResidency', () => {
  let residency;
  let mockReferenceData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock reference data
    mockReferenceData = {
      taxBrackets: [{ min: 0, rate: 0.145 }],
      socialSecurity: { rate: 0.11 },
      deductions: { specific: 4104 },
      specialRegimes: { nhr: { active: true } },
      solidarity: { thresholds: [] },
      foreignTaxCredit: { rates: {} }
    };
    
    // Setup mock implementations
    calculateProgressiveTax.mockReturnValue(1000);
    calculateSolidarityTax.mockReturnValue(100);
    calculateSocialSecurity.mockReturnValue(500);
    calculateSpecificDeduction.mockReturnValue(4104);
    getWithholdingRate.mockReturnValue(0.25);
    getNHRStatus.mockReturnValue({ active: false });
    getNHRRegimeData.mockReturnValue({
      DomesticEmploymentRate: 0.20,
      ForeignIncomeExempt: true
    });
    getFreelanceTaxableBase.mockReturnValue(7000); // 70% of 10000

    residency = new PortugalResidency(mockReferenceData);
  });

  describe('Constructor', () => {
    it('should initialize with correct country code and name', () => {
      expect(residency.countryCode).toBe('PT');
      expect(residency.countryName).toBe('Portugal');
      expect(residency.referenceData).toBe(mockReferenceData);
    });

    it('should set reference data', () => {
      residency.setReferenceData(null);
      expect(residency.referenceData).toBeNull();
      residency.setReferenceData(mockReferenceData);
      expect(residency.referenceData).toBe(mockReferenceData);
    });
  });

  describe('Metadata Methods', () => {
    it('getDeductionsModule should return module', () => {
      // Since we mocked the module, it might return the mock or the actual object depending on how require works with mocks
      // But we just verify it doesn't throw
      expect(residency.getDeductionsModule()).toBeDefined();
    });

    it('getFiscalYearMapping should return calendar year', () => {
      const mapping = residency.getFiscalYearMapping();
      expect(mapping.type).toBe('calendar');
      expect(mapping.startMonth).toBe(1);
    });

    it('getSpecialRegimeName should return NHR', () => {
      expect(residency.getSpecialRegimeName()).toBe('NHR');
    });

    it('getOutputFields should return correct configuration', () => {
      const fields = residency.getOutputFields();
      expect(fields.includeSocialSecurity).toBe(true);
      expect(fields.regimeStatusLabel).toBe('SpecialRegimeStatus');
    });

    it('getWithholdingRates should return standard rates', () => {
      const rates = residency.getWithholdingRates();
      expect(rates.employment).toBe(0);
      expect(rates.freelance).toBe(0.25);
      expect(rates.dividend).toBe(0.25);
    });

    it('isEligibleFor50PercentDividendExemption should return true', () => {
      expect(residency.isEligibleFor50PercentDividendExemption()).toBe(true);
    });
  });

  describe('calculateEmploymentTax', () => {
    it('should throw error if reference data is missing', () => {
      residency.referenceData = null;
      expect(() => residency.calculateEmploymentTax(10000, null, true, 2025)).toThrow();
    });

    it('should calculate standard progressive tax', () => {
      const result = residency.calculateEmploymentTax(10000, { active: false }, true, 2025);
      
      expect(calculateSocialSecurity).toHaveBeenCalled();
      expect(calculateSpecificDeduction).toHaveBeenCalled();
      expect(calculateProgressiveTax).toHaveBeenCalled();
      expect(calculateSolidarityTax).toHaveBeenCalled();
      
      expect(result.taxType).toBe('PROGRESSIVE');
      expect(result.socialSecurity).toBe(500);
      expect(result.taxAmount).toBe(1000);
      expect(result.solidarityTax).toBe(100);
    });

    it('should calculate NHR flat rate for domestic employment', () => {
      const result = residency.calculateEmploymentTax(10000, { active: true }, true, 2025);
      
      expect(result.taxType).toBe('NHR_FLAT_20');
      expect(result.taxAmount).toBe(10000 * 0.20);
      expect(result.socialSecurity).toBe(500);
    });

    it('should calculate NHR exemption for foreign employment', () => {
      const result = residency.calculateEmploymentTax(10000, { active: true }, false, 2025);
      
      expect(result.taxType).toBe('NHR_EXEMPT');
      expect(result.isExempt).toBe(true);
      expect(result.taxAmount).toBe(0);
    });

    it('should fall back to progressive for foreign employment if NHR inactive', () => {
      const result = residency.calculateEmploymentTax(10000, { active: false }, false, 2025);
      
      expect(result.taxType).toBe('PROGRESSIVE');
      expect(calculateProgressiveTax).toHaveBeenCalled();
    });
  });

  describe('calculateFreelanceTax', () => {
    it('should throw error if reference data is missing', () => {
      residency.referenceData = null;
      expect(() => residency.calculateFreelanceTax(10000, null, true, 'services', 0, 2025)).toThrow();
    });

    it('should calculate standard freelance tax (services)', () => {
      const result = residency.calculateFreelanceTax(10000, { active: false }, true, 'services', 0, 2025);
      
      expect(getFreelanceTaxableBase).toHaveBeenCalled();
      expect(calculateSocialSecurity).toHaveBeenCalled();
      expect(calculateProgressiveTax).toHaveBeenCalled();
      
      expect(result.taxType).toBe('SERVICES_70');
      expect(result.taxableIncome).toBe(7000); // from mock
      expect(result.expenseShortfall).toBe(1500); // 15% of 10000
    });

    it('should calculate freelance tax with goods type', () => {
       // Mock internal logic check for freelance type
       getFreelanceTaxableBase.mockReturnValue(2000); // 20%
       
       const result = residency.calculateFreelanceTax(10000, { active: false }, true, 'goods', 0, 2025);
       
       expect(result.taxType).toBe('GOODS_20');
    });

    it('should calculate NHR exemption for foreign freelance', () => {
      const result = residency.calculateFreelanceTax(10000, { active: true }, false, 'services', 0, 2025);
      
      expect(result.taxType).toBe('NHR_EXEMPT');
      expect(result.isExempt).toBe(true);
    });
  });

  describe('calculateDividendTax', () => {
    it('should throw error if reference data is missing', () => {
      residency.referenceData = null;
      expect(() => residency.calculateDividendTax(10000, null, 'PT', false, 2025)).toThrow();
    });

    it('should calculate standard 28% flat rate', () => {
      const result = residency.calculateDividendTax(10000, { active: false }, 'US', false, 2025);
      
      expect(result.taxType).toBe('DIVIDEND_28');
      expect(result.taxAmount).toBe(2800);
    });

    it('should calculate NHR exemption', () => {
      const result = residency.calculateDividendTax(10000, { active: true }, 'US', false, 2025);
      
      expect(result.taxType).toBe('NHR_EXEMPT');
      expect(result.isExempt).toBe(true);
    });

    it('should calculate aggregated 50% exemption for PT/EU dividends', () => {
      const result = residency.calculateDividendTax(10000, { active: false }, 'PT', true, 2025);
      
      expect(result.taxType).toBe('AGGREGATED_50');
      expect(result.taxableIncome).toBe(5000);
      expect(calculateProgressiveTax).toHaveBeenCalledWith(5000, 2025, expect.anything());
    });

    it('should calculate aggregated progressive for non-EU dividends', () => {
      const result = residency.calculateDividendTax(10000, { active: false }, 'US', true, 2025);
      
      expect(result.taxType).toBe('AGGREGATED_PROGRESSIVE');
      expect(result.taxableIncome).toBe(10000);
      expect(calculateProgressiveTax).toHaveBeenCalledWith(10000, 2025, expect.anything());
    });

    it('should apply UK special check (progressive cheaper than flat)', () => {
      calculateProgressiveTax.mockReturnValue(2000); // 20% < 28%
      
      const result = residency.calculateDividendTax(10000, { active: false }, 'UK', false, 2025);
      
      expect(result.taxType).toBe('AGGREGATED_PROGRESSIVE');
      expect(result.note).toContain('UK dividend');
    });

    it('should use 28% for UK if progressive is more expensive', () => {
      calculateProgressiveTax.mockReturnValue(4000); // 40% > 28%
      
      const result = residency.calculateDividendTax(10000, { active: false }, 'UK', false, 2025);
      
      expect(result.taxType).toBe('DIVIDEND_28');
    });

    it('should apply 35% rate for tax havens', () => {
      const result = residency.calculateDividendTax(10000, { active: false }, 'KY', false, 2025);
      
      expect(result.taxType).toBe('DIVIDEND_35');
      expect(result.taxAmount).toBe(3500);
    });
  });

  describe('Helper Methods', () => {
    it('isEUEEA should identify EU/EEA countries', () => {
      expect(residency.isEUEEA('PT')).toBe(true);
      expect(residency.isEUEEA('DE')).toBe(true);
      expect(residency.isEUEEA('NO')).toBe(true);
      expect(residency.isEUEEA('US')).toBe(false);
      expect(residency.isEUEEA(null)).toBe(false);
    });

    it('isTaxHaven should identify tax havens', () => {
      expect(residency.isTaxHaven('KY')).toBe(true);
      expect(residency.isTaxHaven('BM')).toBe(true);
      expect(residency.isTaxHaven('PT')).toBe(false);
      expect(residency.isTaxHaven(null)).toBe(false);
    });

    it('calculateWithholdingForIncome should use helper', () => {
      const result = residency.calculateWithholdingForIncome(10000, 'dividend', 'US', 2025);
      expect(getWithholdingRate).toHaveBeenCalled();
      expect(result).toBe(2500); // 25% mock
    });

    it('calculateWithholdingForIncome should throw if no reference data', () => {
      residency.referenceData = null;
      expect(() => residency.calculateWithholdingForIncome(1000, 'div', 'US', 2025)).toThrow();
    });

    it('getSocialSecurityAmount should use helper', () => {
      const result = residency.getSocialSecurityAmount(10000, 'employment', 'services', 2025);
      expect(calculateSocialSecurity).toHaveBeenCalled();
      expect(result).toBe(500); // mock
    });

    it('getSocialSecurityAmount should throw if no reference data', () => {
      residency.referenceData = null;
      expect(() => residency.getSocialSecurityAmount(1000, 'emp', 'serv', 2025)).toThrow();
    });

    it('getSpecialRegimeStatus should use helper', () => {
      const result = residency.getSpecialRegimeStatus('2023-01-01', 2025);
      expect(getNHRStatus).toHaveBeenCalled();
      expect(result).toEqual({ active: false });
    });

    it('getSpecialRegimeStatus should throw if no reference data', () => {
      residency.referenceData = null;
      expect(() => residency.getSpecialRegimeStatus('date', 2025)).toThrow();
    });
  });

  describe('Additional Taxes', () => {
    it('getAdditionalTaxes should return solidarity tax if present', () => {
      const result = residency.getAdditionalTaxes({ solidarityTax: 500 }, {}, 2025);
      expect(result.SolidarityTax).toBe(500);
      expect(result.amount).toBe(500);
    });

    it('getAdditionalTaxes should return zero if no solidarity tax', () => {
      const result = residency.getAdditionalTaxes({ solidarityTax: 0 }, {}, 2025);
      expect(result.amount).toBe(0);
    });
    
    it('getAdditionalTaxes should throw if no reference data', () => {
      residency.referenceData = null;
      expect(() => residency.getAdditionalTaxes({}, {}, 2025)).toThrow();
    });

    it('getAnnualAdditionalTaxes should calculate total solidarity tax', () => {
      // Mock returns for calculate functions to have solidarity tax
      calculateProgressiveTax.mockReturnValue(1000);
      calculateSolidarityTax.mockReturnValue(50); // 50 per calculation
      
      const records = [
        { grossIncome: 10000, incomeType: 'employment', sourceCurrency: 'EUR', exchangeRate: 1 },
        { grossIncome: 10000, incomeType: 'freelance', sourceCurrency: 'EUR', exchangeRate: 1 },
        { grossIncome: 10000, incomeType: 'dividend', sourceCurrency: 'EUR', exchangeRate: 1 }
      ];

      const result = residency.getAnnualAdditionalTaxes(records, { active: false }, 2025);
      
      // 3 calculations * 50 = 150
      expect(result.SolidarityTax).toBe(150);
      expect(result.amount).toBe(150);
    });

    it('getAnnualAdditionalTaxes should return zero if no tax', () => {
      calculateSolidarityTax.mockReturnValue(0);
      const records = [{ grossIncome: 1000, incomeType: 'employment', sourceCurrency: 'EUR', exchangeRate: 1 }];
      
      const result = residency.getAnnualAdditionalTaxes(records, { active: false }, 2025);
      expect(result.amount).toBe(0);
    });

    it('getAnnualAdditionalTaxes should throw if no reference data', () => {
      residency.referenceData = null;
      expect(() => residency.getAnnualAdditionalTaxes([], {}, 2025)).toThrow();
    });

    it('formatAdditionalTaxesForOutput should format numbers', () => {
      const input = { SolidarityTax: 123.456, amount: 123.456 };
      const output = residency.formatAdditionalTaxesForOutput(input);
      expect(output.SolidarityTax).toBe('123.46');
      expect(output.amount).toBeUndefined();
    });
  });
  
  describe('calculateStandardTaxOnIncome', () => {
    it('should return 0 if special regime active', () => {
      const result = residency.calculateStandardTaxOnIncome(10000, { active: true }, 2025);
      expect(result).toBe(0);
    });
    
    it('should return combined tax if normal regime', () => {
      calculateProgressiveTax.mockReturnValue(1000);
      calculateSolidarityTax.mockReturnValue(100);
      
      const result = residency.calculateStandardTaxOnIncome(10000, { active: false }, 2025);
      expect(result).toBe(1100);
    });

    it('should throw if no reference data', () => {
      residency.referenceData = null;
      expect(() => residency.calculateStandardTaxOnIncome(1000, { active: false }, 2025)).toThrow();
    });
  });
});
