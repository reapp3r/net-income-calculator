# Portugal Tax Residency

This document details the Portuguese tax rules implemented for tax residents of Portugal.

## Tax Year

- **Calendar year**: January 1 - December 31
- **Filing window**: April 1 - June 30 of following year (extension available until August 31)
- **Payment**: Quarterly advances + final settlement

> **Source**: _Código do IRS, Artigo 60.º_

## Tax Brackets

### 2025

| Taxable Income    | Rate  | Parcela a Abater |
| ----------------- | ----- | ---------------- |
| Up to €8,059      | 12.5% | –                |
| €8,059 - €12,160  | 16%   | €282.07          |
| €12,160 - €17,233 | 21.5% | €950.91          |
| €17,233 - €22,306 | 24.4% | €1,450.67        |
| €22,306 - €28,400 | 31.4% | €3,011.98        |
| €28,400 - €41,629 | 34.9% | €4,006.10        |
| €41,629 - €44,987 | 43.1% | €7,419.54        |
| €44,987 - €83,696 | 44.6% | €8,094.51        |
| Over €83,696      | 48%   | €10,939.90       |

### 2026

| Taxable Income    | Rate  | Parcela a Abater |
| ----------------- | ----- | ---------------- |
| Up to €8,342      | 12.5% | –                |
| €8,342 - €12,587  | 15.7% | €266.94          |
| €12,587 - €17,838 | 21.2% | €959.26          |
| €17,838 - €23,089 | 24.1% | €1,476.45        |
| €23,089 - €29,397 | 31.1% | €3,092.77        |
| €29,397 - €43,090 | 34.9% | €4,209.94        |
| €43,090 - €46,566 | 43.1% | €7,743.27        |
| €46,566 - €86,634 | 44.6% | €8,441.48        |
| Over €86,634      | 48%   | €11,387.17       |

## Specific Deduction (Employment)

| Year | Amount    |
| ---- | --------- |
| 2025 | €4,462.15 |
| 2026 | €4,587.09 |

> **Note**: Increases to €4,702.50 if mandatory professional association fees are paid (not implemented).

## Social Security

| Income Type | Rate  | Basis                        | Cap           |
| ----------- | ----- | ---------------------------- | ------------- |
| Employment  | 11%   | 100% of gross                | None          |
| Freelance   | 21.4% | 70% (services) / 20% (goods) | 12× IAS/month |
| Dividends   | 0%    | N/A                          | N/A           |

### IAS Values

| Year | IAS     | Monthly Cap | Annual SS Cap |
| ---- | ------- | ----------- | ------------- |
| 2024 | €509.26 | €6,111.12   | €73,333.44    |
| 2025 | €522.50 | €6,270.00   | €75,240.00    |
| 2026 | €537.13 | €6,445.56   | €77,346.72    |

## Solidarity Tax (Additional Surcharge)

Applies to **taxable income** (income after specific deduction and other applicable deductions).

| Year | Threshold 1 | Rate 1 | Threshold 2 | Rate 2 |
| ---- | ----------- | ------ | ----------- | ------ |
| 2025 | €80,000     | +2.5%  | €250,000    | +5%    |
| 2026 | €86,634     | +2.5%  | €250,000    | +5%    |

**Calculation:**

- On taxable income over €80,000 (2025) or €86,634 (2026): Add 2.5% on excess
- On taxable income over €250,000: Add additional 5% on excess above €250,000

## NHR Regime (Pre-2024)

Valid for 10 years from acquisition date.

### Benefits

| Income Type        | Standard    | NHR          |
| ------------------ | ----------- | ------------ |
| PT Employment      | Progressive | **20% flat** |
| Foreign Employment | Progressive | **Exempt**   |
| Foreign Freelance  | Progressive | **Exempt**   |
| Foreign Dividends  | 28%         | **Exempt**   |
| Foreign Interest   | 28%         | **Exempt**   |
| Foreign Royalties  | 28%         | **Exempt**   |
| Foreign Pensions   | Progressive | **20% flat** |

### Duration

- Years 1-10: Active (full benefits)
- Year 11+: Expired (standard rules)

### NHR Calculation Flow

**Portuguese Employment Income (20% flat rate):**

```
1. Gross Employment Income
2. Subtract Social Security (11% of gross)
3. Apply 20% flat tax on (gross - social security)
4. Derive Net Income
```

**Foreign Employment/Freelance/Dividend Income:**

```
1. Gross Foreign Income
2. Portuguese tax: €0 (exempt)
3. Foreign withholding: Applied by source country
4. Derive Net Income
```

**Note:** The specific deduction (€4,462.15) does NOT apply to NHR employment income. The 20% flat rate applies directly to (gross income - social security).

### Eligibility for 20% Flat Rate

Only applies to **high-value-added activities** (Portaria No. 230/2019):

- Scientific research and innovation
- Highly qualified technical activities
- Engineering and architecture
- Medicine and healthcare specialists
- Information technology and digital services
- University teaching and research

> **Assumption**: Calculator assumes all PT employment qualifies for 20% rate.

## Freelance Tax Rules

### Coefficient

| Type     | Coefficient | Taxable      |
| -------- | ----------- | ------------ |
| Services | 70%         | 70% of gross |
| Goods    | 20%         | 20% of gross |

### 15% Expense Rule (OE2026)

For services, the 30% automatic deduction is only fully granted if documented expenses ≥ 15% of gross.

```javascript
const REQUIRED_EXPENSE_RATIO = 0.15;
const AUTOMATIC_DEDUCTION_RATIO = 0.3;

function calculateTaxableBase(gross, expenses, type) {
  if (type === 'services' && expenses < gross * 0.15) {
    const shortfall = gross * 0.15 - expenses;
    return gross * 0.7 + shortfall; // Shortfall added back
  }
  return gross * 0.7;
}
```

## Dividend Tax

### Rates

| Option                 | Rate        | Taxable |
| ---------------------- | ----------- | ------- |
| Flat                   | 28%         | 100%    |
| Aggregated (PT/EU/EEA) | Progressive | 50%     |
| Aggregated (Non-EU/UK) | Progressive | 100%    |
| Tax Haven              | 35%         | 100%    |

### Dividend Aggregation (Engrossamento)

- **Eligible**: Portugal, EU, EEA countries
- **Ineligible**: UK (post-Brexit), Switzerland, non-EEA
- **Benefit**: Only 50% of dividends taxable

## Personal Deductions (Deduções à Coleta)

| Category            | 2025          | 2026          |
| ------------------- | ------------- | ------------- |
| Health Expenses     | No limit      | No limit      |
| Education Expenses  | No limit      | No limit      |
| Housing (Rent)      | €700          | €900          |
| IVA (VAT)           | % of expenses | % of expenses |
| IVA Books & Culture | N/A           | 15% of VAT    |

### IVA Books & Culture (2026)

Deduct **15% of VAT** on:

- Books from specialized shops
- Theater, music, dance tickets
- Museum, library, historical site entry fees

Part of €250 general IVA deduction cap.

## Minimum Subsistence (Existência Mínima) - 2026

Safety net ensuring net income ≥ minimum wage threshold.

| Year | Amount          |
| ---- | --------------- |
| 2025 | Not implemented |
| 2026 | €12,880         |

## Withholding Tax (as Source Country)

| Income Type | Rate |
| ----------- | ---- |
| Employment  | 0%   |
| Freelance   | 25%  |
| Dividends   | 25%  |

## Residency Determination

You are a Portuguese tax resident if you:

- Stay in Portugal > 183 days/year (consecutive or not)
- Have a permanent home in Portugal
- Have center of vital interests in Portugal (family, economic ties)

## References

- **Tax Authority**: www.portaldasfinancas.gov.pt
- **Legislation**: Decree-Law no. 249/2009 (NHR)
- **IAS Values**: Published annually by ISSS
- **NHR Activities**: Portaria No. 230/2019
