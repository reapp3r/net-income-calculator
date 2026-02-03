const path = require('path');
const { loadData } = require('../../lib/loader');

function getTestReferenceData() {
  const dataDir = path.join(__dirname, '../test-data-cli');
  const data = loadData(dataDir);

  // Return just the reference data portion (without incomeRecords)
  // Tests will create proper structure: { incomeRecords, referenceData, exchangeRates }
  return {
    referenceData: data.referenceData,
    exchangeRates: data.exchangeRates,
    taxResidency: data.taxResidency,
    // For backward compatibility with direct property access tests
    taxBrackets: data.referenceData.PT.taxBrackets,
    socialSecurity: data.referenceData.PT.socialSecurity,
    solidarity: data.referenceData.PT.solidarityTax,
    specialRegimes: data.referenceData.PT.specialRegimes,
    deductions: data.referenceData.PT.deductions,
    foreignTaxCredit: data.referenceData.PT.foreignTaxCredit,
    simulationParameters: data.referenceData.PT.simulationParameters,
  };
}

module.exports = {
  getTestReferenceData,
};
