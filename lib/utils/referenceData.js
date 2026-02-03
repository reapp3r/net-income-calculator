/**
 * @module referenceData
 * Reference Data Matching Utilities
 *
 * Provides functions to match reference data records by year.
 * Reference data files contain historical values indexed by Year.
 * These utilities find the appropriate record for a given tax year.
 *
 * @example
 * // Get tax brackets for 2025 (uses most recent year <= 2025)
 * const brackets = getTemporalMatch(taxBracketsData, 2025);
 *
 * @example
 * const data = [
 *   { Year: 2023, Rate: 0.20 },
 *   { Year: 2024, Rate: 0.22 },
 *   { Year: 2025, Rate: 0.23 }
 * ];
 * getTemporalMatch(data, 2024); // Returns { Year: 2024, Rate: 0.22 }
 * getTemporalMatch(data, 2026); // Returns { Year: 2025, Rate: 0.23 } (most recent)
 */

/**
 * Get temporal match for reference data
 * Finds the most recent record where record.Year <= targetYear
 * Useful for tax rates, deductions that apply retroactively
 *
 * @param {Array} data - Reference data array with Year field
 * @param {number} year - Target year to match
 * @param {string} [filterKey] - Optional field to filter by (e.g., 'Country')
 * @param {string} [filterValue] - Optional value to filter by (e.g., 'PT')
 * @returns {Object|null} Matching record or null if none found
 *
 * @example
 * const data = [
 *   { Year: 2023, Rate: 0.20 },
 *   { Year: 2024, Rate: 0.22 },
 *   { Year: 2025, Rate: 0.23 }
 * ];
 * getTemporalMatch(data, 2024); // Returns { Year: 2024, Rate: 0.22 }
 * getTemporalMatch(data, 2026); // Returns { Year: 2025, Rate: 0.23 } (most recent)
 */
function getTemporalMatch(data, year, filterKey = null, filterValue = null) {
  if (!Array.isArray(data)) {
    throw new Error('data must be an array');
  }

  const subset = filterKey
    ? data.filter((r) => String(r[filterKey]) === String(filterValue))
    : data;

  if (!subset.length) {
    return null;
  }

  let best = null;
  for (const row of subset) {
    const rowYear = parseInt(row.Year);
    if (isNaN(rowYear)) {
      continue;
    }

    if (rowYear <= year) {
      best = row;
    } else {
      break;
    }
  }

  return best;
}

/**
 * Get exact match for reference data
 * Finds record with exact year match
 *
 * @param {Array} data - Reference data array with Year field
 * @param {number} year - Exact year to match
 * @param {string} [filterKey] - Optional field to filter by (e.g., 'Country')
 * @param {string} [filterValue] - Optional value to filter by (e.g., 'PT')
 * @returns {Object|null} Matching record or null if not found
 *
 * @example
 * const data = [
 *   { Year: 2023, Rate: 0.20 },
 *   { Year: 2024, Rate: 0.22 },
 *   { Year: 2025, Rate: 0.23 }
 * ];
 * getExactMatch(data, 2024); // Returns { Year: 2024, Rate: 0.22 }
 * getExactMatch(data, 2026); // Returns { Year: 2025, Rate: 0.23 }
 */
function getExactMatch(data, year, filterKey = null, filterValue = null) {
  if (!Array.isArray(data)) {
    throw new Error('data must be an array');
  }

  const subset = filterKey
    ? data.filter((r) => String(r[filterKey]) === String(filterValue))
    : data;

  return subset.find((r) => parseInt(r.Year) === year) || null;
}

module.exports = {
  getTemporalMatch,
  getExactMatch,
};
