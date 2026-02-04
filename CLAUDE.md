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

**IAS (2025):** €509.26

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

```javascript
const IAS_2025 = 509.26;
const IAS_2026 = 537.13;
const SPECIFIC_DEDUCTION_2025 = 4462.15;
const SPECIFIC_DEDUCTION_2026 = 4641.5;
const FREELANCE_SS_CAP_MONTHLY_2025 = 12 * IAS_2025; // €6,111.12
const FREELANCE_COEFFICIENT_SERVICES = 0.7;
const FREELANCE_COEFFICIENT_GOODS = 0.2;
const SOLIDARITY_THRESHOLD_1_2025 = 80000;
const SOLIDARITY_RATE_1 = 0.025;
const SOLIDARITY_RATE_2 = 0.05;
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

## References

- Portuguese Tax Authority: www.portaldasfinancas.gov.pt
- NHR Legislation: Decree-Law no. 249/2009
- OECD Model Tax Convention (2017)
- IRS Code (Código do IRS)
- Código dos Regimes Contributivos (Social Security)
- HMRC (UK): www.gov.uk/hmrc
- Documentation: `docs/` directory
