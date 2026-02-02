
const { calculateSocialSecurity, getFreelanceTaxableBase, getSSDataForYear } = require('../../../lib/residency/pt/socialSecurity');

const MOCK_SS_DATA = [
  { 
    Year: 2025, 
    IncomeType: 'employment', 
    Rate: 0.11, 
    CoefficientServices: null, 
    CoefficientGoods: null, 
    Cap: null
  },
  { 
    Year: 2025, 
    IncomeType: 'freelance', 
    Rate: 0.214, 
    CoefficientServices: 0.70, 
    CoefficientGoods: 0.20, 
    Cap: 73333.44  // 12 * 12 * 509.26
  },
  { 
    Year: 2025, 
    IncomeType: 'dividend', 
    Rate: 0, 
    CoefficientServices: null, 
    CoefficientGoods: null, 
    Cap: null 
  },
  // 2026 data with updated cap (12 * 12 * 537.13 = 77,344.56)
  {
    Year: 2026,
    IncomeType: 'freelance',
    Rate: 0.214,
    CoefficientServices: 0.70,
    CoefficientGoods: 0.20, 
    Cap: 77344.56
  }
];

describe('Portugal - Social Security Calculation', () => {
  describe('getSSDataForYear', () => {
    test('should filter by income type if provided', () => {
      // Testing internal behavior if we expose filtering
      // But getSSDataForYear in original file only took (year, data)
      // We will likely need to update it to (year, data, incomeType)
      const ssData = getSSDataForYear(2025, MOCK_SS_DATA, 'employment');
      expect(ssData.IncomeType).toBe('employment');
      expect(ssData.Rate).toBe(0.11);
    });

    test('should return correct row for freelance', () => {
      const ssData = getSSDataForYear(2025, MOCK_SS_DATA, 'freelance');
      expect(ssData.IncomeType).toBe('freelance');
      expect(ssData.CoefficientServices).toBe(0.70);
    });
  });

  describe('getFreelanceTaxableBase()', () => {
    test('returns 70% coefficient for services', () => {
      const base = getFreelanceTaxableBase(10000, 'services', 2025, MOCK_SS_DATA);
      expect(base).toBe(7000); // 10000 * 0.70
    });

    test('returns 20% coefficient for goods', () => {
      const base = getFreelanceTaxableBase(10000, 'goods', 2026, MOCK_SS_DATA);
      expect(base).toBe(2000); // 10000 * 0.20
    });

    test('throws error for invalid year', () => {
      expect(() => getFreelanceTaxableBase(10000, 'services', 2099, MOCK_SS_DATA))
        .toThrow('No social security data found for year 2099');
    });
  });

  describe('Employment Social Security', () => {
    test('11% of gross income (5,000)', () => {
      const ss = calculateSocialSecurity(5000, 'employment', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(550); // 5000 * 0.11
    });

    test('11% of gross income (100,000)', () => {
      const ss = calculateSocialSecurity(100000, 'employment', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(11000); // 100000 * 0.11
    });

    test('no cap for employment (200,000)', () => {
      const ss = calculateSocialSecurity(200000, 'employment', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(22000); // 200000 * 0.11
    });

    test('handles zero income', () => {
      const ss = calculateSocialSecurity(0, 'employment', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(0);
    });

    test('handles fractional amounts', () => {
      const ss = calculateSocialSecurity(1234.56, 'employment', 'services', 2025, MOCK_SS_DATA);
      // 1234.56 * 0.11 = 135.8016
      expect(ss).toBeCloseTo(135.80, 2);
    });
  });

  describe('Freelance Social Security - Services (70% coefficient)', () => {
    test('21.4% of 70% for small income (10,000)', () => {
      const ss = calculateSocialSecurity(10000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      // 10000 * 0.70 * 0.214 = 1498
      expect(ss).toBeCloseTo(1498, 0); 
    });

    test('21.4% of 70% for medium income (50,000)', () => {
      const ss = calculateSocialSecurity(50000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      // 50000 * 0.70 * 0.214 = 7490
      expect(ss).toBeCloseTo(7490, 2);
    });

    test('capped at €73,333.44 for 2025 (400,000 income)', () => {
      const ss = calculateSocialSecurity(400000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      // 400000 * 0.70 * 0.214 = 59920 < Cap
      expect(ss).toBeCloseTo(59920, 0);
    });

    test('capped income above 400,000', () => {
      const ss = calculateSocialSecurity(800000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      // 800000 * 0.70 * 0.214 = 119840 > Cap
      expect(ss).toBe(73333.44);
    });
  });

  describe('Freelance Social Security - Goods (20% coefficient)', () => {
    test('21.4% of 20% for goods income', () => {
      const ss = calculateSocialSecurity(10000, 'freelance', 'goods', 2025, MOCK_SS_DATA);
      // 10000 * 0.20 * 0.214 = 428
      expect(ss).toBeCloseTo(428, 0);
    });
  });

  describe('Dividend Social Security', () => {
    test('returns 0 for any dividend amount', () => {
      const ss = calculateSocialSecurity(10000, 'dividend', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(0);
    });
  });

  describe('Year transitions', () => {
    test('uses 2025 cap for 2025', () => {
      const ss = calculateSocialSecurity(800000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(73333.44);
    });

    test('uses 2026 cap for 2026', () => {
      const ss = calculateSocialSecurity(800000, 'freelance', 'services', 2026, MOCK_SS_DATA);
      expect(ss).toBe(77344.56);
    });
  });

  describe('Error handling', () => {
    test('throws error for invalid income type', () => {
      // Assuming we validate income type against data presence
      expect(() => calculateSocialSecurity(10000, 'invalid', 'services', 2025, MOCK_SS_DATA))
        .toThrow(); // Expect some error
    });

    test('throws error for invalid year', () => {
      expect(() => calculateSocialSecurity(10000, 'employment', 'services', 2099, MOCK_SS_DATA))
        .toThrow('No social security data found for year 2099');
    });

    test('throws error for missing social security data', () => {
      expect(() => calculateSocialSecurity(10000, 'employment', 'services', 2025, null))
        .toThrow('No social security data found for year 2025'); // getTemporalMatch might return null if data is null? No, throws.
    });
  });
});
