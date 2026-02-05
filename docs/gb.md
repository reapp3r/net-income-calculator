# United Kingdom Tax Residency

This document details the UK tax rules implemented for tax residents of the United Kingdom.

## Tax Year

- **Tax year**: April 6 - April 5
- **Filing deadline**: January 31 following tax year end
- **Payment**: Pay-as-you-earn (PAYE) for employment, self-assessment for other income

> **Source**: HMRC (www.gov.uk/hmrc)

## Tax Brackets (2024/25)

### Income Tax (After Personal Allowance)

| Taxable Income     | Band       | Rate |
| ------------------ | ---------- | ---- |
| £0 - £37,700       | Basic      | 20%  |
| £37,701 - £125,140 | Higher     | 40%  |
| Over £125,140      | Additional | 45%  |

### Dividend Tax (After Dividend Allowance)

| Taxable Income     | Band       | Rate   |
| ------------------ | ---------- | ------ |
| £0 - £37,700       | Basic      | 8.75%  |
| £37,701 - £125,140 | Higher     | 33.75% |
| Over £125,140      | Additional | 39.35% |

## Personal Allowance

| Year    | Amount  | Reduction Threshold | Reduction Rate |
| ------- | ------- | ------------------- | -------------- |
| 2024/25 | £12,570 | £100,000            | £1 for £2      |
| 2025/26 | £12,570 | £100,000            | £1 for £2      |

The personal allowance is reduced by £1 for every £2 of income above £100,000, until it reaches £0 at £125,140.

## Personal Savings Allowance (PSA)

A tax-free allowance for interest income, tiered based on the taxpayer's income tax band:

| Tax Band        | Tax Rate | PSA Amount |
| --------------- | -------- | ---------- |
| Basic rate      | 20%      | £1,000     |
| Higher rate     | 40%      | £500       |
| Additional rate | 45%      | £0         |

PSA amounts are loaded from reference data files (`Deductions.csv`) with `Type='PersonalSavingsAllowance'` and `TaxBand` field indicating the applicable band.

### Reference Data Format

The PSA reference data uses the following structure:

```csv
Year,Type,TaxBand,Amount
2025,PersonalSavingsAllowance,basic,1000
2025,PersonalSavingsAllowance,higher,500
2025,PersonalSavingsAllowance,additional,0
```

### PSA Calculation

The PSA is determined by:

1. Finding which tax bracket the taxpayer's **adjusted net income** falls into (using tax bracket reference data)
2. Reading the `TaxBand` field from that bracket (basic/higher/additional)
3. Looking up the PSA amount from reference data for that tax band and year

### Reference Data Structure

Tax brackets include a `TaxBand` field:

```csv
Year,IncomeType,MinIncome,MaxIncome,Rate,TaxBand
2025,income,0,37700,0.2,basic
2025,income,37700,125140,0.4,higher
2025,income,125140,,0.45,additional
```

### Example

A taxpayer with £50,000 adjusted net income:

1. Tax band: Higher rate (over £37,700)
2. PSA allowance: £500
3. Interest income: £800
4. Taxable interest: £800 - £500 = £300
5. Tax due: £300 × 20% (basic rate on interest) = £60

> **Note**: Interest income is taxed at the taxpayer's marginal rate, but the PSA provides a tax-free allowance up to the band threshold.

## Dividend Allowance

| Year    | Amount |
| ------- | ------ |
| 2024/25 | £500   |
| 2025/26 | £500   |

The first £500 of dividend income is tax-free. Dividends above this amount are taxed at the dividend tax rates.

## Trading Allowance

| Year    | Amount | Max Income |
| ------- | ------ | ---------- |
| 2024/25 | £1,000 | £1,000     |
| 2025/26 | £1,000 | £1,000     |

For freelance/self-employment income, the first £1,000 is tax-free. You can deduct either this allowance or actual expenses, whichever is higher.

## National Insurance

### Employment (Class 1)

| Income (per month) | Rate |
| ------------------ | ---- |
| £1,048 - £4,189    | 8%   |
| Over £4,189        | 2%   |

### Freelance (Class 2 + Class 4)

| Type    | Threshold              | Rate              |
| ------- | ---------------------- | ----------------- |
| Class 2 | Over £12,570/year      | £3.45/week (flat) |
| Class 4 | £12,570 - £50,270/year | 6%                |
| Class 4 | Over £50,270/year      | 2%                |

## Residency Determination

### Statutory Residence Test (SRT)

The UK uses the Statutory Residence Test with multiple components:

**Automatic UK Tests** (you're resident if ANY apply):

- Spend 183+ days in the UK
- Have only home in the UK for 91+ days (and live in it)
- Work full-time in the UK (35+ hours/week for any period)

**Automatic Overseas Tests** (you're NOT resident if ANY apply):

- Spend 16+ days in UK and were resident for 1+ of previous 3 tax years
- Spend 46+ days in UK and were NOT resident in previous 3 tax years
- Work full-time overseas (35+ hours/week) with fewer than 91 UK work days

**Sufficient Ties Test** (if no automatic test applies):

- Number of days in UK combined with "connecting factors" (family, accommodation, work, UK presence)

## Split Year Treatment

Available when you move countries permanently during a tax year:

| Case   | Description                     |
| ------ | ------------------------------- |
| Case 1 | Arrive in UK with overseas home |
| Case 2 | Leave UK with overseas home     |
| Case 3 | Full-time work overseas         |
| Case 4 | Spouse/civil partner overseas   |
| Case 5 | Other special circumstances     |

## References

- **HMRC**: www.gov.uk/hmrc
- **Tax Guidance**: www.gov.uk/government/organisations/hm-revenue-customs
- **Statutory Residence Test**: Finance Act 2013
