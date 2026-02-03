/**
 * @module currency
 * Currency Conversion Utilities
 *
 * Handles currency conversions using ISO 4217 codes and exchange rate data.
 * Exchange rates are loaded from ExchangeRates.csv.
 *
 * @example
 * const exchangeRates = loadExchangeRates();
 * const gbpAmount = convertCurrency(1000, 'EUR', 'GBP', exchangeRates, 2025, 1);
 * convertCurrency(1000, 'EUR', 'GBP', exchangeRates, 2025, 2); // Uses February rate
 */

/**
 * Convert amount between currencies
 *
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency (ISO 4217)
 * @param {string} toCurrency - Target currency (ISO 4217)
 * @param {Array} exchangeRates - Exchange rate data
 * @param {number} year - Year for rate lookup
 * @param {number} month - Month for rate lookup (1-12)
 * @param {number} customRate - Optional custom exchange rate
 * @returns {number} Converted amount
 * @throws {Error} If currency codes invalid or rate not found
 *
 * @example
 * convertCurrency(1000, 'EUR', 'GBP', rates, 2025, 1); // Returns 850.00
 * convertCurrency(1000, 'EUR', 'GBP', rates, 2025, 2); // Uses February rate
 */
function convertCurrency(
  amount,
  fromCurrency,
  toCurrency,
  exchangeRates,
  year,
  month,
  customRate = null
) {
  validateCurrencyCode(fromCurrency);
  validateCurrencyCode(toCurrency);

  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = customRate || getExchangeRate(fromCurrency, toCurrency, exchangeRates, year, month);

  if (rate === null) {
    throw new Error(
      `Exchange rate not found: ${fromCurrency} → ${toCurrency} for ${year}-${month}. ` +
        `Please add rate to ExchangeRates.csv.`
    );
  }

  return amount * rate;
}

/**
 * Validate ISO 4217 currency code
 *
 * @param {string} code - Currency code to validate
 * @returns {string} Normalized uppercase code
 * @throws {Error} If code is invalid
 *
 * @example
 * validateCurrencyCode('EUR'); // ✅ Returns 'EUR'
 * validateCurrencyCode('€'); // ❌ Throws error
 * validateCurrencyCode('eur'); // ❌ Throws error
 */
function validateCurrencyCode(code) {
  if (!code || typeof code !== 'string') {
    throw new Error(`Invalid currency code: ${code}`);
  }

  const normalized = code.toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(
      `Invalid currency code format: ${code}. ` + `Must be ISO 4217 (e.g., EUR, GBP, USD)`
    );
  }

  return normalized;
}

/**
 * Get exchange rate for currency pair
 * Looks up monthly rate, falls back to annual average if monthly not found
 *
 * @param {string} from - Source currency (ISO 4217)
 * @param {string} to - Target currency (ISO 4217)
 * @param {Array} exchangeRates - Exchange rate data
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {number} Exchange rate
 * @throws {Error} If rate not found
 *
 * @example
 * // Get monthly rate for January 2025
 * const rate = getExchangeRate('EUR', 'GBP', rates, 2025, 1); // Returns 0.8500
 *
 * // Fall back to annual average (Month = null)
 * const annualRate = getExchangeRate('EUR', 'GBP', rates, 2025, null); // Returns average rate
 */
function getExchangeRate(from, to, exchangeRates, year, month) {
  // Try monthly rate first
  let rate = exchangeRates.find(
    (r) => r.Year === year && r.Month === month && r.FromCurrency === from && r.ToCurrency === to
  );

  if (rate) {
    return rate.Rate;
  }

  // Fall back to annual average (Month = null or 0)
  rate = exchangeRates.find(
    (r) =>
      r.Year === year &&
      (r.Month === null || r.Month === 0) &&
      r.FromCurrency === from &&
      r.ToCurrency === to
  );

  if (rate) {
    return rate.Rate;
  }

  throw new Error(
    `Exchange rate not found: ${from} → ${to} for ${year}-${month}. ` +
      `Please add rate to ExchangeRates.csv.`
  );
}

module.exports = {
  convertCurrency,
  validateCurrencyCode,
  getExchangeRate,
};
