const {
  calculateSocialSecurity,
  getFreelanceTaxableBase,
  getSSDataForYear,
} = require('../../../lib/residency/pt/socialSecurity');

// New data structure: single row per year with all income types combined
const MOCK_SS_DATA = [
  {
    Year: 2025,
    IAS: 522.5,
    EmploymentRate: 0.11,
    FreelanceRate: 0.214,
    FreelanceCoefficient: 0.7,
    FreelanceCapMonthly: 522.5 * 12, // 6270.00
    DividendRate: 0,
  },
  {
    Year: 2026,
    IAS: 537.13,
    EmploymentRate: 0.11,
    FreelanceRate: 0.214,
    FreelanceCoefficient: 0.7,
    FreelanceCapMonthly: 537.13 * 12, // 6445.56
    DividendRate: 0,
  },
];

describe('Portugal - Social Security Calculation', () => {
  describe('getSSDataForYear', () => {
    test('should return data for 2025', () => {
      const ssData = getSSDataForYear(2025, MOCK_SS_DATA);
      expect(ssData.Year).toBe(2025);
      expect(ssData.EmploymentRate).toBe(0.11);
    });

    test('should return data for 2026', () => {
      const ssData = getSSDataForYear(2026, MOCK_SS_DATA);
      expect(ssData.Year).toBe(2026);
      expect(ssData.FreelanceCapMonthly).toBe(537.13 * 12);
    });
  });

  describe('getFreelanceTaxableBase()', () => {
    test('returns 70% coefficient for 2025', () => {
      const base = getFreelanceTaxableBase(10000, 2025, MOCK_SS_DATA);
      expect(base).toBe(7000); // 10000 * 0.70
    });

    test('returns 70% coefficient for 2026', () => {
      const base = getFreelanceTaxableBase(10000, 2026, MOCK_SS_DATA);
      expect(base).toBe(7000); // 10000 * 0.70
    });

    test('throws error for year before available data', () => {
      expect(() => getFreelanceTaxableBase(10000, 2020, MOCK_SS_DATA)).toThrow(
        'No social security data found for year 2020'
      );
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
      expect(ss).toBeCloseTo(135.8, 2);
    });
  });

  describe('Freelance Social Security (70% coefficient)', () => {
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

    test('capped at 75,240 for 2025 (600,000 income)', () => {
      const ss = calculateSocialSecurity(600000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      // 600000 * 0.70 * 0.214 = 89880 > Cap
      // Cap = 6270 * 12 = 75240
      expect(ss).toBe(75240);
    });

    test('capped income for 2026 (600,000 income)', () => {
      const ss = calculateSocialSecurity(600000, 'freelance', 'services', 2026, MOCK_SS_DATA);
      // 600000 * 0.70 * 0.214 = 89880 > Cap
      // Cap = 6445.56 * 12 = 77346.72
      expect(ss).toBe(77346.72);
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
      const ss = calculateSocialSecurity(600000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(75240);
    });

    test('uses 2026 cap for 2026', () => {
      const ss = calculateSocialSecurity(600000, 'freelance', 'services', 2026, MOCK_SS_DATA);
      expect(ss).toBe(77346.72);
    });
  });

  describe('Error handling', () => {
    test('handles unknown income type gracefully', () => {
      const ss = calculateSocialSecurity(10000, 'unknown', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(0);
    });

    test('throws error for year before available data', () => {
      expect(() =>
        calculateSocialSecurity(10000, 'employment', 'services', 2020, MOCK_SS_DATA)
      ).toThrow('No social security data found for year 2020');
    });

    test('throws error for missing social security data', () => {
      expect(() => calculateSocialSecurity(10000, 'employment', 'services', 2025, null)).toThrow();
    });
  });
});
