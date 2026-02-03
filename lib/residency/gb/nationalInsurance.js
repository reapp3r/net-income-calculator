/**
 * @module ukNationalInsurance
 * UK National Insurance Calculation
 *
 * Calculates UK National Insurance contributions for different income types.
 */

/**
 * Calculate UK National Insurance for employment income (Class 1)
 * @param {number} grossIncome - Gross employment income
 * @param {number} year - Tax year
 * @param {Array} niData - National Insurance data from reference files
 * @returns {number} NI amount
 */
function calculateUKEmploymentNI(grossIncome, year, niData) {
  const class1Data = niData.filter((ni) => ni.Year === year && ni.Class === 1);

  if (class1Data.length === 0) {
    throw new Error(`Class 1 NI data not found for year ${year}`);
  }

  let ni = 0;

  // Sort by threshold
  class1Data.sort((a, b) => parseFloat(a.Threshold) - parseFloat(b.Threshold));

  for (const band of class1Data) {
    const threshold = parseFloat(band.Threshold);
    const rate = parseFloat(band.Rate);
    const upperThreshold = parseFloat(band.UpperThreshold) || Infinity;

    // Calculate NI in this band
    const taxableInBand = Math.min(
      Math.max(0, grossIncome - threshold),
      upperThreshold - threshold
    );

    if (taxableInBand > 0) {
      ni += taxableInBand * rate;
    }
  }

  return ni;
}

/**
 * Calculate UK National Insurance for freelance income (Class 2 + Class 4)
 * @param {number} grossIncome - Gross freelance income
 * @param {number} year - Tax year
 * @param {Array} niData - National Insurance data from reference files
 * @returns {Object} NI breakdown {class2, class4, total}
 */
function calculateUKFreelanceNI(grossIncome, year, niData) {
  const class2Data = niData.find((ni) => ni.Year === year && ni.Class === 2);
  const class4Data = niData.filter((ni) => ni.Year === year && ni.Class === 4);

  if (!class2Data || class4Data.length === 0) {
    throw new Error(`Class 2 or Class 4 NI data not found for year ${year}`);
  }

  // Class 2: Weekly flat rate if profit exceeds small profit threshold
  const smallProfitThreshold = parseFloat(class2Data.SmallProfitThreshold);
  const weeklyRate = parseFloat(class2Data.WeeklyRate);
  const class2 = grossIncome > smallProfitThreshold ? weeklyRate * 52 : 0;

  // Class 4: Percentage of profits above thresholds
  let class4 = 0;
  class4Data.sort((a, b) => parseFloat(a.Threshold) - parseFloat(b.Threshold));

  for (const band of class4Data) {
    const threshold = parseFloat(band.Threshold);
    const rate = parseFloat(band.Rate);
    const upperThreshold = parseFloat(band.UpperThreshold) || Infinity;

    const taxableInBand = Math.min(
      Math.max(0, grossIncome - threshold),
      upperThreshold - threshold
    );

    if (taxableInBand > 0) {
      class4 += taxableInBand * rate;
    }
  }

  return {
    class2,
    class4,
    total: class2 + class4,
  };
}

module.exports = {
  calculateUKEmploymentNI,
  calculateUKFreelanceNI,
};
