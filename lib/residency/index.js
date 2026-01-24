/**
 * Residency Registry
 *
 * Manages available tax residency implementations.
 * By default, uses Portugal (PT). Other residencies can be added.
 */

const PortugalResidency = require('./pt/residency');
const GBResidency = require('./gb/residency');

/**
 * Get residency instance for a country code
 * @param {string} countryCode - Two-letter country code (ISO 3166-1 alpha-2)
 * @param {Object} referenceData - Tax reference data
 * @returns {TaxResidency} Residency implementation
 */
function getResidency(countryCode, referenceData) {
  const code = (countryCode || 'PT').toUpperCase();
  
  if (code === 'PT' || code === 'PORTUGAL') {
    return new PortugalResidency(referenceData);
  }
  
  if (code === 'GB' || code === 'UK' || code === 'UNITEDKINGDOM') {
    return new GBResidency(referenceData);
  }

  console.warn(`Unknown residency for country: ${code}, defaulting to Portugal`);
  return new PortugalResidency(referenceData);
}

/**
 * Check if a residency is registered
 * @param {string} countryCode - Two-letter country code
 * @returns {boolean}
 */
function hasResidency(countryCode) {
  const code = countryCode.toUpperCase();
  return ['PT', 'PORTUGAL', 'GB', 'UK', 'UNITEDKINGDOM'].includes(code);
}

module.exports = {
  getResidency,
  hasResidency,
  PortugalResidency,
  GBResidency
};
