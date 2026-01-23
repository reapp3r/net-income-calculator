/**
 * @module pt
 * Portugal-Specific Utilities Index
 *
 * Exports all Portugal tax residency utilities and the PortugalResidency class.
 */

const deductions = require('./deductions');
const nhr = require('./nhr');
const progressive = require('./progressive');
const socialSecurity = require('./socialSecurity');
const solidarity = require('./solidarity');
const foreignTaxCredit = require('./foreignTaxCredit');
const PortugalResidency = require('./residency');

module.exports = {
  ...deductions,
  ...nhr,
  ...progressive,
  ...socialSecurity,
  ...solidarity,
  ...foreignTaxCredit,
  PortugalResidency
};