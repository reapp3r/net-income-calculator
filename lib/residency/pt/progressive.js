/**
 * @module progressive
 * Progressive Tax Calculator
 *
 * Applies tax brackets to calculate tax liability
 */

function getTaxBrackets(year, taxBracketsData) {
  if (!year || typeof year !== 'number') {
    throw new Error(`Invalid year parameter: ${year}`);
  }

  if (!taxBracketsData || !Array.isArray(taxBracketsData)) {
    throw new Error('taxBracketsData must be an array');
  }

  const brackets = taxBracketsData
    .filter(b => b.Year === year)
    .map(b => ({
      min: b.BracketMin,
      max: b.BracketMax,
      rate: b.Rate
    }))
    .sort((a, b) => a.min - b.min);

  if (brackets.length === 0) {
    throw new Error(`No tax brackets found for year ${year} in reference data`);
  }

  return brackets;
}

function calculateProgressiveTax(taxableIncome, year, taxBracketsData) {
  if (!taxableIncome || taxableIncome <= 0) return 0;

  const brackets = getTaxBrackets(year, taxBracketsData);

  let tax = 0;
  let remaining = taxableIncome;

  for (const bracket of brackets) {
    const min = parseFloat(bracket.min) || 0;
    const max = bracket.max === null || bracket.max === undefined ? Infinity : parseFloat(bracket.max);
    const rate = parseFloat(bracket.rate) || 0;

    if (remaining <= 0) break;

    const bracketSize = max - min;
    const taxableInBracket = Math.min(remaining, bracketSize);

    if (taxableInBracket > 0) {
      tax += taxableInBracket * rate;
      remaining -= taxableInBracket;
    }
  }

  return tax;
}

module.exports = {
  calculateProgressiveTax,
  getTaxBrackets
};
