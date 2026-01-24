/**
 * @module gb
 * UK-Specific Utilities Index
 *
 * Exports all UK tax residency utilities and the GBResidency class.
 */

const deductions = require('./deductions');
const nationalInsurance = require('./nationalInsurance');
const progressive = require('./progressive');
const GBResidency = require('./residency');

module.exports = {
  ...deductions,
  ...nationalInsurance,
  ...progressive,
  GBResidency
};