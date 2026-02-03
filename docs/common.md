# Common Tax Concepts

This document covers concepts that apply across multiple tax residencies.

## Tax Residency vs Source Country

### Tax Residency

The country whose tax laws apply to your **worldwide income**.

| Residency | Taxes            |
| --------- | ---------------- |
| Portugal  | Worldwide income |
| UK        | Worldwide income |
| Germany   | Worldwide income |

### Source Country

The country where income was **paid from**.

| Source   | Withholding    | Notes                        |
| -------- | -------------- | ---------------------------- |
| Portugal | Varies by type | 0% employment, 25% freelance |
| UK       | PAYE           | 0-45% employment             |
| Germany  | Lohnsteuer     | 0-45% employment             |

### Interaction

```
Residency Country: Taxes worldwide income at residency rates
Source Country: Withholds tax at source rates
```

**Example**: UK resident working for Portuguese company:

- UK taxes worldwide income (progressive rates)
- Portugal withholds at source (if applicable)
- UK may credit foreign tax paid

## Foreign Tax Credit (FTC)

Prevents double taxation when income is taxed in both source and residency countries.

### Calculation

```javascript
function calculateForeignTaxCredit(foreignIncome, totalIncome, totalTax, foreignTaxPaid) {
  // Tax attributable to foreign income
  const attributableTax = totalTax * (foreignIncome / totalIncome);

  // Credit limited to lesser of:
  // 1. Foreign tax actually paid
  // 2. Portuguese tax on that income
  return Math.min(foreignTaxPaid, attributableTax);
}
```

### Limitation

Credit cannot exceed the tax attributable to that income. Unused credits:

- **Portugal**: Cannot be carried forward (generally)
- **UK**: Can sometimes carry backward/forward
- **Germany**: Complex rules, case-by-case

## EU/EEA Dividend Exemption

Portugal and some EU countries offer preferential dividend treatment.

### Portugal's 50% Exemption

- **Eligible**: Dividends from PT/EU/EEA sources
- **Taxable**: Only 50% of gross dividend
- **Result**: Effective rate roughly halved

### Example

| Scenario   | Gross Dividend | Taxable | Tax (28%) | Net    |
| ---------- | -------------- | ------- | --------- | ------ |
| PT Company | €10,000        | €5,000  | €1,400    | €8,600 |
| UK Company | €10,000        | €10,000 | €2,800    | €7,200 |
| DE Company | €10,000        | €5,000  | €1,400    | €8,600 |

## Currency Conversion

All calculations in calculator use **EUR** as base currency.

### Exchange Rate Handling

| Field            | Description            |
| ---------------- | ---------------------- |
| `SourceCurrency` | Currency of income     |
| `ExchangeRate`   | Rate to convert to EUR |

### Example

```
£3,000 dividend @ 1.18 rate = €2,542.37 (rounded)
```

### Exchange Rate Sources

The calculator uses user-provided rates. For production:

- Use daily rates from ECB
- Use rate at income payment date
- Consider FIFO for multiple currencies

## Loss Carry-Forward

Can offset future income with past losses.

### Portugal (Category B - Freelance)

| Rule     | Detail                                   |
| -------- | ---------------------------------------- |
| Duration | 6 years                                  |
| Scope    | Freelance losses offset freelance income |
| Limit    | Cannot create negative tax base          |

### UK

| Rule           | Detail                                   |
| -------------- | ---------------------------------------- |
| Trading losses | Offset against other income (£50k limit) |
| Capital losses | Offset capital gains                     |
| Carry-forward  | Against trading profits                  |

### Germany

| Rule         | Detail                      |
| ------------ | --------------------------- |
| Trade losses | Carry forward indefinitely  |
| Offset       | Against future trade income |
| Restriction  | Cannot exceed €1M/year      |

## Income Types

### Employment (Dependent Work)

| Residency | Tax                              | Social Security    |
| --------- | -------------------------------- | ------------------ |
| Portugal  | Progressive + specific deduction | 11%                |
| UK        | PAYE (progressive)               | National Insurance |
| Germany   | Lohnsteuer (progressive)         | ~20% total         |

### Freelance (Self-Employment)

| Residency | Tax                           | Social Security |
| --------- | ----------------------------- | --------------- |
| Portugal  | Progressive (70% coefficient) | 21.4% (capped)  |
| UK        | Self-assessment               | Class 2 + 4 NI  |
| Germany   | Progressive + trade tax       | ~38% total      |

### Dividends

| Residency | Standard Rate | Preferential           |
| --------- | ------------- | ---------------------- |
| Portugal  | 28% flat      | 50% exemption (EU/EEA) |
| UK        | 8.75-39.35%   | £500 allowance         |
| Germany   | 26.375%       | N/A                    |

## Personal Deductions Categories

### Common Categories

| Category  | Portugal | UK  | Germany |
| --------- | -------- | --- | ------- |
| Health    | ✓        | ✗   | ✓       |
| Education | ✓        | ✗   | ✓       |
| Housing   | ✓ (rent) | ✗   | ✗       |
| IVA/VAT   | ✓        | ✗   | ✗       |
| Church    | N/A      | ✗   | ✓       |

### Deduction Methods

| Method     | Description                         |
| ---------- | ----------------------------------- |
| Standard   | Fixed amounts                       |
| Documented | Actual expenses (receipts required) |
| Percentage | % of gross income                   |
| Combined   | Mix of methods                      |

## Special Tax Regimes

### Portugal

| Regime         | Duration | Benefit                  |
| -------------- | -------- | ------------------------ |
| NHR (Pre-2024) | 10 years | 20% flat, foreign exempt |
| IRS Jovem      | 10 years | 100/75/50/25% exemption  |
| IFICU (2024+)  | 10 years | Research/tech benefits   |

### UK

| Regime           | Duration     | Benefit                    |
| ---------------- | ------------ | -------------------------- |
| Remittance Basis | Annual claim | Foreign income not taxed   |
| Non-Dom          | Indefinite   | No UK domicile = no UK tax |

### Germany

| Regime          | Duration | Benefit               |
| --------------- | -------- | --------------------- |
| Expatriate Rule | 5 years  | 30/20/10% withholding |
| Scientists      | Varies   | Tax-free grants       |

## Filing Requirements

### Annual Deadlines

| Country  | Deadline   | Extension   |
| -------- | ---------- | ----------- |
| Portugal | May 31     | August 31   |
| UK       | January 31 | February 28 |
| Germany  | July 31    | October 31  |

### Quarterly Advances

| Country  | Frequency                        |
| -------- | -------------------------------- |
| Portugal | March, June, September, December |
| UK       | January 31 (balancing)           |
| Germany  | March, June, September, December |

## Double Tax Treaties

Portugal has treaties with:

| Treaty Partner | Type                     | Key Points           |
| -------------- | ------------------------ | -------------------- |
| UK             | DTT (1968, updated 2025) | 183-day rule         |
| Germany        | DTT (1980)               | Tie-breaker rules    |
| US             | TIEA                     | Information exchange |
| Switzerland    | DTT                      | Savings clause       |

### Tie-Breaker Rules

When residency is unclear:

1. Permanent home location
2. Center of vital interests (family, economic)
3. Habitual abode
4. Citizenship
5. Mutual agreement

## References

- **OECD Model Tax Convention**: www.oecd.org/tax/treaties
- **UN Model Tax Convention**: https://financingfordevelopment.un.org
- **IBFD**: www.ibfd.org (tax research)
