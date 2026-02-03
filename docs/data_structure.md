# Data Directory Structure

## Directory Structure

This is the required and only supported data structure:

```
data/
├── ExchangeRates.csv        # Monthly currency rates (global)
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
├── GB/                       # United Kingdom - ISO 3166-1: GB
│   ├── Income.csv           # Income EARNED in United Kingdom (REQUIRED)
│   └── (same structure as PT/)
│
└── DE/                       # Germany - ISO 3166-1: DE (if needed)
    └── (same structure as PT/)
```

## Strict Rules

1. **Income.csv Location**: Income.csv must be located inside a country folder (e.g., `data/PT/Income.csv`). Files at the root level without a country directory are not supported.

2. **No File Prefixes**: Files must not have prefixes. Use `TaxBrackets.csv`, NOT `PT_TaxBrackets.csv`.

3. **ISO Country Codes**: Country folders must use ISO 3166-1 alpha-2 codes (PT, GB, DE, etc.). No country names (Portugal, UK) or variants (portugal, pt, uk) are allowed.

4. **Required Files**: Each country directory with income data must have an `Income.csv` file.

## Principles

1. **Income by Source**: Income.csv files are located in country directories (data/PT/, data/GB/) and track income EARNED IN that country.

2. **ISO Standards Only**:
   - Country codes: ISO 3166-1 alpha-2 (PT, GB, DE)
   - Currency codes: ISO 4217 (EUR, GBP, USD)

3. **Exchange Rates**: Centralized at root level with monthly precision, supporting multiple currency pairs.

## File Standards

- **No hardcoded currency or exchange rates in code**
- **No country names or variants** - ISO codes only
- **ISO 8601 dates** (YYYY-MM-DD)
- **UTC times** for consistency
- **UTF-8 encoding** for CSV files
- **Header row** required with exact column names
- **No empty rows** except for specific file structure reasons
  <<<<<<< HEAD

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
- # May require manual override in TaxResidency.csv
  > > > > > > > origin/main
