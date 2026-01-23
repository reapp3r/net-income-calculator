# Portugal Tax Residency

This document details the Portuguese tax rules implemented for tax residents of Portugal.

## Tax Year

- **Calendar year**: January 1 - December 31
- **Filing deadline**: Typically May of following year
- **Payment**: Quarterly advances + final settlement

## Tax Brackets

### 2025

| Taxable Income | Rate | Cumulative Tax |
|----------------|------|----------------|
| €0 - €7,488 | 0% | €0 |
| €7,488 - €11,284 | 14.5% | €551 |
| €11,284 - €15,668 | 16.5% | €1,274 |
| €15,668 - €20,668 | 17.5% | €2,161 |
| €20,668 - €26,356 | 20% | €3,299 |
| €26,356 - €38,632 | 22.5% | €6,061 |
| €38,632 - €49,712 | 27% | €9,092 |
| €49,712 - €79,706 | 32% | €18,682 |
| €79,706 - €134,292 | 37% | €38,989 |
| €134,292 - €187,204 | 41% | €60,663 |
| €187,204 - €246,113 | 43% | €86,004 |
| Over €246,113 | 45% | €118,161 |

### 2026

| Taxable Income | Rate |
|----------------|------|
| €0 - €8,342 | 12.5% |
| €8,342 - €12,587 | 15.7% |
| €12,587 - €17,838 | 21.2% |
| €17,838 - €23,089 | 24.1% |
| €23,089 - €29,397 | 31.1% |
| €29,397 - €43,090 | 34.9% |
| €43,090 - €46,566 | 43.1% |
| €46,566 - €86,634 | 44.6% |
| Over €86,634 | 48.0% |

## Specific Deduction (Employment)

| Year | Amount |
|------|--------|
| 2025 | €4,462.15 |
| 2026 | €4,641.50 |

> **Note**: Increases to €4,702.50 if mandatory professional association fees are paid (not implemented).

## Social Security

| Income Type | Rate | Basis | Cap |
|-------------|------|-------|-----|
| Employment | 11% | 100% of gross | None |
| Freelance | 21.4% | 70% (services) / 20% (goods) | 12× IAS/month |
| Dividends | 0% | N/A | N/A |

### IAS Values

| Year | IAS | Monthly Cap | Annual SS Cap |
|------|-----|-------------|---------------|
| 2025 | €509.26 | €6,111.12 | €73,333.44 |
| 2026 | €537.13 | €6,445.56 | €77,346.72 |

## Solidarity Tax (Additional Surcharge)

Applies to income **after** specific deduction.

| Year | Threshold 1 | Rate 1 | Threshold 2 | Rate 2 |
|------|-------------|--------|-------------|--------|
| 2025 | €80,000 | +2.5% | €250,000 | +5% |
| 2026 | €86,634 | +2.5% | €250,000 | +5% |

## NHR Regime (Pre-2024)

Valid for 10 years from acquisition date.

### Benefits

| Income Type | Standard | NHR |
|-------------|----------|-----|
| PT Employment | Progressive | **20% flat** |
| Foreign Employment | Progressive | **Exempt** |
| Foreign Freelance | Progressive | **Exempt** |
| Foreign Dividends | 28% | **Exempt** |
| Foreign Interest | 28% | **Exempt** |
| Foreign Royalties | 28% | **Exempt** |
| Foreign Pensions | Progressive | **20% flat** |

### Duration

- Years 1-10: Active (full benefits)
- Year 11+: Expired (standard rules)

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

| Type | Coefficient | Taxable |
|------|-------------|---------|
| Services | 70% | 70% of gross |
| Goods | 20% | 20% of gross |

### 15% Expense Rule (OE2026)

For services, the 30% automatic deduction is only fully granted if documented expenses ≥ 15% of gross.

```javascript
const REQUIRED_EXPENSE_RATIO = 0.15;
const AUTOMATIC_DEDUCTION_RATIO = 0.30;

function calculateTaxableBase(gross, expenses, type) {
  if (type === 'services' && expenses < gross * 0.15) {
    const shortfall = (gross * 0.15) - expenses;
    return (gross * 0.70) + shortfall;  // Shortfall added back
  }
  return gross * 0.70;
}
```

## Dividend Tax

### Rates

| Option | Rate | Taxable |
|--------|------|---------|
| Flat | 28% | 100% |
| Aggregated (PT/EU/EEA) | Progressive | 50% |
| Aggregated (Non-EU/UK) | Progressive | 100% |
| Tax Haven | 35% | 100% |

### Dividend Aggregation (Engrossamento)

- **Eligible**: Portugal, EU, EEA countries
- **Ineligible**: UK (post-Brexit), Switzerland, non-EEA
- **Benefit**: Only 50% of dividends taxable

## Personal Deductions (Deduções à Coleta)

| Category | 2025 | 2026 |
|----------|------|------|
| Health Expenses | No limit | No limit |
| Education Expenses | No limit | No limit |
| Housing (Rent) | €502.11 | €900 |
| IVA (VAT) | % of expenses | % of expenses |
| IVA Books & Culture | N/A | 15% of VAT |

### IVA Books & Culture (2026)

Deduct **15% of VAT** on:
- Books from specialized shops
- Theater, music, dance tickets
- Museum, library, historical site entry fees

Part of €250 general IVA deduction cap.

## Minimum Subsistence (Existência Mínima) - 2026

Safety net ensuring net income ≥ minimum wage threshold.

| Year | Amount |
|------|--------|
| 2025 | Not implemented |
| 2026 | €12,880 |

## Withholding Tax (as Source Country)

| Income Type | Rate |
|-------------|------|
| Employment | 0% |
| Freelance | 25% |
| Dividends | 25% |

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
