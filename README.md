# Net Income Calculator

A precise, multi-year net income calculator for **Portuguese tax residents** with income from Portugal, the UK, and Germany.

## Quick Start

```bash
npm install
net-income-calculator <data-directory>
```

Example:

```bash
net-income-calculator data/portugal
```

## Documentation

| Topic               | Documentation                                    |
| ------------------- | ------------------------------------------------ |
| **Getting Started** | [docs/](docs/)                                   |
| Portugal Tax Rules  | [docs/pt.md](docs/pt.md)                         |
| Common Tax Concepts | [docs/common.md](docs/common.md)                 |
| Data Structure      | [docs/data_structure.md](docs/data_structure.md) |

## Features

- **Portugal tax residency**: Complete implementation of Portuguese IRS rules
- **Multiple income types**: Employment, Freelance, Dividends
- **Foreign income handling**: UK and German source income with foreign tax credits
- **NHR regime**: Pre-2024 Non-Habitual Resident benefits
- **Full deductions**: Specific deduction (€4,462.15), solidarity tax, personal deductions
- **Dividend aggregation**: 50% exemption for PT/EU/EEA dividend sources
- **Multi-year**: Support for 2024-2026 tax years with annual inflation adjustments

## Input Format

Create a directory with your income data CSV file:

```csv
Year,Month,GrossIncome,IncomeType,SourceCountry,SourceCurrency,ExchangeRate,NHRStatusAcquiredDate,DividendAggregation,FreelanceExpenses,PersonalDeductions
2025,1,3000,employment,PT,EUR,1.0,,,0,0
2025,2,1800,freelance,UK,GBP,1.18,,,150,0
2025,3,10000,dividend,PT,EUR,1.0,true,0,0
```

### Required Columns

| Column        | Type    | Description                    |
| ------------- | ------- | ------------------------------ |
| `Year`        | Integer | Tax year (2024, 2025, 2026)    |
| `Month`       | Integer | Month 1-12                     |
| `GrossIncome` | Decimal | Gross amount before deductions |

### Optional Columns (with defaults)

| Column                  | Default    | Description                        |
| ----------------------- | ---------- | ---------------------------------- |
| `IncomeType`            | employment | employment, freelance, or dividend |
| `SourceCountry`         | PT         | PT, UK, DE, or other ISO code      |
| `SourceCurrency`        | EUR        | ISO 4217 currency code             |
| `ExchangeRate`          | 1.0        | Rate to convert to EUR             |
| `NHRStatusAcquiredDate` | null       | YYYY-MM-DD if NHR applies          |
| `DividendAggregation`   | false      | Use 50% exemption (PT/EU/EEA only) |
| `FreelanceExpenses`     | 0          | Documented freelance expenses      |
| `PersonalDeductions`    | 0          | Total personal deductions          |

See [CLAUDE.md](CLAUDE.md) for developers and [docs/pt.md](docs/pt.md) for detailed tax rules.

## Output

The calculator generates these files in your data directory:

| File                 | Description                        |
| -------------------- | ---------------------------------- |
| `MonthlyResults.csv` | Monthly breakdown by income source |
| `AnnualSummary.csv`  | Annual totals with NHR status      |
| `AnnualByType.csv`   | Breakdown by income type           |
| `nhrSummary.csv`     | NHR savings (if NHR applies)       |

## Architecture

```
lib/
├── calculator.js           # Core calculation engine
├── loader.js               # CSV data loader
├── residency/
│   ├── base.js             # TaxResidency abstract class
│   ├── pt.js               # Portugal residency implementation
│   └── index.js            # Residency registry
└── utils/
    ├── currency.js         # Currency conversion
    └── index.js            # Utility exports
```

## Tax Years Supported

| Year | IAS Value | Specific Deduction | Housing Max |
| ---- | --------- | ------------------ | ----------- |
| 2024 | €509.26   | €4,104.00          | €439.00     |
| 2025 | €522.50   | €4,462.15          | €502.11     |
| 2026 | €537.13   | €4,587.09          | €750.00     |

## Assumptions

This calculator makes specific assumptions documented in [CLAUDE.md](CLAUDE.md):

| Assumption                       | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| No professional association fees | Uses standard specific deduction (€4,462.15 for 2025)         |
| NHR activity is high-value-added | Assumes 20% flat rate qualification per Portaria No. 230/2019 |
| Continental Portugal only        | Mainland tax brackets (not Madeira/Azores)                    |
| No IRS Jovem                     | Assumes taxpayer no longer eligible for 10-year exemption     |
| No NHR 2.0 (IFICI)               | 2024+ scientific research regime not implemented              |
| No Minimum Subsistence (2026)    | €12,880 safety net not implemented                            |

## Testing

```bash
npm test                 # Run all tests
npm run test:coverage   # Run with coverage
npm run test:watch      # Watch mode
```

## References

- **Portugal Tax Authority**: [www.portaldasfinancas.gov.pt](https://www.portaldasfinancas.gov.pt)
- **IRS Code**: [Código do IRS](https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2014-70048167)
- **NHR Legislation**: [Decree-Law no. 249/2009](https://www.portaldascomunidades.mne.gov.pt/images/EMI/IRS_RNH_PT.pdf)

## Disclaimer

This calculator is for informational purposes only. Tax laws are complex and subject to change. Consult a qualified tax professional for personalized advice.
