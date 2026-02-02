const { calculateProgressiveTax, getTaxBrackets } = require('../../../lib/residency/pt/progressive');

// Mock data (inline, not from files)
const MOCK_TAX_BRACKETS_2025 = [
  { Year: 2025, BracketMin: 0, BracketMax: 7488, Rate: 0 },
  { Year: 2025, BracketMin: 7488, BracketMax: 11284, Rate: 0.145 },
  { Year: 2025, BracketMin: 11284, BracketMax: 15668, Rate: 0.165 },
  { Year: 2025, BracketMin: 15668, BracketMax: 20668, Rate: 0.175 },
  { Year: 2025, BracketMin: 20668, BracketMax: 26356, Rate: 0.20 },
  { Year: 2025, BracketMin: 26356, BracketMax: 38632, Rate: 0.225 },
  { Year: 2025, BracketMin: 38632, BracketMax: 49712, Rate: 0.27 },
  { Year: 2025, BracketMin: 49712, BracketMax: 79706, Rate: 0.32 },
  { Year: 2025, BracketMin: 79706, BracketMax: 134292, Rate: 0.37 },
  { Year: 2025, BracketMin: 134292, BracketMax: 187204, Rate: 0.41 },
  { Year: 2025, BracketMin: 187204, BracketMax: 246113, Rate: 0.43 },
  { Year: 2025, BracketMin: 246113, BracketMax: null, Rate: 0.45 }
];

describe('Portugal - Progressive Tax Calculation', () => {
  describe('getTaxBrackets()', () => {
    test('returns brackets for valid year 2025', () => {
      const brackets = getTaxBrackets(2025, MOCK_TAX_BRACKETS_2025);
      expect(brackets).toHaveLength(12);
      expect(brackets[0].min).toBe(0);
      expect(brackets[11].max).toBe(null);
    });

    test('sorts brackets by min value', () => {
      const unsorted = [
        { Year: 2025, BracketMin: 10000, BracketMax: 20000, Rate: 0.20 },
        { Year: 2025, BracketMin: 0, BracketMax: 10000, Rate: 0.10 }
      ];
      const brackets = getTaxBrackets(2025, unsorted);
      expect(brackets[0].min).toBe(0);
      expect(brackets[1].min).toBe(10000);
    });

    test('throws error for invalid year', () => {
      expect(() => getTaxBrackets('invalid', MOCK_TAX_BRACKETS_2025))
        .toThrow('Invalid year parameter');
    });

    test('throws error if taxBracketsData is not an array', () => {
      expect(() => getTaxBrackets(2025, null))
        .toThrow('taxBracketsData must be an array');
    });

    test('throws error if no brackets found for year', () => {
      expect(() => getTaxBrackets(2099, MOCK_TAX_BRACKETS_2025))
        .toThrow('No tax brackets found for year 2099');
    });
  });

  describe('calculateProgressiveTax()', () => {
    describe('Edge cases', () => {
      test('returns 0 for zero income', () => {
        const tax = calculateProgressiveTax(0, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBe(0);
      });

      test('returns 0 for negative income', () => {
        const tax = calculateProgressiveTax(-1000, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBe(0);
      });

      test('returns 0 for null income', () => {
        const tax = calculateProgressiveTax(null, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBe(0);
      });
    });

    describe('Bracket boundary testing', () => {
      test('returns 0 for income below first bracket', () => {
        const tax = calculateProgressiveTax(5000, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBe(0);
      });

      test('returns 0 at exact first threshold (7,488)', () => {
        const tax = calculateProgressiveTax(7488, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBe(0);
      });

      test('calculates tax in second bracket', () => {
        const tax = calculateProgressiveTax(10000, 2025, MOCK_TAX_BRACKETS_2025);
        const expected = (10000 - 7488) * 0.145; // 2512 * 0.145 = 364.24
        expect(tax).toBeCloseTo(expected, 2);
      });

      test('calculates tax at second threshold (11,284)', () => {
        const tax = calculateProgressiveTax(11284, 2025, MOCK_TAX_BRACKETS_2025);
        const bracket1 = 7488 * 0; // 0
        const bracket2 = (11284 - 7488) * 0.145; // 3796 * 0.145 = 550.42
        expect(tax).toBeCloseTo(bracket1 + bracket2, 2);
      });

      test('calculates tax in top bracket', () => {
        const tax = calculateProgressiveTax(300000, 2025, MOCK_TAX_BRACKETS_2025);
        // Bracket calculations:
        // 0-7488: 0
        // 7488-11284: 3796 * 0.145 = 550.42
        // 11284-15668: 4384 * 0.165 = 723.36
        // 15668-20668: 5000 * 0.175 = 875.00
        // 20668-26356: 5688 * 0.20 = 1137.60
        // 26356-38632: 12276 * 0.225 = 2762.10
        // 38632-49712: 11080 * 0.27 = 2991.60
        // 49712-79706: 29994 * 0.32 = 9598.08
        // 79706-134292: 54586 * 0.37 = 20196.82
        // 134292-187204: 52912 * 0.41 = 21693.92
        // 187204-246113: 58909 * 0.43 = 25330.87
        // >246113: (300000-246113) * 0.45 = 53887 * 0.45 = 24249.15
        // Total: ~110108.92
        expect(tax).toBeGreaterThan(100000);
        expect(tax).toBeLessThan(150000);
      });
    });

    describe('Multi-bracket calculations', () => {
      test('calculates tax spanning multiple brackets (50,000)', () => {
        // 0-49712 tax sum from previous calc:
        // 0+550.42+723.36+875.00+1137.60+2762.10+2991.60 = 9040.08
        // 49712-50000 = 288 * 0.32 = 92.16
        // Total: 9132.24
        const tax = calculateProgressiveTax(50000, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBeCloseTo(9132.24, 2);
      });

      test('calculates tax for high income (100,000)', () => {
        const tax = calculateProgressiveTax(100000, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBeGreaterThan(20000);
        expect(tax).toBeLessThan(40000);
      });
    });

    describe('Year transitions', () => {
      test('uses 2025 brackets for 2025 income', () => {
        const tax2025 = calculateProgressiveTax(10000, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax2025).toBeGreaterThan(0);
      });
    });

    describe('Fractional amounts', () => {
      test('handles fractional income (1234.56)', () => {
        const tax = calculateProgressiveTax(1234.56, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBe(0); // Below first threshold
      });

      test('handles fractional income in taxable range (10500.75)', () => {
        const tax = calculateProgressiveTax(10500.75, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBeGreaterThan(0);
      });
    });

    describe('Null top bracket handling', () => {
      test('handles income beyond all finite brackets', () => {
        const tax = calculateProgressiveTax(1000000, 2025, MOCK_TAX_BRACKETS_2025);
        expect(tax).toBeGreaterThan(0);
        // Should use 45% rate on income above 246,113
      });
    });

    describe('Invalid bracket data handling', () => {
      test('ignores brackets with invalid range (min >= max)', () => {
        const invalidRangeData = [
            { Year: 2025, BracketMin: 2000, BracketMax: 1000, Rate: 0.2 } // min > max
        ];
        // Income 500. Bracket size -1000. Taxable min(500, -1000) = -1000.
        // if (-1000 > 0) false.
        expect(calculateProgressiveTax(500, 2025, invalidRangeData)).toBe(0);
      });
    });
  });
});
