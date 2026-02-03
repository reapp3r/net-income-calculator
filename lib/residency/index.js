/**
 * Residency Registry
 *
 * Manages available tax residency implementations.
 * Uses strict ISO 3166-1 alpha-2 country codes only.
 * No fallbacks or country names.
 */

const PortugalResidency = require('./pt/residency');
const GBResidency = require('./gb/residency');
const { TaxResidency } = require('./base');
const { validateCountryCode } = require('../utils/validation');

/**
 * Available residency implementations
 *
 * @returns {Array} List of supported country codes
 */
const AVAILABLE_COUNTRIES = ['PT', 'GB', 'DE'];

/**
 * Get residency implementation for country
 *
 * @param {string} countryCode - ISO 3166-1 alpha-2 code
 * @param {Object} referenceData - Tax reference data
 * @returns {TaxResidency} Residency implementation
 * @throws {Error} If unsupported country or implementation not found
 */
function getResidency(countryCode, referenceData) {
  validateCountryCode(countryCode);

  const normalized = countryCode.toUpperCase();

  // Check if country code is supported
  if (!AVAILABLE_COUNTRIES.includes(normalized)) {
    throw new Error(
      `Unsupported country: ${countryCode}. Available countries: ${AVAILABLE_COUNTRIES.join(', ')}`
    );
  }

  const residencyMap = {
    PT: PortugalResidency,
    GB: GBResidency,
  };

  const ResidencyClass = residencyMap[normalized];
  if (ResidencyClass) {
    return new ResidencyClass(referenceData);
  }

  throw new Error(`Implementation missing for supported country: ${normalized}`);
}

/**
 * Check if residency implementation exists for country
 *
 * @param {string} countryCode - ISO 3166-1 alpha-2 code
 * @returns {boolean} True if supported
 * @throws {Error} If unsupported country or implementation not found
 */
function hasResidency(countryCode) {
  return AVAILABLE_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * List all available countries
 *
 * @returns {Array} Array of supported country codes
 * @throws {Error} If error occurs
 */
function listAvailableCountries() {
  return [...AVAILABLE_COUNTRIES];
}

module.exports = {
  getResidency,
  hasResidency,
  listAvailableCountries,
  PortugalResidency,
  GBResidency,
};
