/**
 * Input Validation Utilities
 *
 * Provides validation functions for common input parameters
 * to ensure data integrity and catch errors early.
 */

const SUPPORTED_YEARS = [2025, 2026, 2027];

/**
 * Validate tax year parameter
 *
 * @param {number} year - Tax year to validate
 * @param {number} defaultYear - Default year if not provided (optional)
 * @returns {Object} Validation result { valid, year, error }
 */
function validateYear(year, defaultYear = null) {
  // If no year provided and default exists, use default
  if (year === undefined || year === null) {
    if (defaultYear !== null) {
      return { valid: true, year: defaultYear, error: null };
    }
    return { valid: false, year: null, error: 'Year is required' };
  }

  // Check if year is a number
  if (typeof year !== 'number' || isNaN(year)) {
    return { valid: false, year: null, error: `Invalid year: ${year} (must be a number)` };
  }

  // Check if year is within reasonable range
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 5;
  const maxYear = currentYear + 2;

  if (year < minYear) {
    return { valid: false, year: null, error: `Year ${year} is too early (minimum: ${minYear})` };
  }

  if (year > maxYear) {
    return { valid: false, year: null, error: `Year ${year} is too far in the future (maximum: ${maxYear})` };
  }

  // Warn if year is not in supported list
  if (!SUPPORTED_YEARS.includes(year)) {
    return { valid: true, year: year, warning: `Year ${year} not in supported list [${SUPPORTED_YEARS.join(', ')}], using anyway` };
  }

  return { valid: true, year: year, error: null };
}

/**
 * Validate income amount
 *
 * @param {number} income - Income amount to validate
 * @param {string} fieldName - Name of field for error messages
 * @returns {Object} Validation result { valid, value, error }
 */
function validateIncome(income, fieldName = 'income') {
  if (income === undefined || income === null) {
    return { valid: false, value: null, error: `${fieldName} is required` };
  }

  if (typeof income !== 'number' || isNaN(income)) {
    return { valid: false, value: null, error: `${fieldName} must be a number` };
  }

  if (income < 0) {
    return { valid: false, value: null, error: `${fieldName} cannot be negative` };
  }

  return { valid: true, value: income, error: null };
}

/**
 * Validate country code
 *
 * @param {string} countryCode - Country code to validate
 * @param {Array} validCodes - List of valid codes (optional)
 * @returns {Object} Validation result { valid, code, error }
 */
function validateCountryCode(countryCode, validCodes = null) {
  if (!countryCode) {
    return { valid: false, code: null, error: 'Country code is required' };
  }

  const code = countryCode.toUpperCase();

  if (code.length !== 2) {
    return { valid: false, code: null, error: `Invalid country code: ${countryCode} (must be 2 characters)` };
  }

  if (validCodes && !validCodes.includes(code)) {
    return { valid: false, code: null, error: `Unsupported country: ${code}` };
  }

  return { valid: true, code: code, error: null };
}

/**
 * Validate income type
 *
 * @param {string} incomeType - Income type to validate
 * @param {Array} validTypes - List of valid types
 * @returns {Object} Validation result { valid, type, error }
 */
function validateIncomeType(incomeType, validTypes = ['employment', 'freelance', 'dividend']) {
  if (!incomeType) {
    return { valid: false, type: null, error: 'Income type is required' };
  }

  const type = incomeType.toLowerCase();

  if (!validTypes.includes(type)) {
    return { valid: false, type: null, error: `Invalid income type: ${incomeType} (must be one of: ${validTypes.join(', ')})` };
  }

  return { valid: true, type: type, error: null };
}

/**
 * Assert validation or throw error
 *
 * @param {Object} validationResult - Result from validation function
 * @throws {Error} If validation failed
 */
function assertValid(validationResult) {
  if (!validationResult.valid) {
    throw new Error(validationResult.error);
  }
}

module.exports = {
  validateYear,
  validateIncome,
  validateCountryCode,
  validateIncomeType,
  assertValid,
  SUPPORTED_YEARS
};
