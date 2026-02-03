# Data Directory Structure

## Overview

This directory contains all data for net income calculation across multiple countries with automatic tax residency determination.

## Directory Structure

```
data/
├── Location.csv              # Daily location tracking (global)
├── WorkActivity.csv          # Work hours and location (global)
├── Accommodation.csv         # Dwelling availability (global)
├── TaxResidency.csv         # Manual residency overrides (optional, global)
├── ExchangeRates.csv        # Monthly currency rates (global)
│
├── PT/                       # Portugal - ISO 3166-1: PT
│   ├── Income.csv           # Income EARNED in Portugal
│   ├── TaxBrackets.csv
│   ├── Deductions.csv
│   ├── SocialSecurity.csv
│   ├── SolidarityTax.csv
│   ├── SpecialRegimes.csv
│   ├── ForeignTaxCredit.csv
│   ├── MonthlyPersonalDeductions.csv
│   ├── MonthlyIncome.csv
│   └── SimulationParameters.csv
│
├── GB/                       # United Kingdom - ISO 3166-1: GB
│   ├── Income.csv           # Income EARNED in United Kingdom
│   ├── TaxBrackets.csv
│   ├── Deductions.csv
│   ├── SocialSecurity.csv
│   ├── SolidarityTax.csv
│   ├── SpecialRegimes.csv
│   ├── ForeignTaxCredit.csv
│   ├── MonthlyPersonalDeductions.csv
│   ├── MonthlyIncome.csv
│   └── SimulationParameters.csv
│
└── DE/                       # Germany - ISO 3166-1: DE (if needed)
    └── (same structure as PT/GB)
```

## Principles

1. **Income by Source**: Income.csv files are located in country directories (data/PT/, data/GB/) and track income EARNED IN that country.

2. **ISO Standards Only**:
   - Country codes: ISO 3166-1 alpha-2 (PT, GB, DE)
   - Currency codes: ISO 4217 (EUR, GBP, USD)
   - No country names (Portugal, UK) allowed in directory names or codes

3. **No File Prefixes**: Files within country directories use standard names (TaxBrackets.csv, not PT_TaxBrackets.csv).

4. **Global Tracking Files**: Root-level CSV files track location, work activity, and accommodation for residency determination.

5. **Exchange Rates**: Centralized at root level with monthly precision, supporting multiple currency pairs.

6. **Residency Configuration**: Each country's SimulationParameters.csv contains its own residency test configuration.

## File Standards

- **No hardcoded currency or exchange rates in code**
- **No country names or variants** - ISO codes only
- **ISO 8601 dates** (YYYY-MM-DD)
- **UTC times** for consistency
- **UTF-8 encoding** for CSV files
- **Header row** required with exact column names
- **No empty rows** except for specific file structure reasons

## Scenarios

### Simple Case: Single Country Resident

- Person lives and works entirely in Portugal
- Income only in data/PT/Income.csv
- Tax residency: Automatic 183-day test → PT resident
- No location tracking needed (or all entries in Location.csv show PT)

### Multi-Country Income

- Person lives in Portugal, works for UK employer (remote freelance)
- Income in both data/PT/Income.csv and data/GB/Income.csv
- Tax residency: PT resident
- Foreign tax credits applied to UK income

### Split-Year Case

- Person moves from Portugal to UK on July 1
- Income in data/PT/Income.csv (Jan-Jun) and data/GB/Income.csv (Jul-Dec)
- Location.csv shows permanent move from PT to GB
- Tax residency: PT resident Jan-Jun, GB resident Jul-Dec
- Income aggregated per residency period

### Dual Residency

- Person spends significant time in both Portugal and UK
- Location.csv shows time in both countries
- OECD tie-breaker applied to determine single residency
- May require manual override in TaxResidency.csv
