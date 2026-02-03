# Net Income Calculator - Multi-Country Edition

A precise, multi-year net income calculator with **multi-country tax residency support**. Currently implements Portuguese residency rules for income from Portugal, the UK, and Germany.

## Quick Start

```bash
npm install
net-income-calculator ./my-income.csv
```

## Documentation

**Detailed tax rules:**

| Country         | Documentation                                  |
| --------------- | ---------------------------------------------- |
| Portugal        | [docs/pt/README.md](docs/pt/README.md)         |
| United Kingdom  | [docs/uk/README.md](docs/uk/README.md)         |
| Germany         | [docs/de/README.md](docs/de/README.md)         |
| Common Concepts | [docs/common/README.md](docs/common/README.md) |

## Features

- **Multi-country residency**: Portugal (active), UK stub, Germany planned
- **Foreign tax handling**: Withholding and credits for international income
- **Multiple income types**: Employment, Freelance, Dividends
- **NHR regime**: Pre-2024 Portuguese special tax regime
- **Full deductions**: Specific deduction, solidarity tax, personal deductions
- **Dividend aggregation**: 50% exemption for PT/EU/EEA sources
- **Multi-year**: Loss carry-forward, NHR expiration tracking

## Input Format

```csv
Year,Month,GrossIncome,IncomeType,SourceCountry,ResidencyCountry,NHRStatusAcquiredDate
2025,1,5000,employment,PT,PT,2023-06-15
2025,1,2000,freelance,UK,PT,
2025,3,10000,dividend,PT,PT,
```

See [Input Format](docs/common/README.md#input-format) for full column definitions.

## Output

| File                 | Description                         |
| -------------------- | ----------------------------------- |
| `MonthlyResults.csv` | Monthly breakdown by income type    |
| `AnnualSummary.csv`  | Annual totals by residency          |
| `AnnualByType.csv`   | Breakdown by income type            |
| `NHRSummary.csv`     | NHR savings summary (if applicable) |

## Architecture

```
lib/
├── calculator.js         # Core calculation engine
└── residency/            # Tax residency implementations
    ├── base.js           # TaxResidency abstract class
    ├── pt.js             # Portugal residency (active)
    ├── uk.js             # UK residency (stub)
    └── index.js          # Registry
```

See [docs/common/README.md](docs/common/README.md#residency-abstraction) for architecture details.

## Adding a New Residency

1. Create `lib/residency/{countryCode}.js` extending `TaxResidency`
2. Implement required methods: `getTaxBrackets()`, `calculateEmploymentTax()`, etc.
3. Register in `lib/residency/index.js`

See [docs/common/README.md](docs/common/README.md#adding-a-new-residency-country) for detailed instructions.

## Assumptions

This calculator makes specific assumptions. See [docs/pt/README.md](docs/pt/README.md#assumptions) for full details:

| Assumption                       | Description                                  |
| -------------------------------- | -------------------------------------------- |
| No professional association fees | Uses standard specific deduction (€4,462.15) |
| NHR activity is high-value-added | Assumes 20% flat rate qualification          |
| Continental Portugal only        | Not Madeira/Azores                           |
| No IRS Jovem                     | Assumes taxpayer no longer eligible          |
| No NHR 2.0 (IFICU)               | Not implemented                              |

## References

- **Portugal Tax Authority**: <www.portaldasfinancas.gov.pt>
- **UK HMRC**: <www.gov.uk/government/organisations/hm-revenue-customs>
- **German Finance Ministry**: <www.bundesfinanzministerium.de>

## Disclaimer

This calculator is for informational purposes only. Tax laws are complex and subject to change. Consult a qualified tax professional for personalized advice.
