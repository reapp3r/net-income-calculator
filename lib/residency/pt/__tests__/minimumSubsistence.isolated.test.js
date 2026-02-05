/**
 * ISOLATED Unit Test for Minimum Subsistence
 * Target: lib/residency/pt/residency.js (getAnnualAdjustments)
 *
 * Purpose: Verify implementation correctness of minimum subsistence adjustment.
 */

const PortugalResidency = require('../residency');

describe('Minimum Subsistence Calculation', () => {
  const mockReferenceData = {
    taxBrackets: [],
    socialSecurity: [],
    solidarity: [],
    deductions: [],
    specialRegimes: [],
    foreignTaxCredit: [],
    minimumSubsistence: [
      { Year: 2025, Amount: 0 },
      { Year: 2026, Amount: 12880 },
    ],
  };

  const createMockResult = netIncome => ({
    GrossIncome: '15000.00',
    TaxAmount: '3000.00',
    SocialSecurity: '1500.00',
    PersonalDeductions: '500.00',
    SolidarityTax: '0.00',
    NetIncome: netIncome.toFixed(2),
  });

  describe('getAnnualAdjustments', () => {
    test('returns no adjustment for 2025 (not implemented)', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const result = residency.getAnnualAdjustments(10000, 2025);
      expect(Object.keys(result).length).toBe(0);
      expect(result.MinimumSubsistenceAdjustment).toBeUndefined();
    });

    test('returns no adjustment when net income meets minimum subsistence threshold (2026)', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const result = residency.getAnnualAdjustments(15000, 2026);
      expect(Object.keys(result).length).toBe(0);
    });

    test('returns no adjustment when net income equals minimum subsistence (2026)', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const result = residency.getAnnualAdjustments(12880, 2026);
      expect(Object.keys(result).length).toBe(0);
    });

    test('calculates adjustment when net income is below minimum subsistence (2026)', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const result = residency.getAnnualAdjustments(10000, 2026);
      expect(result.MinimumSubsistenceAdjustment).toBe(2880);
    });

    test('calculates full adjustment when net income is zero (2026)', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const result = residency.getAnnualAdjustments(0, 2026);
      expect(result.MinimumSubsistenceAdjustment).toBe(12880);
    });

    test('handles negative net income gracefully (2026)', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const result = residency.getAnnualAdjustments(-1000, 2026);
      expect(result.MinimumSubsistenceAdjustment).toBe(13880);
    });

    test('returns no adjustment for years beyond 2026', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const result = residency.getAnnualAdjustments(10000, 2027);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('calculateAnnualSummary', () => {
    test('returns summary without adjustment when income above threshold (2026)', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const period = { year: 2026, country: 'PT', specialRegimeStatus: null };
      const monthlyResults = [createMockResult(15000)];

      const result = residency.calculateAnnualSummary(period, monthlyResults);
      expect(result.NetIncome).toBe('15000.00');
      expect(result.MinimumSubsistenceAdjustment).toBeUndefined();
    });

    test('applies minimum subsistence adjustment to summary (2026)', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const period = { year: 2026, country: 'PT', specialRegimeStatus: null };
      const monthlyResults = [createMockResult(10000)];

      const result = residency.calculateAnnualSummary(period, monthlyResults);
      expect(result.NetIncome).toBe('12880.00');
      expect(result.MinimumSubsistenceAdjustment).toBe('2880.00');
      expect(result.GrossIncome).toBe('15000.00');
    });

    test('returns summary without adjustment for 2025', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const period = { year: 2025, country: 'PT', specialRegimeStatus: null };
      const monthlyResults = [createMockResult(5000)];

      const result = residency.calculateAnnualSummary(period, monthlyResults);
      expect(result.NetIncome).toBe('5000.00');
      expect(result.MinimumSubsistenceAdjustment).toBeUndefined();
    });

    test('sums multiple monthly results correctly', () => {
      const residency = new PortugalResidency(mockReferenceData);
      const period = { year: 2026, country: 'PT', specialRegimeStatus: null };
      const monthlyResults = [createMockResult(5000), createMockResult(3000)];

      const result = residency.calculateAnnualSummary(period, monthlyResults);
      expect(result.NetIncome).toBe('12880.00');
      expect(result.MinimumSubsistenceAdjustment).toBe('4880.00');
      expect(result.GrossIncome).toBe('30000.00');
    });
  });
});
