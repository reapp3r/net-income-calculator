/**
 * @module net-income-calculator
 * Multi-country Net Income Calculation Library
 *
 * Calculation functions for net income with multi-country tax residency support.
 * Uses residency abstraction to support different tax regimes.
 */

const calculator = require('./calculator');
const residency = require('./residency');
const loader = require('./loader');
const temporal = require('./temporal');

module.exports = {
  calculateNetIncome: calculator.calculateNetIncome,
  loadData: loader.loadData,
  parseCSV: loader.parseCSV,
  getTemporalMatch: temporal.getTemporalMatch,
  getExactMatch: temporal.getExactMatch,
  ...residency,
};
