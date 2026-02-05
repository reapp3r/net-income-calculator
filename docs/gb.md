# United Kingdom Tax Residency

This document details the UK tax rules implemented for tax residents of the United Kingdom.

## Tax Year

- **Tax year**: April 6 - April 5
- **Filing window**: October 31 (paper) or January 31 (online) of following year
- **Payment**: Pay As You Earn (PAYE) for employment, Self Assessment for freelancers

> **Source**: [HMRC Tax Returns](https://www.gov.uk/government/collections/hmrc-online-tax-return-forms)

## Personal Allowance

| Year | Amount  |
| ---- | ------- |
| 2025 | £12,570 |
| 2026 | £12,770 |

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

## Tax Brackets

### 2025-2026 (Tax Year)

| Taxable Income     | Rate |
| ------------------ | ---- |
| £0 - £37,700       | 20%  |
| £37,700 - £125,140 | 40%  |
| Over £125,140      | 45%  |

**Note**: Taxable income is after Personal Allowance deduction. The bands shown are for the "adjusted" income (i.e., income minus Personal Allowance).

### 2026-2027 (Tax Year)

| Taxable Income     | Rate |
| ------------------ | ---- |
| £0 - £37,700       | 20%  |
| £37,700 - £125,140 | 40%  |
| Over £125,140      | 45%  |

## Dividend Tax Rates

| Taxable Income                 | Rate   |
| ------------------------------ | ------ |
| £0 - £500 (Dividend Allowance) | 0%     |
| £500 - £37,700                 | 8.75%  |
| £37,700 - £125,140             | 33.75% |
| Over £125,140                  | 39.35% |

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

## Allowances

### Trading Allowance (Freelance)

| Year | Amount |
| ---- | ------ |
| 2025 | £1,000 |
| 2026 | £1,000 |

Deduct £1,000 from freelance income before tax, or use actual expenses if higher.

### Dividend Allowance

| Year | Amount |
| ---- | ------ |
| 2025 | £500   |
| 2026 | £500   |

First £500 of dividend income is tax-free.

## Special Regimes

The UK does not currently have any special tax regimes comparable to Portugal's NHR.

## Additional Resources

- [HMRC Income Tax Rates](https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past-years)
- [HMRC National Insurance](https://www.gov.uk/national-insurance)
- [HMRC Personal Allowance](https://www.gov.uk/income-tax/Personal-Allowance)
