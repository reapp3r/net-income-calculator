# ISO Standards for Net Income Calculator

## Country Codes

- **Standard**: ISO 3166-1 alpha-2
- **Format**: 2 uppercase letters
- **Examples**: PT, GB, DE
- **Invalid**: Portugal, UK, Germany, portugal, uk, germany
- **Validation**: /^[A-Z]{2}$/
- **Error Message**: `Invalid country code: ${code}. Must be ISO 3166-1 alpha-2 (e.g., PT, GB, DE)`

## Currency Codes

- **Standard**: ISO 4217
- **Format**: 3 uppercase letters
- **Examples**: EUR, GBP, USD
- **Invalid**: €, £, $, eur, gbp
- **Validation**: /^[A-Z]{3}$/
- **Error Message**: `Invalid currency code format: ${code}. Must be ISO 4217 (e.g., EUR, GBP, USD)`

## Date Format

- **Standard**: ISO 8601
- **Format**: YYYY-MM-DD
- **Examples**: 2025-01-15, 2026-12-31
- **Validation**: /^\d{4}-\d{2}-\d{2}$/
- **Error Message**: `Invalid date format: ${dateStr}. Must be YYYY-MM-DD`

## Enforcement

All code must validate inputs against these standards and throw descriptive errors for invalid formats.

## Usage

```javascript
const {
  validateCountryCode,
  validateCurrencyCode,
  validateDate,
} = require('./lib/utils/validation');

// Validate country code
validateCountryCode('PT'); // ✅ Valid
validateCountryCode('Portugal'); // ❌ Throws error

// Validate currency code
validateCurrencyCode('EUR'); // ✅ Valid
validateCurrencyCode('€'); // ❌ Throws error

// Validate date
validateDate('2025-01-15'); // ✅ Valid
validateDate('15/01/2025'); // ❌ Throws error
```
