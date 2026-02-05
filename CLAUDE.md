# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-country net income calculator supporting **Portugal (PT)** and **United Kingdom (GB)** tax residency, with Germany (DE) stubbed for future implementation.

**Current Features**:

- Multi-country tax residency (PT, GB implemented)
- Automatic residency determination with OECD tie-breaker rules
- Split-year treatment for permanent relocations
- Manual residency override capability
- Reference data driven architecture (CSV-based tax parameters)
- Temporal matching for historical tax rates
- ISO 3166-1 alpha-2 country codes, ISO 4217 currencies, ISO 8601 dates

**Income Types**: Employment, Freelance, Dividend, Interest, Capital Gains, Pension, Rental

**Special Regimes**: NHR (Portugal), Personal Allowance (UK)

## Comprehensive Documentation

Detailed documentation is available in the `docs/` directory:

| File                     | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `docs/data_structure.md` | Directory structure and file organization             |
| `docs/file_formats.md`   | Complete CSV file specifications                      |
| `docs/standards.md`      | ISO standards (country codes, currencies, dates)      |
| `docs/common.md`         | Cross-country tax concepts (FTC, dividends, treaties) |
| `docs/pt.md`             | Portugal-specific tax rules                           |
| `docs/_index.md`         | Documentation index                                   |

**Always reference `docs/` for detailed specifications.**

## Documented Assumptions

The following assumptions are **by design** - the calculator intentionally does NOT handle these scenarios:

| Assumption                       | Description                                                                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No professional association fees | Uses standard specific deduction (€4,462.15). Does not apply increased rate (€4,702.50) for professionals paying mandatory fees.                                |
| NHR activity is high-value-added | Assumes all Portuguese employment income for NHR residents qualifies for 20% flat rate. Standard administrative roles do NOT qualify per Portaria No. 230/2019. |
| Continental Portugal only        | Uses mainland Portugal tax brackets. Does not implement reduced rates for Madeira or Azores.                                                                    |
| No IRS Jovem eligibility         | Assumes taxpayer no longer qualifies for the 10-year regressive exemption regime.                                                                               |
| No NHR 2.0 (IFICU)               | Does not implement the 2024 Tax Incentive for Scientific Research and Innovation.                                                                               |
| No first-year SS exemption       | Does not apply 12-month social security exemption for first-time self-registrers.                                                                               |
| No Minimum Subsistence (2026)    | Does not apply the €12,880 safety net that ensures net income doesn't fall below minimum wage.                                                                  |

> When editing code or answering questions, always respect these assumptions. Do NOT add features for these scenarios unless explicitly requested.

## Running the Calculator

**Node.js CLI:**

```bash
net-income-calculator <data-directory>
```

Example:

```bash
net-income-calculator data/portugal
net-income-calculator ./my-data
```

Output files generated in the same directory as input:

- `MonthlyResults.csv` - Monthly breakdown
- `AnnualSummary.csv` - Annual totals
- `AnnualByType.csv` - Breakdown by income type
- `nhrSummary.csv` - NHR savings summary (if NHR data present)

**Node.js Programmatic:**

```javascript
const { calculateNetIncome } = require('./lib');
const results = calculateNetIncome(incomeRecords, referenceData);
```

## Data Directory Structure

```
data/
├── ExchangeRates.csv        # Monthly currency rates (global)
├── Location.csv             # Daily location tracking (optional)
├── WorkActivity.csv         # Work hours and locations (optional)
├── Accommodation.csv        # Dwelling availability (optional)
├── TaxResidency.csv         # Manual residency override (optional)
│
├── PT/                       # Portugal - ISO 3166-1: PT
│   ├── Income.csv           # Income EARNED in Portugal (REQUIRED)
│   ├── TaxBrackets.csv
│   ├── Deductions.csv
│   ├── SocialSecurity.csv
│   ├── SolidarityTax.csv
│   ├── SpecialRegimes.csv
│   ├── ForeignTaxCredit.csv
│   ├── MonthlyPersonalDeductions.csv
│   └── SimulationParameters.csv
│
└── GB/                       # United Kingdom - ISO 3166-1: GB
    └── (same structure as PT/)
```

**Strict Rules**:

1. Country folders must use ISO 3166-1 alpha-2 codes (PT, GB, DE)
2. No file prefixes (use `TaxBrackets.csv`, NOT `PT_TaxBrackets.csv`)
3. Income.csv must be inside a country directory (tracks income EARNED IN that country)
4. Currency codes must be ISO 4217 (EUR, GBP, USD)

## Input File Formats

### Income.csv (Per Country)

```csv
Year,Month,Day,Amount,IncomeType,Currency,Employer,Description
2025,1,15,3000.00,employment,EUR,Company A,Monthly salary
2025,5,20,1800.00,freelance,EUR,Client B,Consulting project
```

**Key Columns**:

- `IncomeType`: employment, freelance, dividend, interest, capital_gains, pension, rental, other
- `Currency`: ISO 4217 code (EUR, GBP, USD)
- Location: `data/PT/Income.csv`, `data/GB/Income.csv`

### Location.csv (Root Level, Optional)

Tracks daily location changes for residency determination:

```csv
Date,FromCountry,ToCountry,DepartureTime,ArrivalTime,LocationType
2025-01-01,GB,PT,09:00,12:30,Travel
2025-01-01,PT,PT,12:30,23:59,Residence
2025-06-30,PT,GB,16:00,19:30,Travel
```

**Purpose**: Enables automatic residency determination via 183-day test, permanent home test, and OECD tie-breakers.

### TaxResidency.csv (Root Level, Optional)

Manual residency overrides for complex scenarios:

```csv
Year,Country,ResidencyStatus,ResidencyStartDate,ResidencyEndDate,CalculationMethod,Notes
2025,PT,Resident,2025-01-01,2025-06-30,SplitYear,Moved to UK July 1
2025,GB,Resident,2025-07-01,2025-12-31,SplitYear,Moved from PT July 1
```

**ResidencyStatus**: Resident, NonResident, SplitYear

### ExchangeRates.csv (Root Level)

Monthly currency conversion rates:

```csv
Year,Month,FromCurrency,ToCurrency,Rate
2025,1,EUR,GBP,0.8500
2025,1,GBP,EUR,1.1765
```

## Architecture

```
lib/
├── calculator.js           # Core calculation engine
├── loader.js               # Reference data loader
├── temporal.js             # Temporal matching (historical tax rates)
├── residency/
│   ├── base.js             # TaxResidency abstract class
│   ├── index.js            # Residency registry
│   ├── pt/                 # Portugal implementation
│   │   ├── residency.js    # Portugal residency class
│   │   └── ...
│   └── gb/                 # United Kingdom implementation
│       └── residency.js
└── utils/
    ├── currency.js         # Currency conversion
    ├── validation.js       # ISO standard validation
    └── index.js
```

### Module Exports

```javascript
module.exports = {
  // Core calculation
  calculateNetIncome, // Core in-memory calculation
  parseIncomeRecord, // Parse income CSV row

  // Data loading
  loadReferenceData, // Load CSV reference data
  validateIncomeDataCompleteness,
  parseCSV,

  // Temporal matching
  getTemporalMatch, // Find tax rate for specific year
  getExactMatch, // Find exact year match

  // Residency
  getResidency, // Get residency implementation
  hasResidency, // Check if country supported
  listAvailableCountries, // Returns ['PT', 'GB', 'DE']
  PortugalResidency, // Portugal residency class
  GBResidency, // UK residency class
};
```

## Residency Determination

### Automatic Detection

The calculator automatically determines tax residency using:

1. **183-Day Test**: Physical presence counting (overnight stays)
2. **Permanent Home Test**: Dwelling availability and intent
3. **OECD Tie-Breakers**: Center of vital interests, habitual abode, citizenship
4. **Split-Year Detection**: Automatic detection of permanent relocations

### Manual Override

Use `TaxResidency.csv` to:

- Specify split-year treatment manually
- Apply treaty-based elections
- Handle special diplomatic or student statuses

### Fiscal Years

Each country has an intrinsic fiscal year (cannot be changed):

| Country  | Fiscal Year                    |
| -------- | ------------------------------ |
| Portugal | Calendar year (Jan 1 - Dec 31) |
| UK       | Tax year (Apr 6 - Apr 5)       |
| Germany  | Calendar year (Jan 1 - Dec 31) |

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

**Social Security:**
| Income Type | Rate | Basis | Cap |
|-------------|------|-------|-----|
| Employment | 11% | 100% of gross | None |
| Freelance | 21.4% | 70% of gross | 12× IAS/month |
| Dividend | 0% | N/A | N/A |

**IAS (2025):** €522.50

**NHR Benefits (Pre-2024):**

- Portuguese employment: Flat 20% (not progressive)
- Foreign income: Exempt from Portuguese tax
- Duration: 10 years from acquisition date

### United Kingdom - Tax Residency

**Key Features:**

- Statutory Residence Test (SRT) for residency determination
- Personal Allowance (£12,570 standard)
- National Insurance (Class 1, 2, 4)
- Dividend Allowance (£500)
- Trading Allowance (£1,000 for freelancers)

## Key Calculation Flows

### Standard Resident - Employment

```
1. Gross Employment Income
2. Subtract Social Security
3. Subtract Specific Deduction (Portugal: €4,462.15)
4. Apply Progressive Tax Brackets
5. Add Solidarity Tax (if applicable)
6. Subtract Personal Deductions
7. Apply Foreign Tax Credit
8. Derive Net Income
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

1. **ISO Standards Only**: ISO 3166-1 alpha-2 (PT, GB), ISO 4217 (EUR, GBP), ISO 8601 (YYYY-MM-DD)
2. **Reference Data Driven**: All tax parameters loaded from CSV files
3. **No Hardcoded Rates**: Use temporal matching for historical tax rates
4. **Sensible Defaults**: employment, PT source, EUR currency, standard resident
5. **Clear Assumptions**: Document all assumptions in code comments

### Code Style

- No comments unless explicitly requested
- Pure functions where possible
- Testable, composable modules
- Follow existing patterns

## Constants

See the comprehensive Constants section below.

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
  calculateNetIncome, // Core in-memory calculation
  calculateEmploymentTax, // Employment tax with specific deduction
  calculateFreelanceTax, // Freelance with 70% coefficient
  calculateDividendTax, // Dividend with aggregation option
  calculateSocialSecurity, // Social security with caps
  calculateSolidarityTax, // Solidarity tax (2.5%/5%)
  calculateProgressiveTax, // Progressive tax computation
  isNHRActive, // Check NHR status
  calculateForeignTaxCredit, // FTC calculation
  calculateSpecificDeduction, // €4,462.15 employment deduction
};
```

## Tax Rules

### Portugal - Tax Residency

**Tax Brackets (2025):**
| Income | Rate | Parcela a Abater |
|--------|------|-------------------|
| Up to €8,059 | 12.5% | – |
| €8,059 - €12,160 | 16% | €282.07 |
| €12,160 - €17,233 | 21.5% | €950.91 |
| €17,233 - €22,306 | 24.4% | €1,450.67 |
| €22,306 - €28,400 | 31.4% | €3,011.98 |
| €28,400 - €41,629 | 34.9% | €4,006.10 |
| €41,629 - €44,987 | 43.1% | €7,419.54 |
| €44,987 - €83,696 | 44.6% | €8,094.51 |
| Over €83,696 | 48% | €10,939.90 |

**Solidarity Tax (High Earners):**
| Income Threshold | Additional Rate |
|------------------|-----------------|
| Over €80,000 | +2.5% on excess |
| Over €250,000 | +5% on excess |

Applied to **taxable income** (after specific deduction and other applicable deductions).

**Specific Deduction (Employment):**

- €4,462.15 deducted from employment income before progressive tax

**Social Security:**
| Income Type | Rate | Basis | Cap |
|-------------|------|-------|-----|
| Employment | 11% | 100% of gross | None |
| Freelance | 21.4% | 70% of gross | 12× IAS/month |
| Dividend | 0% | N/A | N/A |

**IAS (2025):** €522.50
**Freelance SS Cap:** 12 × €522.50 = €6,270.00/month

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
7. Apply Foreign Tax Credit (see FTC calculation below)
8. Derive Net Income
```

**Foreign Tax Credit (for foreign-source employment):**

- Calculate Portuguese tax liability on the foreign income (using progressive brackets)
- Credit = min(foreign tax paid, Portuguese tax on that foreign income)
- Cannot create refund - credit limited to Portuguese tax liability

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
2. For Portuguese employment:
   - Subtract Social Security (11% of gross)
   - Apply 20% flat tax on (gross - social security)
   - Specific deduction does NOT apply
3. For foreign income: Exempt from Portuguese tax (may have foreign withholding)
4. Derive net income
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
const IAS_2024 = 509.26;
const IAS_2025 = 522.5;
const IAS_2026 = 537.13;
const SPECIFIC_DEDUCTION_2025 = 4462.15; // 8.54 × IAS 2025
const SPECIFIC_DEDUCTION_2026 = 4587.09; // 8.54 × IAS 2026
const FREELANCE_SS_CAP_MONTHLY_2024 = 12 * IAS_2024; // €6,111.12
const FREELANCE_SS_CAP_ANNUAL_2024 = FREELANCE_SS_CAP_MONTHLY_2024 * 12;
const FREELANCE_SS_CAP_MONTHLY_2025 = 12 * IAS_2025; // €6,270.00
const FREELANCE_SS_CAP_ANNUAL_2025 = FREELANCE_SS_CAP_MONTHLY_2025 * 12;
const FREELANCE_SS_CAP_MONTHLY_2026 = 12 * IAS_2026; // €6,445.56
const FREELANCE_SS_CAP_ANNUAL_2026 = FREELANCE_SS_CAP_MONTHLY_2026 * 12;
const FREELANCE_COEFFICIENT_SERVICES = 0.7;
const FREELANCE_COEFFICIENT_GOODS = 0.2;
const SOLIDARITY_THRESHOLD_1_2025 = 80000;
const SOLIDARITY_THRESHOLD_1_2026 = 86634;
const SOLIDARITY_THRESHOLD_2 = 250000;
const SOLIDARITY_RATE_1 = 0.025;
const SOLIDARITY_RATE_2 = 0.05;
const MINIMUM_SUBSISTENCE_2026 = 12880;
const HOUSING_DEDUCTION_MAX_2025 = 502.11;
const HOUSING_DEDUCTION_MAX_2026 = 750.0;
const IVA_BOOKS_CULTURE_RATE = 0.15;
```

## References

- Portuguese Tax Authority: www.portaldasfinancas.gov.pt
- NHR Legislation: Decree-Law no. 249/2009
- OECD Model Tax Convention (2017)
- IRS Code (Código do IRS)
- Código dos Regimes Contributivos (Social Security)
- HMRC (UK): www.gov.uk/hmrc
- Documentation: `docs/` directory
