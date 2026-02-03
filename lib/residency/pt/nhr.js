/**
 * @module nhr
 * NHR (Non-Habitual Resident) Status Tracker
 *
 * Pre-2024 regime only (IFICU/NHR 2.0 not included)
 */

function getNHRRegimeData(specialRegimesData) {
  const nhrData = specialRegimesData.find(r => r.RegimeName === 'NHR');
  if (!nhrData) {
    throw new Error('NHR regime data not found in SpecialRegimes');
  }
  return nhrData;
}

function isNHRActive(nhrStatusAcquiredDate, currentYear, specialRegimesData) {
  if (!nhrStatusAcquiredDate) return false;

  const nhrData = getNHRRegimeData(specialRegimesData);
  const durationYears = nhrData.DurationYears;

  const acquiredYear = new Date(nhrStatusAcquiredDate).getFullYear();
  const endYear = acquiredYear + durationYears;

  return currentYear < endYear;
}

function getNHRStatus(nhrStatusAcquiredDate, currentYear, specialRegimesData) {
  if (!nhrStatusAcquiredDate) {
    return { status: 'not_nhr', active: false };
  }

  const nhrData = getNHRRegimeData(specialRegimesData);
  const durationYears = nhrData.DurationYears;

  const acquiredYear = new Date(nhrStatusAcquiredDate).getFullYear();
  const endYear = acquiredYear + durationYears;
  const yearsActive = currentYear - acquiredYear;

  if (currentYear >= endYear) {
    return {
      status: 'expired',
      active: false,
      yearsActive: durationYears,
      expiredInYear: endYear,
    };
  }

  return {
    status: 'active',
    active: true,
    yearsActive: yearsActive + 1,
    remainingYears: durationYears - yearsActive,
    expiresInYear: endYear,
  };
}

function getNHRSavings(nhrTax, standardTax) {
  return standardTax - nhrTax;
}

module.exports = {
  isNHRActive,
  getNHRStatus,
  getNHRSavings,
  getNHRRegimeData,
};
