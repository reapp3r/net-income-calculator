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
  getDeductionDataForYear,
  getPersonalDeductionsForMonth,
};
