
const { calculateSocialSecurity, getFreelanceTaxableBase, getSSDataForYear } = require('../../../lib/residency/pt/socialSecurity');

// Mock data matching actual SocialSecurity.csv structure
const MOCK_SS_DATA = [
  {
    Year: 2025,
    IAS: 509.26,
    EmploymentRate: 0.11,
    FreelanceRate: 0.214,
    FreelanceCoefficient: 0.70,
    FreelanceCapMonthly: 6111.12,
    DividendRate: 0
  },
  {
    Year: 2026,
    IAS: 537.13,
    EmploymentRate: 0.11,
    FreelanceRate: 0.214,
    FreelanceCoefficient: 0.70,
    FreelanceCapMonthly: 6445.56,
    DividendRate: 0
  }
];

describe('Portugal - Social Security Calculation', () => {
  describe('getSSDataForYear', () => {
    test('should return data for valid year', () => {
      const ssData = getSSDataForYear(2025, MOCK_SS_DATA);
      expect(ssData.Year).toBe(2025);
      expect(ssData.EmploymentRate).toBe(0.11);
      expect(ssData.FreelanceRate).toBe(0.214);
      expect(ssData.FreelanceCoefficient).toBe(0.70);
      expect(ssData.FreelanceCapMonthly).toBe(6111.12);
    });

    test('should throw error for invalid year', () => {
      // Year 2020 is before the earliest data (2025)
      expect(() => getSSDataForYear(2020, MOCK_SS_DATA))
        .toThrow('No social security data found for year 2020');
    });
  });

  describe('getFreelanceTaxableBase()', () => {
    test('returns 70% coefficient for gross income', () => {
      const base = getFreelanceTaxableBase(10000, 2025, MOCK_SS_DATA);
      expect(base).toBe(7000); // 10000 * 0.70
    });

    test('handles different income amounts', () => {
      expect(getFreelanceTaxableBase(50000, 2025, MOCK_SS_DATA)).toBe(35000); // 50000 * 0.70
      expect(getFreelanceTaxableBase(100000, 2026, MOCK_SS_DATA)).toBe(70000); // 100000 * 0.70
    });

    test('throws error for invalid year', () => {
      // Year 2020 is before the earliest data (2025)
      expect(() => getFreelanceTaxableBase(10000, 2020, MOCK_SS_DATA))
        .toThrow('No social security data found for year 2020');
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

    test('below cap for 2025 (400,000 income)', () => {
      const ss = calculateSocialSecurity(400000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      // 400000 * 0.70 * 0.214 = 59920 < Cap (73333.44)
      expect(ss).toBeCloseTo(59920, 0);
    });

    test('capped at annual cap for 2025', () => {
      const ss = calculateSocialSecurity(800000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      // Cap = 6111.12 * 12 = 73333.44
      // 800000 * 0.70 * 0.214 = 119840 > Cap
      expect(ss).toBe(73333.44);
    });

    test('capped at annual cap for 2026', () => {
      const ss = calculateSocialSecurity(800000, 'freelance', 'services', 2026, MOCK_SS_DATA);
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
      const ss = calculateSocialSecurity(800000, 'freelance', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(73333.44);
    });

    test('uses 2026 cap for 2026', () => {
      const ss = calculateSocialSecurity(800000, 'freelance', 'services', 2026, MOCK_SS_DATA);
      // Cap = 6445.56 * 12 = 77346.72
      expect(ss).toBe(77346.72);
    });
  });

  describe('Error handling', () => {
    test('returns 0 for invalid income type', () => {
      const ss = calculateSocialSecurity(10000, 'invalid', 'services', 2025, MOCK_SS_DATA);
      expect(ss).toBe(0);
    });

    test('throws error for invalid year', () => {
      // Year 2020 is before the earliest data (2025)
      expect(() => calculateSocialSecurity(10000, 'employment', 'services', 2020, MOCK_SS_DATA))
        .toThrow('No social security data found for year 2020');
    });

    test('throws error for missing social security data', () => {
      expect(() => calculateSocialSecurity(10000, 'employment', 'services', 2025, null))
        .toThrow('data must be an array');
    });
  });
});
