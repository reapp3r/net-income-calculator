/**
 * Residency Registry
 *
 * Manages available tax residency implementations.
 * By default, uses Portugal (PT). Other residencies can be added.
 */

const PortugalResidency = require('./pt/residency');

/**
 * Get residency instance for a country code
 * @param {string} countryCode - Two-letter country code (ISO 3166-1 alpha-2)
 * @param {Object} referenceData - Tax reference data
 * @returns {TaxResidency} Residency implementation
 */
function getResidency(countryCode, referenceData) {
  const code = (countryCode || 'PT').toUpperCase();
  
  if (code === 'PT' || code === 'PORTUGAL') {
    const residency = new PortugalResidency(referenceData);
    return residency;
  }

  console.warn(`Unknown residency for country: ${code}, defaulting to Portugal`);
  const residency = new PortugalResidency(referenceData);
  return residency;
}

/**
 * Check if a residency is registered
 * @param {string} countryCode - Two-letter country code
 * @returns {boolean}
 */
function hasResidency(countryCode) {
  const code = countryCode.toUpperCase();
  return code === 'PT' || code === 'PORTUGAL';
}

module.exports = {
  getResidency,
  hasResidency,
  PortugalResidency
};
