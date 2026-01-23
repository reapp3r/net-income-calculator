/**
 * Generic Utility Modules Index
 *
 * Utilities that are country-agnostic and can be used by any residency.
 */

const currency = require('./currency');
const validation = require('./validation');

module.exports = {
  ...currency,
  ...validation
};
