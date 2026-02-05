/**
 * @module deductions
 * Personal Deductions Calculator
 *
 * Applies personal deductions (Deduções à Coleta) to reduce final tax
 *
 * Categories:
 * - Specific Deduction (Employment)
 * - Health Expenses (with documentation)
 * - Education Expenses (with documentation)
 * - Housing (Habitacional)
 * - IVA (VAT): percentage of documented expenses
 * - IVA Books & Culture: VAT on books, theatre, concerts, museums
 *
 * NOTE: Uses standard specific deduction. Does not account for
 * increased deduction when professional association fees are paid.
 */

const { getTemporalMatch } = require('../../temporal');

function getDeductionDataForYear(year, deductionsData) {
  const data = getTemporalMatch(deductionsData, year);
  if (!data) {
    throw new Error(`No deductions data found for year ${year}`);
  }
  return data;
}

function getPersonalDeductionsForMonth(year, month, personalDeductionsData) {
  const deduction = personalDeductionsData.find(
    d => d.Year === year && d.Month === month
  );

  if (!deduction) {
    return {
      healthExpenses: 0,
      educationExpenses: 0,
      housingDeduction: 0,
      ivaDeduction: 0,
      ivaBooksCulture: 0,
      otherDeduction: 0,
    };
  }

  return {
    healthExpenses: deduction.HealthExpenses || 0,
    educationExpenses: deduction.EducationExpenses || 0,
    housingDeduction: deduction.HousingExpenses || 0,
    ivaDeduction: deduction.IVAGeneral || 0,
    ivaBooksCulture: deduction.IVABooksCulture || 0,
    otherDeduction: deduction.OtherDeductions || 0,
  };
}

function getHousingDeductionMax(year, deductionsData) {
  const data = getDeductionDataForYear(year, deductionsData);
  return data.HousingMax;
}

function getSpecificDeduction(year, deductionsData) {
  const data = getDeductionDataForYear(year, deductionsData);
  return data.SpecificDeduction;
}

function getIVABooksCultureRate(year, deductionsData) {
  const data = getDeductionDataForYear(year, deductionsData);
  return data.IVABooksRate;
}

function getGlobalDeductionCap(year, deductionsData) {
  const data = getDeductionDataForYear(year, deductionsData);
  return data.GlobalDeductionCap || 0;
}

function applyDeductions(taxAmount, deductions) {
  if (!deductions || deductions <= 0) return 0;
  return Math.min(taxAmount, deductions);
}

function calculateSpecificDeduction(employmentGross, year, deductionsData) {
  const deduction = getSpecificDeduction(year, deductionsData);
  return Math.min(deduction, employmentGross);
}

function applyAllDeductions(
  taxAmount,
  deductionBreakdown,
  year,
  deductionsData
) {
  const housingMax = getHousingDeductionMax(year, deductionsData);

  const total = {
    specificDeduction: 0,
    healthExpenses: 0,
    educationExpenses: 0,
    housingDeduction: 0,
    ivaDeduction: 0,
    ivaBooksCulture: 0,
    otherDeduction: 0,
    totalDeductions: 0,
    finalTax: taxAmount,
  };

  if (!deductionBreakdown || taxAmount <= 0) return total;

  // Apply specific deduction (employment)
  if (deductionBreakdown.specificDeduction) {
    total.specificDeduction = Math.min(
      deductionBreakdown.specificDeduction,
      taxAmount
    );
    total.finalTax -= total.specificDeduction;
  }

  // Apply health expenses
  if (deductionBreakdown.healthExpenses) {
    total.healthExpenses = Math.min(
      deductionBreakdown.healthExpenses,
      taxAmount - total.finalTax
    );
    total.finalTax -= total.healthExpenses;
  }

  // Apply education expenses
  if (deductionBreakdown.educationExpenses) {
    total.educationExpenses = Math.min(
      deductionBreakdown.educationExpenses,
      taxAmount - total.finalTax
    );
    total.finalTax -= total.educationExpenses;
  }

  // Apply housing deduction
  if (deductionBreakdown.housingDeduction) {
    total.housingDeduction = Math.min(
      deductionBreakdown.housingDeduction,
      housingMax,
      taxAmount - total.finalTax
    );
    total.finalTax -= total.housingDeduction;
  }

  // Apply IVA deduction
  if (deductionBreakdown.ivaDeduction) {
    total.ivaDeduction = Math.min(
      deductionBreakdown.ivaDeduction,
      taxAmount - total.finalTax
    );
    total.finalTax -= total.ivaDeduction;
  }

  // Apply IVA Books & Culture
  if (deductionBreakdown.ivaBooksCulture) {
    const rate = getIVABooksCultureRate(year, deductionsData);
    if (rate > 0) {
      const ivaBooksAmount = deductionBreakdown.ivaBooksCulture * rate;
      total.ivaBooksCulture = Math.min(
        ivaBooksAmount,
        taxAmount - total.finalTax
      );
      total.finalTax -= total.ivaBooksCulture;
    }
  }

  // Apply other deductions
  if (deductionBreakdown.otherDeduction) {
    total.otherDeduction = Math.min(
      deductionBreakdown.otherDeduction,
      taxAmount - total.finalTax
    );
    total.finalTax -= total.otherDeduction;
  }

  // Calculate sum of personal deductions (excluding specific deduction)
  const personalDeductionsSum =
    total.healthExpenses +
    total.educationExpenses +
    total.housingDeduction +
    total.ivaDeduction +
    total.ivaBooksCulture +
    total.otherDeduction;

  // Apply global deduction cap (Limite Global - Artigo 78.º-A)
  // The cap applies to the total of health, education, housing, IVA, and other deductions
  const globalCap = getGlobalDeductionCap(year, deductionsData);

  if (globalCap > 0 && personalDeductionsSum > globalCap) {
    // Calculate excess over cap
    const excess = personalDeductionsSum - globalCap;

    // Scale down all personal deductions proportionally to fit within cap
    const scaleFactor = globalCap / personalDeductionsSum;

    total.healthExpenses =
      Math.floor(total.healthExpenses * scaleFactor * 100) / 100;
    total.educationExpenses =
      Math.floor(total.educationExpenses * scaleFactor * 100) / 100;
    total.housingDeduction =
      Math.floor(total.housingDeduction * scaleFactor * 100) / 100;
    total.ivaDeduction =
      Math.floor(total.ivaDeduction * scaleFactor * 100) / 100;
    total.ivaBooksCulture =
      Math.floor(total.ivaBooksCulture * scaleFactor * 100) / 100;
    total.otherDeduction =
      Math.floor(total.otherDeduction * scaleFactor * 100) / 100;

    // Recalculate final tax with capped deductions
    total.finalTax = taxAmount - total.specificDeduction - globalCap;
  }

  // Calculate total deductions
  total.totalDeductions =
    total.specificDeduction +
    total.healthExpenses +
    total.educationExpenses +
    total.housingDeduction +
    total.ivaDeduction +
    total.ivaBooksCulture +
    total.otherDeduction;

  return total;
}

module.exports = {
  applyDeductions,
  calculateSpecificDeduction,
  applyAllDeductions,
  getHousingDeductionMax,
  getSpecificDeduction,
  getIVABooksCultureRate,
  getGlobalDeductionCap,
  getDeductionDataForYear,
  getPersonalDeductionsForMonth,
};
