/**
 * Currency Converter
 * Converts foreign currency amounts to EUR using provided exchange rate
 */

function convertToEUR(grossIncome, exchangeRate = 1.0) {
  if (!grossIncome || grossIncome <= 0) return 0;
  return grossIncome * (parseFloat(exchangeRate) || 1.0);
}

module.exports = {
  convertToEUR
};
