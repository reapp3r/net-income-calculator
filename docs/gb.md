# United Kingdom Tax Residency

This document details the UK tax rules implemented for tax residents of the United Kingdom.

## Tax Year

- **Tax year**: April 6 - April 5
- **Filing deadline**: January 31 following tax year end
- **Payment**: Pay-as-you-earn (PAYE) for employment, self-assessment for other income

> **Source**: HMRC (www.gov.uk/hmrc)

## Personal Allowance

| Year    | Amount  | Reduction Threshold | Reduction Rate |
| ------- | ------- | ------------------- | -------------- |
| 2024/25 | £12,570 | £100,000            | £1 for £2      |
| 2025/26 | £12,570 | £100,000            | £1 for £2      |

The personal allowance is reduced by £1 for every £2 of income above £100,000, until it reaches £0 at £125,140.

## The 60% Marginal Tax Trap (£100,000 - £125,140)

### How It Works

Between £100,000 and £125,140 of income, the Personal Allowance is gradually reduced:

- **Reduction rate**: £1 of allowance lost for every £2 earned above £100,000 (50% reduction)
- **Allowance fully withdrawn** at: £125,140 (for 2025: £100,000 + (£12,570 × 2))

### Effective Marginal Rate Calculation

In this income band, you face:

1. **40% income tax** on the £100,000-£125,140 portion
2. **Plus** 50% reduction in Personal Allowance × 40% tax rate = **20% effective additional tax**
3. **Total effective marginal rate: 60%**

### Impact on Take-Home Pay

For every £100 earned in the £100,000-£125,140 band:

- £40 goes to income tax (40%)
- £20 goes to "hidden" tax from allowance withdrawal (50% of £12,570 allowance lost, taxed at 40%)
- **Net: Only £40 per £100 earned** (before National Insurance)

> **Example**: At £110,000 income:
>
> - First £100,000: taxed at normal rates (keeps Personal Allowance)
> - Next £10,000: 40% tax (£4,000) + £5,000 allowance lost × 40% (£2,000) = £6,000 total
> - Effective rate: £6,000 ÷ £10,000 = **60%**

### Implementation Note

The calculator implements this correctly through the Personal Allowance reduction mechanism in `calculateUKPersonalAllowance()`. The 60% effective rate emerges automatically from:

- The 40% tax bracket applied to income above £100,000
- The 50% taper rate on Personal Allowance
- The allowance is applied at the 40% marginal rate

> **Source**: [Income Tax Act 2007, Section 35](https://www.legislation.gov.uk/ukpga/2007/3/part/3/chapter/2)

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

| Income (per month) | Rate  |
| ------------------ | ----- |
| £0 - £1,048        | 0%    |
| £1,048 - £4,189    | 5.25% |
| Over £4,189        | 2%    |

### Freelance (Class 2 + Class 4)

| Class 2:                 |            |
| ------------------------ | ---------- |
| £6,725+ (annual profits) | £3.45/week |

| Class 4:          | Rate |
| ----------------- | ---- |
| £0 - £12,570      | 0%   |
| £12,570 - £50,270 | 6%   |
| Over £50,270      | 2%   |

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
- **60% Tax Trap**: [Income Tax Act 2007, Section 35](https://www.legislation.gov.uk/ukpga/2007/3/part/3/chapter/2)
