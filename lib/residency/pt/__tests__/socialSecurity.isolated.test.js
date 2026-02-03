/**
 * ISOLATED Unit Test for SocialSecurity
 * Target: lib/residency/pt/socialSecurity.js
 *
 * Purpose: Verify implementation correctness and expose potential bugs.
 */

const { calculateSocialSecurity } = require('../socialSecurity');

describe('Social Security Calculation', () => {
  const mockSSData = [
    {
      Year: 2025,
      EmploymentRate: 0.11,
      FreelanceRate: 0.214,
      FreelanceCoefficient: 0.7,
      FreelanceCapMonthly: 1000, // Artificially low cap for testing
      DividendRate: 0,
    },
  ];

  test('calculates employment SS correctly (uncapped)', () => {
    // 5000 * 0.11 = 550
    const result = calculateSocialSecurity(
      5000,
      'employment',
      'services',
      2025,
      mockSSData
    );
    expect(result).toBe(550);
  });

  test('calculates freelance SS correctly (below cap)', () => {
    // 1000 * 0.70 * 0.214 = 149.8
    const result = calculateSocialSecurity(
      1000,
      'freelance',
      'services',
      2025,
      mockSSData
    );
    expect(result).toBeCloseTo(149.8);
  });

  test('calculates freelance SS correctly (ABOVE cap)', () => {
    // 100000 * 0.70 * 0.214 = 14980 (annual)
    // Monthly Cap is 1000, Annual Cap = 1000 * 12 = 12000
    // Should be capped at 12000 (annual cap)
    const result = calculateSocialSecurity(
      100000,
      'freelance',
      'services',
      2025,
      mockSSData
    );
    expect(result).toBe(12000);
  });

  test('calculates dividend SS correctly (zero)', () => {
    const result = calculateSocialSecurity(
      5000,
      'dividend',
      'services',
      2025,
      mockSSData
    );
    expect(result).toBe(0);
  });
});
