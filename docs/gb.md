# United Kingdom (GB) Tax Rules

## Tax Residency

### Fiscal Year

UK tax year runs from **April 6 to April 5** of the following calendar year.

Example: Tax year 2025-26 covers April 6, 2025 to April 5, 2026.

- **Filing deadline**: January 31 following tax year end
- **Payment**: Pay-as-you-earn (PAYE) for employment, self-assessment for other income

### Statutory Residence Test (SRT)

The UK uses the Statutory Residence Test to determine tax residency:

| Test               | Description                    | Threshold  |
| ------------------ | ------------------------------ | ---------- |
| Automatic Overseas | Non-resident if <16 days in UK | <16 days   |
| Automatic UK       | Resident if >=183 days in UK   | >=183 days |
| Sufficient Ties    | Combined test for 16-182 days  | Varies     |

**Tie Categories:**

- Family tie
- Accommodation tie
- Work tie (>40 days)
- 90-day tie
- Country tie

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

## Regional Tax Bands (Scotland vs Rest of UK)

### Scotland-Specific Income Tax Bands (2025-26)

Scotland has different income tax bands compared to the rest of the UK.

| Band               | Income Range       | Tax Rate |
| ------------------ | ------------------ | -------- |
| Personal Allowance | Up to £12,570      | 0%       |
| Starter Rate       | £12,571 - £15,397  | 19%      |
| Basic Rate         | £15,398 - £27,491  | 20%      |
| Intermediate Rate  | £27,492 - £43,662  | 21%      |
| Higher Rate        | £43,663 - £75,000  | 42%      |
| Advanced Rate      | £75,001 - £125,140 | 45%      |
| Top Rate           | Over £125,140      | 48%      |

### Rest of UK Income Tax Bands (2025-26)

England, Wales, and Northern Ireland tax bands:

| Band               | Income Range       | Tax Rate |
| ------------------ | ------------------ | -------- |
| Personal Allowance | Up to £12,570      | 0%       |
| Basic Rate         | £12,571 - £50,270  | 20%      |
| Higher Rate        | £50,271 - £125,140 | 40%      |
| Additional Rate    | Over £125,140      | 45%      |

### Key Differences

| Aspect      | Scotland                                                      | Rest of UK                          |
| ----------- | ------------------------------------------------------------- | ----------------------------------- |
| Bands       | 6 bands (Starter, Basic, Intermediate, Higher, Advanced, Top) | 3 bands (Basic, Higher, Additional) |
| Top Rate    | 48% on income over £125,140                                   | 45% on income over £125,140         |
| Higher Rate | 42% on £43,663 - £75,000                                      | 40% on £50,271 - £125,140           |

**Regional Selection:** Taxpayers are assigned to Scottish rates if their main place of residence is in Scotland.

## Personal Allowance

| Year    | Amount  | Reduction Threshold | Reduction Rate |
| ------- | ------- | ------------------- | -------------- |
| 2024/25 | £12,570 | £100,000            | £1 for £2      |
| 2025/26 | £12,570 | £100,000            | £1 for £2      |

The personal allowance is reduced by £1 for every £2 of income above £100,000, until it reaches £0 at £125,140.

| Income    | Personal Allowance |
| --------- | ------------------ |
| £100,000  | £12,570            |
| £110,000  | £7,570             |
| £120,000  | £2,570             |
| £125,140+ | £0                 |

### Scottish Higher Rate Gap (UK.5)

The Scottish Higher Rate threshold (£43,662 for 25/26) is **~£6,600 lower** than the UK-wide threshold (£50,270), creating a significant "Scottish Tax Gap" for middle earners.

| Threshold                  | Scottish (25/26) | UK-wide  | Gap      |
| -------------------------- | ---------------- | -------- | -------- |
| Higher Rate                | £43,662          | £50,270  | ~£6,600  |
| Additional Rate (top rate) | £75,000          | £125,140 | ~£50,000 |

**Impact**: Scottish taxpayers reach the Higher Rate (42%) at £43,662, while UK-wide taxpayers don't reach it until £50,270.

### Historical Scottish Rates

| Tax Year | Higher Rate Threshold | UK-wide Threshold | Gap     |
| -------- | --------------------- | ----------------- | ------- |
| 2024/25  | £43,662               | £50,270           | ~£6,600 |
| 2025/26  | £43,662               | £50,270           | ~£6,600 |

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

The calculator implements this correctly through the Personal Allowance reduction mechanism. The 60% effective rate emerges automatically from:

- The 40% tax bracket applied to income above £100,000
- The 50% taper rate on Personal Allowance
- The allowance is applied at the 40% marginal rate

> **Source**: [Income Tax Act 2007, Section 35](https://www.legislation.gov.uk/ukpga/2007/3/part/3/chapter/2)

## National Insurance

### Class 1 (Employment)

| Income Range      | Rate |
| ----------------- | ---- |
| £0 - £12,570      | 0%   |
| £12,570 - £50,270 | 8%   |
| Over £50,270      | 2%   |

### Class 2 (Self-Employment)

| Threshold         | Rate                   |
| ----------------- | ---------------------- |
| Profits > £12,570 | £3.45/week (flat rate) |

### Class 4 (Self-Employment)

| Income Range      | Rate |
| ----------------- | ---- |
| £12,570 - £50,270 | 6%   |
| Over £50,270      | 2%   |

## Allowances

### Dividend Allowance

**£500** (2025-26) - tax-free dividend amount.

### Trading Allowance

**£1,000** (2025-26) - tax-free income from self-employment.

### Personal Savings Allowance (PSA)

A tax-free allowance for interest income, tiered based on the taxpayer's income tax band:

| Tax Band              | Tax Rate | PSA Amount |
| --------------------- | -------- | ---------- |
| Basic rate (20%)      | 20%      | £1,000     |
| Higher rate (40%)     | 40%      | £500       |
| Additional rate (45%) | 45%      | £0         |

PSA amounts are loaded from reference data files (`Deductions.csv`) with `Type='PersonalSavingsAllowance'` and `TaxBand` field indicating the applicable band.

#### Reference Data Format

The PSA reference data uses the following structure:

```csv
Year,Type,TaxBand,Amount
2025,PersonalSavingsAllowance,basic,1000
2025,PersonalSavingsAllowance,higher,500
2025,PersonalSavingsAllowance,additional,0
```

#### PSA Calculation

The PSA is determined by:

1. Finding which tax bracket the taxpayer's **adjusted net income** falls into (using tax bracket reference data)
2. Reading the `TaxBand` field from that bracket (basic/higher/additional)
3. Looking up the PSA amount from reference data for that tax band and year

Tax brackets include a `TaxBand` field:

```csv
Year,IncomeType,MinIncome,MaxIncome,Rate,TaxBand
2025,income,0,37700,0.2,basic
2025,income,37700,125140,0.4,higher
2025,income,125140,,0.45,additional
```

#### Example

A taxpayer with £50,000 adjusted net income:

1. Tax band: Higher rate (over £37,700)
2. PSA allowance: £500
3. Interest income: £800
4. Taxable interest: £800 - £500 = £300
5. Tax due: £300 × 20% (basic rate on savings) = £60

> **Note**: Interest income is taxed at savings income rates (basic rate typically 20%), not dividend rates.

## Dividend Tax

Dividend tax rates differ from income tax rates:

### Scotland & Rest of UK

| Band               | Income Range       | Tax Rate |
| ------------------ | ------------------ | -------- |
| Dividend Allowance | £0 - £500          | 0%       |
| Basic Rate         | £500 - £50,270     | 8.75%    |
| Higher Rate        | £50,271 - £125,140 | 33.75%   |
| Additional Rate    | Over £125,140      | 39.35%   |

**Note:** Dividend tax rates are the same across all UK regions.

## Withholding Tax

| Income Type | WHT Rate     | Notes                     |
| ----------- | ------------ | ------------------------- |
| Employment  | PAYE (0-45%) | Deducted at source        |
| Freelance   | 0%           | Self-assessment           |
| Dividend    | 0%           | Taxed via self-assessment |

## Split Year Treatment

Available when you move countries permanently during a tax year:

| Case   | Description                     |
| ------ | ------------------------------- |
| Case 1 | Arrive in UK with overseas home |
| Case 2 | Leave UK with overseas home     |
| Case 3 | Full-time work overseas         |
| Case 4 | Spouse/civil partner overseas   |
| Case 5 | Other special circumstances     |

## Special Tax Regimes

### Remittance Basis

Non-domiciled residents can elect for the remittance basis:

- Foreign income only taxed if remitted to the UK
- Requires payment of Remittance Basis Charge (after 7 years)
- Loss of Personal Allowance for long-term residents

### Non-Dom Status

- Applies if domicile is outside the UK
- Separate from tax residency
- Being phased out from April 2025

## Filing Requirements

### Annual Deadlines

| Deadline   | Description                |
| ---------- | -------------------------- |
| January 31 | Tax return filing (paper)  |
| January 31 | Tax return filing (online) |
| January 31 | Tax payment balancing      |
| July 31    | Second payment on account  |

## References

- [GOV.UK - Income Tax rates and Personal Allowances](https://www.gov.uk/income-tax-rates)
- [GOV.UK - Rates and thresholds for employers 2025 to 2026](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2025-to-2026)
- [Scottish Government - Scottish Income Tax 2025 to 2026 factsheet](https://www.gov.scot/publications/scottish-income-tax-2025-2026-factsheet/pages/2/)
- [HMRC - Statutory Residence Test](https://www.gov.uk/government/publications/statutory-residence-test-srt)
- [Income Tax Act 2007, Section 35](https://www.legislation.gov.uk/ukpga/2007/3/part/3/chapter/2)
