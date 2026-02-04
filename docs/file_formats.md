# File Formats for Net Income Calculator

> **Note:** This document describes the **future multi-country architecture**. For the current MVP implementation (Portugal tax residency only), see [README.md](../README.md) for the input format.

## Location.csv (Root Level)

Tracks daily location changes with timestamps for residency determination.

**Purpose**: Determine tax residency through physical presence and movement patterns.

**Format**:

```csv
Date,FromCountry,ToCountry,DepartureTime,ArrivalTime,LocationType
2025-01-01,GB,PT,09:00,12:30,Travel
2025-01-01,PT,PT,12:30,23:59,Residence
2025-01-15,PT,PT,00:00,23:59,Residence
2025-06-30,PT,GB,16:00,19:30,Travel
2025-07-01,GB,GB,00:00,23:59,Business
```

**Columns**:
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Date | Date | Yes | YYYY-MM-DD (ISO 8601) |
| FromCountry | Text | Yes | ISO 3166-1 alpha-2 code |
| ToCountry | Text | Yes | ISO 3166-1 alpha-2 code |
| DepartureTime | Time | No | HH:MM (24-hour) UTC/local time |
| ArrivalTime | Time | No | HH:MM (24-hour) UTC/local time |
| LocationType | Text | No | Residence, Business, Travel, Holiday, Other |

**LocationType Values**:

- `Residence`: Person stays overnight at dwelling
- `Business`: Work location (client site, office)
- `Travel`: Day of international travel
- `Holiday`: Personal/holiday time
- `Other`: Other location activity

**Validation**:

- Dates must be in ISO 8601 format
- Country codes must be ISO 3166-1 alpha-2
- Times in HH:MM format (24-hour)
- LocationType must be valid enum value

---

## WorkActivity.csv (Root Level)

Tracks work hours and employment locations per day.

**Purpose**: Provides work location data for UK Statutory Residence Test and general work tracking.

**Format**:

```csv
Date,Country,WorkHours,WorkType,EmployerCountry
2025-01-02,PT,8.0,Employment,PT
2025-01-03,PT,4.5,Freelance,GB
2025-01-15,PT,0.0,NonWork,
2025-07-05,GB,8.0,Employment,GB
```

**Columns**:
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Date | Date | Yes | YYYY-MM-DD (ISO 8601) |
| Country | Text | Yes | ISO 3166-1 alpha-2 code where work performed |
| WorkHours | Decimal | No | Hours worked that day (0 for non-work days) |
| WorkType | Text | No | Employment, Freelance, NonWork |
| EmployerCountry | Text | No | ISO 3166-1 alpha-2 code of employer/client |

**WorkType Values**:

- `Employment`: Regular employment relationship
- `Freelance`: Self-employed/independent contractor work
- `NonWork`: No work performed (weekend, holiday, etc.)

**Validation**:

- Dates in ISO 8601 format
- Country codes in ISO 3166-1 alpha-2
- WorkHours >= 0 and <= 24
- WorkType must be valid enum value

---

## Accommodation.csv (Root Level)

Tracks dwelling availability for residency determination (especially for Germany).

**Purpose**: Provides data for permanent home test and dwelling availability tests.

**Format**:

```csv
Year,Country,AccommodationType,AvailableFrom,AvailableTo,IsPermanentHome
2025,PT,Owned,2025-01-01,2025-12-31,true
2025,GB,Rented,2025-07-01,2025-12-31,true
2026,GB,Hotel,2025-07-01,2025-07-15,false
```

**Columns**:
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Year | Integer | Yes | Calendar year |
| Country | Text | Yes | ISO 3166-1 alpha-2 code |
| AccommodationType | Text | Yes | Owned, Rented, Family, Hotel, Other |
| AvailableFrom | Date | Yes | YYYY-MM-DD (inclusive) |
| AvailableTo | Date | Yes | YYYY-MM-DD (inclusive) |
| IsPermanentHome | Boolean | No | Indicates intent to maintain as habitual residence |

**AccommodationType Values**:

- `Owned`: Property owned by taxpayer
- `Rented`: Property rented by taxpayer
- `Family`: Family-owned property available for use
- `Hotel`: Temporary accommodation
- `Other`: Other accommodation type

**Validation**:

- Year between 2020-2050
- Country codes in ISO 3166-1 alpha-2
- AccommodationType valid enum value
- AvailableFrom <= AvailableTo
- IsPermanentHome must be boolean

---

## TaxResidency.csv (Root Level, Optional)

Manual residency overrides for complex scenarios.

**Purpose**: Override automatic residency determination when needed.

**Use Cases**:

- Manual specification of residency for split-year
- Treaty-based residency election
- Special diplomatic or student status
- Complex multi-country situations

**Format**:

```csv
Year,Country,ResidencyStatus,ResidencyStartDate,ResidencyEndDate,CalculationMethod,Notes
2025,PT,Resident,2025-01-01,2025-06-30,SplitYear,Moved to UK July 1
2025,GB,Resident,2025-07-01,2025-12-31,SplitYear,Moved from PT July 1
2026,DE,Resident,2026-01-01,2026-12-31,Manual,Treaty-based election
```

**Columns**:
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Year | Integer | Yes | Tax year |
| Country | Text | Yes | ISO 3166-1 alpha-2 country code |
| ResidencyStatus | Text | Yes | Resident, NonResident, SplitYear |
| ResidencyStartDate | Date | No | YYYY-MM-DD (when residency starts) |
| ResidencyEndDate | Date | No | YYYY-MM-DD (when residency ends) |
| CalculationMethod | Text | No | Manual, TreatyElection, Automatic |
| Notes | Text | No | Free text explanation |

**ResidencyStatus Values**:

- `Resident`: Tax resident in this country for the year
- `NonResident`: Not tax resident for the year
- `SplitYear`: Partial year residency (start or end dates provided)

**CalculationMethod Values**:

- `Manual`: User-specified residency
- `TreatyElection`: Tax treaty election override
- `Automatic`: Automatically determined (default)

**Validation**:

- Year between 2020-2050
- Country codes in ISO 3166-1 alpha-2
- Valid enum values for status and method
- Dates in YYYY-MM-DD format when provided
- ResidencyStartDate <= ResidencyEndDate when both provided

---

## ExchangeRates.csv (Root Level)

Monthly currency conversion rates with historical precision.

**Purpose**: Provide accurate exchange rates for income currency conversions.

**Format**:

```csv
Year,Month,FromCurrency,ToCurrency,Rate
2025,1,EUR,GBP,0.8500
2025,1,GBP,EUR,1.1765
2025,1,EUR,USD,1.0800
2025,2,EUR,GBP,0.8520
2025,2,GBP,EUR,1.1737
2025,2,EUR,USD,1.0850
```

**Columns**:
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Year | Integer | Yes | Calendar year (2020-2050) |
| Month | Integer | No | Month (1-12) for monthly rates, or null/0 for annual average |
| FromCurrency | Text | Yes | ISO 4217 currency code |
| ToCurrency | Text | Yes | ISO 4217 currency code |
| Rate | Decimal | Yes | Conversion rate (1 FromCurrency = Rate ToCurrency) |

**Currency Direction**:

- Include both directions for common pairs
- Example: EUR→GBP and GBP→EUR

**Monthly vs Annual**:

- Monthly rates preferred for precision
- Annual average (Month = null/0) when monthly data unavailable
- Priority: Use monthly rate when available, fall back to annual average

**Validation**:

- Year between 2020-2050
- Month between 1-12 (if provided)
- Currency codes in ISO 4217 format (3 letters)
- Rate > 0 and reasonable precision (4-6 decimal places)
- At least one rate record per year/currency pair

---

## Income.csv (Per Country)

Income records by source country.

**Purpose**: Track gross income earned in each country.

**Location**: `data/PT/Income.csv`, `data/GB/Income.csv`, etc.

**Format**:

```csv
Year,Month,Day,Amount,IncomeType,Currency,Employer,Description
2025,1,15,3000.00,employment,EUR,Company A,Monthly salary
2025,5,20,1800.00,freelance,EUR,Client B,Consulting project
2025,9,10,1900.00,dividend,EUR,Stock XYZ,Q3 dividend
```

**Columns**:
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Year | Integer | Yes | Income year |
| Month | Integer | Yes | Month (1-12) |
| Day | Integer | No | Day of month (1-31) |
| Amount | Decimal | Yes | Gross amount (positive) |
| IncomeType | Text | No | employment, freelance, dividend, interest, capital_gain |
| Currency | Text | Yes | ISO 4217 currency code |
| Employer | Text | No | Employer or client name |
| Description | Text | No | Free text note |

**IncomeType Values**:

- `employment`: Regular employment income
- `freelance`: Self-employment/independent contractor
- `dividend`: Dividend income
- `interest`: Bank interest
- `capital_gain`: Capital gains from investments
- `pension`: Pension/retirement income
- `rental`: Property rental income
- `other`: Other income types

**Currency Codes**:

- Must be ISO 4217 (EUR, GBP, USD, etc.)
- Typically matches source country's local currency
- Can be different (e.g., GBP income earned while living in PT)

**Validation**:

- Year between 2020-2050
- Month between 1-12
- Day between 1-31
- Amount > 0
- Valid IncomeType enum
- Valid ISO 4217 currency code
- Date consistency (Month/Day valid for Year)

---

## SimulationParameters.csv (Per Country)

Configuration parameters for tax calculations and residency tests.

**Location**: `data/PT/SimulationParameters.csv`, `data/GB/SimulationParameters.csv`, etc.

**Format**:

```csv
Parameter,Value,Description
# Tax Residency Tests
ResidencyTest183Days,true,Apply 183-day physical presence test
ResidencyDayCountingMethod,overnight,Method: overnight | partial_day | calendar_day
ResidencyPermanentHomeTest,true,Apply permanent home availability test
ResidencyMinDaysForPermanentHome,1,Minimum days present to qualify with permanent home

# Special Tax Regimes
NHRStatusAcquiredDate,2020-01-15,Date NHR acquired (YYYY-MM-DD) or empty if N/A
NHRDuration,10,NHR regime duration in years

# Dividend Rules
DividendAggregationEligible,true,Allow 50% aggregation for PT/EU/EEA
DividendFlatRate,0.28,Flat rate option for dividends

# Freelance Rules
FreelanceServicesCoefficient,0.70,Services coefficient for taxable income
FreelanceGoodsCoefficient,0.20,Goods coefficient for taxable income
```

**Format Rules**:

- Simple key-value format (Parameter, Value, Description)
- Lines starting with # are comments
- Values inferred from type (true/false, numeric, string)

**Parameter Categories**:

### Portugal-Specific (beyond common parameters):

- NHR configuration
- Dividend aggregation eligibility
- Freelance coefficients

### UK-Specific (beyond common parameters):

- Statutory Residence Test (SRT) configuration
- SRT thresholds and tie requirements

### Germany-Specific (if needed):

- Dwelling test configuration
- Habitual abode parameters

### Fixed Country Properties (not configurable):

- **Fiscal year**: Intrinsic to each country's tax system, cannot be changed
  - Portugal: Calendar year (January 1 - December 31)
  - UK: Tax year (April 6 - April 5)
  - Germany: Calendar year (January 1 - December 31)
  - These are hardcoded in each country's residency implementation

**Common Parameters** (all countries):

- Residency test configuration
- Currency codes
- Exchange rate fallbacks

**Validation**:

- No duplicate parameter names
- Valid parameter types (boolean, numeric, string, date)
- No empty parameter names
- Description must be provided
