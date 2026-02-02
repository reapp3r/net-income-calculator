/**
 * @module validation
 * Input Validation Utilities
 * 
 * Provides validation functions for common input parameters
 * to ensure data integrity and catch errors early.
 */

/**
 * Validate ISO 3166-1 alpha-2 country code
 * 
 * @param {string} code - Country code to validate
 * @param {Array} validCodes - List of valid codes (optional)
 * @returns {Object} Validation result { valid, code, error }
 * 
 * @example
 * validateCountryCode('PT'); // ✅ Returns 'PT'
 * validateCountryCode('UK'); // ✅ Returns 'GB'
 * validateCountryCode('portugal'); // ❌ Throws error
 */
function validateCountryCode(code, validCodes = null) {
  if (!code || typeof code !== 'string') {
    throw new Error(`Invalid country code: ${code}`);
  }
  
  const normalized = code.toUpperCase();
  
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new Error(
      `Invalid country code format: ${code}. ` +
      `Must be ISO 3166-1 alpha-2 (e.g., PT, GB, DE)`
    );
  }
  
  if (validCodes && !validCodes.includes(normalized)) {
    return { valid: false, code: null, error: `Unsupported country: ${code}` };
  }
  
  return { valid: true, code: normalized, error: null };
}

/**
 * Validate ISO 8601 date format
 * 
 * @param {string} dateStr - Date string to validate
 * @returns {Date} Parsed date
 * @throws {Error} If date is invalid
 * 
 * @example
 * validateDate('2025-01-15'); // ✅ Returns Date object
 * validateDate('15-01-2025'); // ❌ Throws error
 */
function validateDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Must be YYYY-MM-DD`);
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  
  return date;
}

/**
 * Validate numeric amount (positive)
 * 
 * @param {number} amount - Amount to validate
 * @param {string} fieldName - Field name for error messages
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} True if valid
 * @throws {Error} If amount is invalid
 * 
 * @example
 * validateAmount(1000, 'GrossIncome'); // ✅ Returns true
 * validateAmount(-100, 'Amount'); // ❌ Throws error
 */
function validateAmount(amount, fieldName, min = 0, max = null) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error(`Invalid ${fieldName}: must be a number`);
  }
  
  if (amount <= 0) {
    throw new Error(`Invalid ${fieldName}: must be positive`);
  }
  
  if (min !== null && amount < min) {
    throw new Error(`Invalid ${fieldName}: must be at least ${min}`);
  }
  
  if (max !== null && amount > max) {
    throw new Error(`Invalid ${fieldName}: must be at most ${max}`);
  }
  
  return true;
}

/**
 * Validate income type
 * 
 * @param {string} incomeType - Income type to validate
 * @param {Array} validTypes - List of valid types
 * @returns {Object} Validation result { valid, type, error }
 * 
 * @example
 * validateIncomeType('employment'); // ✅ Returns 'employment'
 * validateIncomeType('freelance'); // ✅ Returns 'freelance'
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
  validateCountryCode,
  validateDate,
  validateAmount,
  validateIncomeType,
  assertValid
};