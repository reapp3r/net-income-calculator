/**
 * @module solidarity
 * Solidarity Tax Calculator
 *
 * Applies additional rates for high earners based on thresholds from reference data
 */

function calculateSolidarityTax(taxableIncome, year, solidarityData) {
  if (!taxableIncome || taxableIncome <= 0) {
    return 0;
  }

  if (!solidarityData || !Array.isArray(solidarityData)) {
    return 0;
  }

  const solData = solidarityData.find(s => s.Year == year);
  if (!solData) {
    throw new Error(`No solidarity tax data found for year ${year}`);
  }

  const threshold1 = solData.Threshold1;
  const rate1 = solData.Rate1;
  const threshold2 = solData.Threshold2;
  const rate2 = solData.Rate2;

  if (taxableIncome <= threshold1) {
    return 0;
  }

  let solidarity = 0;

  if (taxableIncome > threshold2) {
    solidarity += (taxableIncome - threshold2) * rate2;
    solidarity += (threshold2 - threshold1) * rate1;
  } else {
    solidarity += (taxableIncome - threshold1) * rate1;
  }

  return solidarity;
}

module.exports = {
  calculateSolidarityTax,
};
