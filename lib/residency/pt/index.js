/**
 * @module pt
 * Portugal-Specific Utilities Index
 *
 * Exports all Portugal tax residency utilities and the PortugalResidency class.
 */

const deductions = require('./deductions');
const foreignTaxCredit = require('./foreignTaxCredit');
const nhr = require('./nhr');
const progressive = require('./progressive');
const PortugalResidency = require('./residency');
const socialSecurity = require('./socialSecurity');
const solidarity = require('./solidarity');

module.exports = {
  ...deductions,
  ...nhr,
  ...progressive,
  ...socialSecurity,
  ...solidarity,
  ...foreignTaxCredit,
  PortugalResidency,
};
