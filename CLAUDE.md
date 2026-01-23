# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Net income calculator for **Portuguese tax residents** earning income from Portugal, UK, and Germany.

**Current Scope**: Portugal tax residency only (MVP)  
**Future**: Multi-country support (see `docs/FUTURE_ARCHITECTURE.md`)

### Current Features (MVP)

- **3 income types**: Employment, Freelance, Dividend
- **NHR regime**: Pre-2024 Non-Habitual Resident benefits
- **Full tax deductions**: Specific deduction (€4,462.15), solidarity tax, personal deductions
- **Dividend aggregation**: 50% exemption for PT/EU/EEA dividends
- **Multi-year**: NHR expiration tracking
- **Multiple sources**: Multiple employers per month, multiple source countries

### Future Features (Prepared, Not Yet Implemented)

The calculator architecture is ready for multi-country scenarios. See `docs/FUTURE_ARCHITECTURE.md` for:

- **Multi-country support**: Tax residency changes mid-year (e.g., PT → UK in July)
- **Split-year treatment**: Partial year taxation in each country
- **Global income file**: Single `Income.csv` for all countries
- **Residency determination**: Manual override + auto-calculation (183-day test, tie-breakers)
- **Multi-job aggregation**: Multiple employers per month across countries with foreign tax credits

Code extension points marked with `// FUTURE:` comments. No breaking changes to current MVP.

## Documented Assumptions

The following assumptions are **by design** - the calculator intentionally does NOT handle these scenarios:

| Assumption | Description |
|------------|-------------|
| No professional association fees | Uses standard specific deduction (€4,462.15). Does not apply increased rate (€4,702.50) for professionals paying mandatory fees. |
| NHR activity is high-value-added | Assumes all Portuguese employment income for NHR residents qualifies for 20% flat rate. Standard administrative roles do NOT qualify per Portaria No. 230/2019. |
| Continental Portugal only | Uses mainland Portugal tax brackets. Does not implement reduced rates for Madeira or Azores. |
| No IRS Jovem eligibility | Assumes taxpayer no longer qualifies for the 10-year regressive exemption regime. |
| No NHR 2.0 (IFICU) | Does not implement the 2024 Tax Incentive for Scientific Research and Innovation. |
| No first-year SS exemption | Does not apply 12-month social security exemption for first-time self-registrers. |
| No Minimum Subsistence (2026) | Does not apply the €12,880 safety net that ensures net income doesn't fall below minimum wage. |

> When editing code or answering questions, always respect these assumptions. Do NOT add features for these scenarios unless explicitly requested.

## Running the Calculator

**Node.js CLI:**
```bash
net-income-calculator <data-directory>
```

Example:
```bash
net-income-calculator data/portugal
net-income-calculator ./my-portugal-data
```

Output files generated in the same directory as input:
- `MonthlyResults.csv` - Monthly breakdown
- `AnnualSummary.csv` - Annual totals
- `AnnualByType.csv` - Breakdown by income type
- `nhrSummary.csv` - NHR savings summary (if NHR data present)

**Node.js Programmatic:**
```javascript
const { calculateNetIncome } = require('./lib/calculator');
const results = calculateNetIncome(incomeData);
```

## Input Format

CSV file with columns:

| Column | Required | Default | Description |
|--------|----------|---------|-------------|
| `Year` | Yes | - | Tax year (2025, 2026, etc.) |
| `Month` | Yes | - | Month 1-12 |
| `GrossIncome` | Yes | - | Gross amount |
| `IncomeType` | No | employment | employment/freelance/dividend |
| `SourceCountry` | No | PT | PT/UK/DE/etc. |
| `SourceCurrency` | No | EUR | Currency code |
| `ExchangeRate` | No | 1.0 | EUR conversion rate |
| `NHRStatusAcquiredDate` | No | null | YYYY-MM-DD (if NHR active) |
| `DividendAggregation` | No | false | Use 50% aggregation (PT/EU/EEA) |
| `FreelanceExpenses` | No | 0 | Documented expenses |
| `PersonalDeductions` | No | 0 | Total personal deductions |

**NHR Detection:**
- If `NHRStatusAcquiredDate` is provided → NHR is active
- If `NHRStatusAcquiredDate` is empty → Standard resident rules apply

**Dividend Aggregation:**
- `DividendAggregation: true` applies 50% exemption (PT/EU/EEA dividends only)
- UK dividends (post-Brexit) do not qualify for 50% exemption

## Output Format

### MonthlyResults.csv
```
Year,Month,GrossIncome,IncomeType,SourceCountry,SpecialRegimeStatus,TaxType,ForeignWithholding,TaxAmount,SocialSecurity,PersonalDeductions,NetIncome
```

### AnnualSummary.csv
```
Year,SpecialRegimeStatus,GrossIncome,ForeignWithholding,TaxAmount,SocialSecurity,PersonalDeductions,SolidarityTax,NetIncome
```

### AnnualByType.csv
```
Year,IncomeType,SpecialRegimeStatus,GrossIncome,TaxableAmount,TaxAmount,SocialSecurity,NetIncome
```

### nhrSummary.csv (if NHR data present)
```
Year,SpecialRegimeStatus,RegimeName,RegimeYearsRemaining,GrossIncome,ExemptIncome,TaxableIncome,RegimeTax,StandardTax,Savings
```

## Testing

**Run all tests:**
```bash
npm test
```

**Run with coverage:**
```bash
npm run test:coverage
```

**Run in watch mode:**
```bash
npm run test:watch
```

## Architecture

```
lib/
├── calculator.js           # Core calculation engine
├── residency/
│   ├── base.js             # TaxResidency abstract class
│   ├── pt.js               # Portugal (tax residency - active)
│   └── index.js            # Residency registry
├── utils/
│   ├── currency.js         # Currency conversion
│   └── index.js            # Utility exports
```

### Core Function: calculateNetIncome()

```javascript
function calculateNetIncome(incomeRecords, options) {
  // incomeRecords: Array of income objects
  // Returns: { monthly: [...], annual: [...], byType: [...], specialRegime: {...} }
}
```

### Module Exports

```javascript
module.exports = {
  calculateNetIncome,           // Core in-memory calculation
  calculateEmploymentTax,       // Employment tax with specific deduction
  calculateFreelanceTax,        // Freelance with 70% coefficient
  calculateDividendTax,         // Dividend with aggregation option
  calculateSocialSecurity,      // Social security with caps
  calculateSolidarityTax,       // Solidarity tax (2.5%/5%)
  calculateProgressiveTax,      // Progressive tax computation
  isNHRActive,                  // Check NHR status
  calculateForeignTaxCredit,    // FTC calculation
  calculateSpecificDeduction    // €4,462.15 employment deduction
};
```

## Tax Rules

### Portugal - Tax Residency

**Tax Brackets (2025):**
| Income | Rate |
|--------|------|
| €0 - €7,488 | 0% |
| €7,488 - €11,284 | 14.5% |
| €11,284 - €15,668 | 16.5% |
| €15,668 - €20,668 | 17.5% |
| €20,668 - €26,356 | 20% |
| €26,356 - €38,632 | 22.5% |
| €38,632 - €49,712 | 27% |
| €49,712 - €79,706 | 32% |
| €79,706 - €134,292 | 37% |
| €134,292 - €187,204 | 41% |
| €187,204 - €246,113 | 43% |
| Over €246,113 | 45% |

**Solidarity Tax (High Earners):**
| Income Threshold | Additional Rate |
|------------------|-----------------|
| Over €80,000 | +2.5% on excess |
| Over €250,000 | +5% on excess |

**Specific Deduction (Employment):**
- €4,462.15 deducted from employment income before progressive tax

**Social Security:**
| Income Type | Rate | Basis | Cap |
|-------------|------|-------|-----|
| Employment | 11% | 100% of gross | None |
| Freelance | 21.4% | 70% of gross | 12× IAS/month |
| Dividend | 0% | N/A | N/A |

**IAS (2025):** €509.26
**Freelance SS Cap:** 12 × €509.26 = €6,111.12/month

**NHR Benefits (Pre-2024):**
- Portuguese employment: Flat 20% (not progressive)
- Foreign income: Exempt from Portuguese tax
- Duration: 10 years from NHRStatusAcquiredDate

### UK - Source Country

**Withholding Tax:**
| Income Type | WHT Rate |
|-------------|----------|
| Employment | PAYE (0-45%) |
| Freelance | 0% |
| Dividend | 10% standard |

**Dividend Aggregation:** UK is NOT in EU/EEA, so NO 50% exemption

### Germany - Source Country

**Withholding Tax:**
| Income Type | WHT Rate |
|-------------|----------|
| Employment | Lohnsteuer (0-45%) |
| Freelance | 0% |
| Dividend | 25% Abgeltungsteuer + 5.5% Soli |

**Dividend Aggregation:** Germany is in EU/EEA, so 50% exemption applies

## Key Calculation Flows

### Standard Resident - Employment

```
1. Gross Employment Income
2. Subtract Social Security (11% of gross)
3. Subtract Specific Deduction (€4,462.15)
4. Apply Progressive Tax Brackets
5. Add Solidarity Tax (if >€80,000)
6. Subtract Personal Deductions
7. Apply Foreign Tax Credit
8. Derive Net Income
```

### Standard Resident - Freelance

```
1. Gross Freelance Income
2. Apply 70% coefficient (services) or 20% (goods)
3. Subtract Documented Expenses
4. Calculate Social Security (21.4% × taxable, capped at 12× IAS)
5. Apply Progressive Tax Brackets
6. Add Solidarity Tax (if >€80,000)
7. Subtract Personal Deductions
8. Apply Foreign Tax Credit
9. Derive Net Income
```

### Standard Resident - Dividend

```
Option A (Flat Rate):
1. Gross Dividend Income
2. Apply 28% Flat Rate
3. Apply Foreign Tax Credit
4. Derive Net Income

Option B (Aggregation):
1. Check if source is PT/EU/EEA
2. If yes and aggregated: Taxable = 50% of gross
3. If no or not aggregated: Taxable = 100% of gross
4. Apply Progressive Tax Brackets
5. Subtract Personal Deductions
6. Apply Foreign Tax Credit
7. Derive Net Income
```

### NHR Resident

```
For each year:
1. Check if NHR is active (year < acquiredYear + 10)
2. For Portuguese employment: Apply flat 20%
3. For foreign income: Exempt from Portuguese tax
4. Calculate social security (on Portuguese income only)
5. Derive net income
```

## Implementation Principles

### Design Rules

1. **No redundant input**: If `NHRStatusAcquiredDate` is provided, NHR is enabled
2. **Minimal asks**: Derive data by calculation where possible
3. **Sensible defaults**: employment, PT source, EUR currency, standard resident
4. **Clear assumptions**: Document all assumptions in code comments

### Code Style

- No comments unless explicitly requested
- Pure functions where possible
- Testable, composable modules
- Follow existing patterns

## Adding Features

### Add New Tax Year

1. Update tax brackets in `lib/residency/pt.js` getTaxBrackets()
2. Update social security caps and IAS value
3. Add test cases for new year

## Constants

```javascript
const IAS_2025 = 509.26;
const IAS_2026 = 537.13;
const SPECIFIC_DEDUCTION_2025 = 4462.15;
const SPECIFIC_DEDUCTION_2026 = 4641.50;
const FREELANCE_SS_CAP_MONTHLY_2025 = 12 * IAS_2025;   // €6,111.12
const FREELANCE_SS_CAP_ANNUAL_2025 = FREELANCE_SS_CAP_MONTHLY_2025 * 12;
const FREELANCE_SS_CAP_MONTHLY_2026 = 12 * IAS_2026;   // €6,445.56
const FREELANCE_SS_CAP_ANNUAL_2026 = FREELANCE_SS_CAP_MONTHLY_2026 * 12;
const FREELANCE_COEFFICIENT_SERVICES = 0.70;
const FREELANCE_COEFFICIENT_GOODS = 0.20;
const SOLIDARITY_THRESHOLD_1_2025 = 80000;
const SOLIDARITY_THRESHOLD_1_2026 = 86634;
const SOLIDARITY_THRESHOLD_2 = 250000;
const SOLIDARITY_RATE_1 = 0.025;
const SOLIDARITY_RATE_2 = 0.05;
const MINIMUM_SUBSISTENCE_2026 = 12880;
const HOUSING_DEDUCTION_MAX_2025 = 502.11;
const HOUSING_DEDUCTION_MAX_2026 = 900;
const IVA_BOOKS_CULTURE_RATE = 0.15;
```

## References

- Portuguese Tax Authority: www.portaldasfinancas.gov.pt
- NHR Legislation: Decree-Law no. 249/2009
- OECD Model Tax Convention (2017)
- IRS Code (Código do IRS)
- Código dos Regimes Contributivos (Social Security)
