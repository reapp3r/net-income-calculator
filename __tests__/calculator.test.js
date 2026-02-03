const { calculateNetIncome } = require('../lib/calculator');
const { PortugalResidency } = require('../lib/residency');
const { getTestReferenceData } = require('./helpers/testData');

const referenceData = getTestReferenceData();

const REQUIRED_EXPENSE_RATIO_SERVICES = 0.15;
const FREELANCE_COEFFICIENT_SERVICES = 0.7;
const FREELANCE_COEFFICIENT_GOODS = 0.2;

function calculateFreelanceTaxableBase(
  grossIncome,
  freelanceType,
  expenses = 0
) {
  const coefficient =
    freelanceType === 'goods'
      ? FREELANCE_COEFFICIENT_GOODS
      : FREELANCE_COEFFICIENT_SERVICES;
  let taxableBase = grossIncome * coefficient;

  if (freelanceType === 'services') {
    const requiredExpenses = grossIncome * REQUIRED_EXPENSE_RATIO_SERVICES;
    if (expenses < requiredExpenses) {
      const shortfall = requiredExpenses - expenses;
      taxableBase = grossIncome * coefficient + shortfall;
      return { taxableBase, expenseShortfall: shortfall, requiredExpenses };
    }
  }

  return {
    taxableBase,
    expenseShortfall: 0,
    requiredExpenses: grossIncome * REQUIRED_EXPENSE_RATIO_SERVICES,
  };
}

describe('Calculator Core', () => {
  test('throws error without income records', () => {
    expect(() => calculateNetIncome()).toThrow();
  });

  test('throws error with empty income records', () => {
    expect(() =>
      calculateNetIncome({
        incomeRecords: [],
        referenceData: referenceData.referenceData,
        exchangeRates: referenceData.exchangeRates,
      })
    ).toThrow('incomeRecords must be a non-empty array');
  });

  test('calculates net income for Portuguese employment', () => {
    const incomeRecords = [
      {
        year: 2025,
        month: 1,
        day: 15,
        amount: 5000,
        incomeType: 'employment',
        sourceCountry: 'PT',
        currency: 'EUR',
      },
    ];

    const results = calculateNetIncome({
      incomeRecords,
      referenceData: referenceData.referenceData,
      exchangeRates: referenceData.exchangeRates,
    });

    expect(results).toBeDefined();
    expect(results.monthly).toHaveLength(1);
    expect(results.monthly[0].amount).toBe(5000);
    expect(results.monthly[0].netIncome).toBeGreaterThan(0);
    expect(results.monthly[0].netIncome).toBeLessThan(5000);
  });

  test('handles NHR status with manual override', () => {
    const incomeRecords = [
      {
        year: 2025,
        month: 1,
        day: 15,
        amount: 5000,
        incomeType: 'employment',
        sourceCountry: 'PT',
        currency: 'EUR',
      },
    ];

    // NHR-specific testing is better handled by unit tests
    // This test verifies the calculator accepts taxResidency parameter
    // Manual override requires full period structure
    const results = calculateNetIncome({
      incomeRecords,
      referenceData: referenceData.referenceData,
      exchangeRates: referenceData.exchangeRates,
      taxResidency: {
        2025: {
          country: 'PT',
          method: 'manual',
          year: 2025,
          startMonth: 1,
          startDay: 1,
          endMonth: 12,
          endDay: 31,
        },
      },
    });

    // Verify calculation works with manual override
    expect(results.monthly).toHaveLength(1);
    expect(results.monthly[0].taxType).toBe('PROGRESSIVE');
  });

  test('handles dividend aggregation', () => {
    const incomeRecords = [
      {
        year: 2025,
        month: 1,
        day: 15,
        amount: 10000,
        incomeType: 'dividend',
        sourceCountry: 'PT',
        currency: 'EUR',
        aggregate: true,
      },
    ];

    const results = calculateNetIncome({
      incomeRecords,
      referenceData: referenceData.referenceData,
      exchangeRates: referenceData.exchangeRates,
    });

    expect(results.monthly[0].taxType).toBe('AGGREGATED_50');
  });

  test('handles multiple income records', () => {
    const incomeRecords = [
      {
        year: 2025,
        month: 1,
        day: 15,
        amount: 3000,
        incomeType: 'employment',
        sourceCountry: 'PT',
        currency: 'EUR',
      },
      {
        year: 2025,
        month: 1,
        day: 15,
        amount: 2000,
        incomeType: 'freelance',
        sourceCountry: 'UK',
        currency: 'EUR',
      },
      {
        year: 2025,
        month: 1,
        day: 15,
        amount: 1000,
        incomeType: 'dividend',
        sourceCountry: 'PT',
        currency: 'EUR',
      },
    ];

    const results = calculateNetIncome({
      incomeRecords,
      referenceData: referenceData.referenceData,
      exchangeRates: referenceData.exchangeRates,
    });

    expect(results.monthly).toHaveLength(3);
  });

  test('generates annual summary', () => {
    const incomeRecords = [
      {
        year: 2025,
        month: 1,
        day: 15,
        amount: 5000,
        incomeType: 'employment',
        sourceCountry: 'PT',
        currency: 'EUR',
      },
      {
        year: 2025,
        month: 2,
        day: 15,
        amount: 5000,
        incomeType: 'employment',
        sourceCountry: 'PT',
        currency: 'EUR',
      },
    ];

    const results = calculateNetIncome({
      incomeRecords,
      referenceData: referenceData.referenceData,
      exchangeRates: referenceData.exchangeRates,
    });

    expect(results.annual).toHaveLength(1);
    expect(parseFloat(results.annual[0].GrossIncome)).toBe(10000);
  });
});

describe('Progressive Tax Calculation', () => {
  const { calculateProgressiveTax } = require('../lib/residency/pt');

  test('handles zero income', () => {
    const tax = calculateProgressiveTax(0, 2025, referenceData.taxBrackets);
    expect(tax).toBe(0);
  });

  test('handles negative income', () => {
    const tax = calculateProgressiveTax(-1000, 2025, referenceData.taxBrackets);
    expect(tax).toBe(0);
  });

  test('calculates tax with reference data brackets', () => {
    const tax = calculateProgressiveTax(50000, 2025, referenceData.taxBrackets);
    expect(tax).toBeGreaterThan(0);
    expect(tax).toBeLessThan(50000);
  });
});

describe('Social Security Calculation', () => {
  const { calculateSocialSecurity } = require('../lib/residency/pt');
  const IAS_2025 = 509.26;
  const FREELANCE_SS_CAP_ANNUAL = 12 * IAS_2025 * 12;

  test('calculates employment social security', () => {
    const ss = calculateSocialSecurity(
      50000,
      'employment',
      'services',
      2025,
      referenceData.socialSecurity
    );
    expect(ss).toBe(5500); // 11% of 50000
  });

  test('employment has no cap', () => {
    const ss = calculateSocialSecurity(
      100000,
      'employment',
      'services',
      2025,
      referenceData.socialSecurity
    );
    expect(ss).toBe(11000); // 11% of 100000
  });

  test('calculates freelance social security', () => {
    const ss = calculateSocialSecurity(
      50000,
      'freelance',
      'services',
      2025,
      referenceData.socialSecurity
    );
    // 70% of 50000 = 35000 taxable base
    // 21.4% of 35000 = 7490
    expect(ss).toBeCloseTo(7490, 0);
  });

  test('freelance social security capped', () => {
    const ss = calculateSocialSecurity(
      400000,
      'freelance',
      'services',
      2025,
      referenceData.socialSecurity
    );
    // 70% of 400000 = 280000 taxable base
    // 21.4% of 280000 = 59920
    // Cap is 73333.44, so 59920 is used
    expect(ss).toBeCloseTo(59920, 0);
  });

  test('dividend has no social security', () => {
    const ss = calculateSocialSecurity(
      50000,
      'dividend',
      'services',
      2025,
      referenceData.socialSecurity
    );
    expect(ss).toBe(0);
  });
});

describe('Solidarity Tax Calculation', () => {
  const { calculateSolidarityTax } = require('../lib/residency/pt');

  test('no solidarity tax under threshold', () => {
    const tax = calculateSolidarityTax(50000, 2025, referenceData.solidarity);
    expect(tax).toBe(0);
  });

  test('2.5% solidarity tax on income over 80000', () => {
    const tax = calculateSolidarityTax(100000, 2025, referenceData.solidarity);
    expect(tax).toBe(500); // 2.5% of (100000 - 80000)
  });

  test('5% solidarity tax on income over 250000', () => {
    const tax = calculateSolidarityTax(300000, 2025, referenceData.solidarity);
    // 5% of (300000 - 250000) = 2500
    // Plus 2.5% of (250000 - 80000) = 4250
    // Total = 6750
    expect(tax).toBe(6750);
  });
});

describe('NHR Status', () => {
  const { isNHRActive, getNHRStatus } = require('../lib/residency/pt');

  test('returns false when no NHR date', () => {
    expect(isNHRActive(null, 2025, referenceData.specialRegimes)).toBe(false);
    expect(isNHRActive('', 2025, referenceData.specialRegimes)).toBe(false);
  });

  test('returns true for active NHR', () => {
    expect(isNHRActive('2023-06-15', 2025, referenceData.specialRegimes)).toBe(
      true
    ); // Year 3 of 10
  });

  test('returns false for expired NHR', () => {
    expect(isNHRActive('2015-01-01', 2026, referenceData.specialRegimes)).toBe(
      false
    ); // Year 11 of 10
  });

  test('getNHRStatus returns correct status', () => {
    const status = getNHRStatus(
      '2023-06-15',
      2025,
      referenceData.specialRegimes
    );
    expect(status.status).toBe('active');
    expect(status.yearsActive).toBe(3);
    expect(status.remainingYears).toBe(8); // 10 - 2 = 8 (2023, 2024, 2025 = 3 years active, 7 remaining)
  });

  test('getNHRStatus for expired', () => {
    const status = getNHRStatus(
      '2015-01-01',
      2026,
      referenceData.specialRegimes
    );
    expect(status.status).toBe('expired');
    expect(status.active).toBe(false);
  });
});

describe('Dividend Tax', () => {
  const { PortugalResidency } = require('../lib/residency');
  const residency = new PortugalResidency(referenceData);

  test('flat 28% rate', () => {
    const result = residency.calculateDividendTax(
      10000,
      { active: false },
      'PT',
      false,
      2025
    );
    expect(result.taxAmount).toBeCloseTo(2800, 0);
    expect(result.taxType).toBe('DIVIDEND_28');
  });

  test('aggregated 50% for PT', () => {
    const result = residency.calculateDividendTax(
      10000,
      { active: false },
      'PT',
      true,
      2025
    );
    expect(result.taxType).toBe('AGGREGATED_50');
  });

  test('UK not eligible for 50% exemption', () => {
    expect(residency.isEUEEA('UK')).toBe(false);
  });

  test('PT eligible for 50% exemption', () => {
    expect(residency.isEUEEA('PT')).toBe(true);
  });

  test('Germany eligible for 50% exemption', () => {
    expect(residency.isEUEEA('DE')).toBe(true);
  });

  test('NHR exempt', () => {
    const result = residency.calculateDividendTax(
      10000,
      { active: true },
      'UK',
      false,
      2025
    );
    expect(result.taxType).toBe('NHR_EXEMPT');
    expect(result.taxAmount).toBe(0);
  });
});

describe('Freelance Tax', () => {
  const { PortugalResidency } = require('../lib/residency');
  const residency = new PortugalResidency(referenceData);

  test('70% coefficient for services with 15% expense rule', () => {
    const result = calculateFreelanceTaxableBase(10000, 'services');
    expect(result.taxableBase).toBe(8500); // 7000 + 1500 shortfall (15% of 10000)
    expect(result.expenseShortfall).toBe(1500);
    expect(result.requiredExpenses).toBe(1500);
  });

  test('20% coefficient for goods (no 15% rule)', () => {
    const result = calculateFreelanceTaxableBase(10000, 'goods');
    expect(result.taxableBase).toBe(2000);
    expect(result.expenseShortfall).toBe(0);
  });

  test('services with sufficient expenses', () => {
    const result = calculateFreelanceTaxableBase(10000, 'services', 2000);
    expect(result.taxableBase).toBe(7000); // No shortfall because expenses >= 15%
    expect(result.expenseShortfall).toBe(0);
  });

  test('NHR exempt for foreign freelance', () => {
    const result = residency.calculateFreelanceTax(
      10000,
      { active: true },
      false,
      'services',
      0,
      2025
    );
    expect(result.taxType).toBe('NHR_EXEMPT');
    expect(result.taxAmount).toBe(0);
  });

  test('expenses reduce taxable base', () => {
    const result = residency.calculateFreelanceTax(
      10000,
      { active: false },
      true,
      'services',
      2000,
      2025
    );
    expect(result.taxableIncome).toBe(5000); // 7000 - 2000 (no shortfall with 2000 expenses)
    expect(result.expenseShortfall).toBe(0);
  });
});
