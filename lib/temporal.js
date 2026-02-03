/**
 * @module temporal
 * Temporal Data Matching Utilities
 *
 * Functions for finding records that match a given year from time-series data.
 * Used throughout the codebase for tax bracket rates, social security rates,
 * deductions, and other year-based reference data.
 *
 * @example
 * const brackets = [
 *   { Year: 2023, Rate: 0.15 },
 *   { Year: 2024, Rate: 0.16 },
 *   { Year: 2025, Rate: 0.17 }
 * ];
 * const bracket2025 = getTemporalMatch(brackets, 2025); // Returns 2025 bracket
 * const bracket2024 = getTemporalMatch(brackets, 2024); // Returns 2024 bracket
 */

/**
 * Find the best matching record for a given year from time-series data.
 *
 * Returns the most recent record where `Year <= targetYear`. This is useful
 * for finding applicable tax rates, brackets, or deductions for a specific tax year.
 * Data must be sorted by year in ascending order.
 *
 * @param {Array} data - Array of records with a `Year` property
 * @param {number} year - Target year to find match for
 * @param {string} [filterKey=null] - Optional key to filter by (e.g., 'IncomeType')
 * @param {*} [filterValue=null] - Value to filter by
 * @returns {Object|null} Best matching record, or null if no match found
 *
 * @example
 * const data = [
 *   { Year: 2024, Rate: 0.14 },
 *   { Year: 2025, Rate: 0.145 },
 *   { Year: 2026, Rate: 0.15 }
 * ];
 *
 * getTemporalMatch(data, 2025); // Returns { Year: 2025, Rate: 0.145 }
 * getTemporalMatch(data, 2025, 'Rate', 0.14); // Returns null (filter doesn't match)
 * getTemporalMatch(data, 2027); // Returns { Year: 2026, Rate: 0.15 } (most recent)
 * getTemporalMatch(data, 2023); // Returns null (no records before 2023)
 */
function getTemporalMatch(data, year, filterKey = null, filterValue = null) {
  if (!Array.isArray(data)) {
    throw new Error('data must be an array');
  }

  let subset = filterKey ? data.filter(r => String(r[filterKey]) === String(filterValue)) : data;

  if (!subset.length) {
    return null;
  }

  let best = null;
  for (const row of subset) {
    const rowYear = parseInt(row.Year);
    if (isNaN(rowYear)) continue;

    // Found the best match (most recent record <= target year)
    if (rowYear <= year) {
      best = row;
    } else {
      // Data is sorted, so we can stop
      break;
    }
  }

  return best;
}

/**
 * Find an exact year match from time-series data.
 *
 * Returns only records where `Year === targetYear`. Use this when you need
 * an exact match rather than the most recent applicable record.
 *
 * @param {Array} data - Array of records with a `Year` property
 * @param {number} year - Target year to match exactly
 * @param {string} [filterKey=null] - Optional key to filter by
 * @param {*} [filterValue=null] - Value to filter by
 * @returns {Object|null} Exact match, or null if no match found
 *
 * @example
 * const data = [
 *   { Year: 2024, Rate: 0.14 },
 *   { Year: 2025, Rate: 0.145 },
 *   { Year: 2026, Rate: 0.15 }
 * ];
 *
 * getExactMatch(data, 2025); // Returns { Year: 2025, Rate: 0.145 }
 * getExactMatch(data, 2027); // Returns null (no exact match)
 * getExactMatch(data, 2024, 'Rate', 0.145); // Returns null (filter doesn't match)
 */
function getExactMatch(data, year, filterKey = null, filterValue = null) {
  if (!Array.isArray(data)) {
    throw new Error('data must be an array');
  }

  let subset = filterKey ? data.filter(r => String(r[filterKey]) === String(filterValue)) : data;

  return subset.find(r => parseInt(r.Year) === year) || null;
}

module.exports = {
  getTemporalMatch,
  getExactMatch
};
