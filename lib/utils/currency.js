/**
 * @module currency
 * Multi-Currency Converter and Utilities
 *
 * Handles currency conversions and multi-currency calculations.
 * No default currency - calculations are done in local country currency.
 */

// Exchange rate cache (in a real app, this would come from an API)
let exchangeRates = new Map();

/**
 * Set exchange rate for a currency pair
 * @param {string} fromCurrency - Source currency code (ISO 4217)
 * @param {string} toCurrency - Target currency code (ISO 4217)
 * @param {number} rate - Exchange rate (1 fromCurrency = rate toCurrency)
 */
function setExchangeRate(fromCurrency, toCurrency, rate) {
  const key = `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`;
  exchangeRates.set(key, rate);
  
  // Also set inverse rate
  const inverseKey = `${toCurrency.toUpperCase()}_${fromCurrency.toUpperCase()}`;
  exchangeRates.set(inverseKey, rate > 0 ? 1 / rate : 0);
}

/**
 * Get exchange rate for a currency pair
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number|null} Exchange rate or null if not available
 */
function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return 1.0;
  }
  
  const key = `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`;
  return exchangeRates.get(key) || null;
}

/**
 * Convert amount between currencies
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {number} customRate - Optional custom exchange rate
 * @returns {number} Converted amount
 */
function convertCurrency(amount, fromCurrency, toCurrency, customRate = null) {
  if (!amount || amount <= 0) return 0;
  
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount;
  }
  
  const rate = customRate || getExchangeRate(fromCurrency, toCurrency);
  
  if (!rate) {
    throw new Error(`No exchange rate available for ${fromCurrency} to ${toCurrency}`);
  }
  
  return amount * rate;
}

/**
 * Validate currency code
 * @param {string} currencyCode - Currency code to validate
 * @returns {boolean} True if valid ISO 4217 format
 */
function isValidCurrencyCode(currencyCode) {
  return /^[A-Z]{3}$/.test(currencyCode.toUpperCase());
}

/**
 * Get currency symbol (common symbols)
 * @param {string} currencyCode - Currency code
 * @returns {string} Currency symbol
 */
function getCurrencySymbol(currencyCode) {
  const symbols = {
    'EUR': '€',
    'GBP': '£',
    'USD': '$',
    'JPY': '¥',
    'CHF': 'Fr',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr'
  };
  
  return symbols[currencyCode.toUpperCase()] || currencyCode;
}

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted amount with symbol
 */
function formatCurrency(amount, currencyCode, decimals = 2) {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = amount.toFixed(decimals);
  
  // Common formatting rules
  if (['EUR', 'GBP'].includes(currencyCode.toUpperCase())) {
    return `${symbol}${formatted}`;
  } else if (currencyCode.toUpperCase() === 'USD') {
    return `${symbol}${formatted}`;
  } else {
    return `${formatted} ${currencyCode}`;
  }
}

/**
 * Initialize with common exchange rates
 * In production, these would come from a reliable API
 */
function initializeCommonRates() {
  // EUR to other major currencies
  setExchangeRate('EUR', 'GBP', 0.85);
  setExchangeRate('EUR', 'USD', 1.08);
  setExchangeRate('EUR', 'CHF', 0.95);
  
  // Additional rates will be set via inverse automatically
  
  console.log('Initialized common exchange rates');
}

// Initialize on module load
initializeCommonRates();

module.exports = {
  convertCurrency,
  setExchangeRate,
  getExchangeRate,
  isValidCurrencyCode,
  getCurrencySymbol,
  formatCurrency,
  initializeCommonRates
};