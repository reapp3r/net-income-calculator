/**
 * @module loader
 * Data Loading and Parsing Module
 *
 * Loads CSV data files from the filesystem using a strict multi-country directory structure:
 * - **Global files**: ExchangeRates.csv, Location.csv, etc. at the root level
 * - **Country directories**: ISO 3166-1 alpha-2 codes (PT, GB, DE) containing:
 *   - Income.csv (required)
 *   - TaxBrackets.csv and other reference CSV files
 *
 * Handles CSV parsing and type conversion for tax reference data
 * (brackets, rates, deductions, etc.).
 *
 * @example
 * const { loadData } = require('./lib/loader');
 *
 * // Load multi-country data
 * const data = loadData('./data');
 * console.log(data.referenceData); // { PT: {...}, GB: {...} }
 * console.log(data.incomeRecords); // Array of income records
 */

const fs = require('fs');
const path = require('path');

/**
 * Load all data from a data directory.
 *
 * Expects a strict directory structure:
 * - Global CSV files (ExchangeRates.csv, Location.csv, etc.) at the root
 * - Country subdirectories with ISO 3166-1 alpha-2 codes (PT, GB, DE)
 * - Each country directory must contain Income.csv and tax reference files
 *
 * @param {string} dataPath - Path to data directory
 * @returns {Object} Complete dataset with:
 *   - `incomeRecords`: {Array} Parsed income records
 *   - `exchangeRates`: {Array} Parsed exchange rate records
 *   - `referenceData`: {Object} Country-specific tax data keyed by ISO code
 * @throws {Error} If data directory not found or no valid country directories found
 *
 * @example
 * const data = loadData('./data');
 * // Returns { incomeRecords: [...], referenceData: { PT: {...}, GB: {...} }, ... }
 */
function loadData(dataPath) {
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data directory not found: ${dataPath}`);
  }

  const incomeRecords = [];
  const referenceData = {};
  const entries = fs.readdirSync(dataPath, { withFileTypes: true });

  // 1. Load Global CSVs (ExchangeRates.csv, Location.csv, etc.)
  const exchangeRatesFile = path.join(dataPath, 'ExchangeRates.csv');
  const exchangeRates = fs.existsSync(exchangeRatesFile)
    ? parseCSV(fs.readFileSync(exchangeRatesFile, 'utf8'))
    : [];

  // 2. Scan for Country Directories (ISO 3166-1 alpha-2 codes)
  for (const entry of entries) {
    // STRICT CHECK: Only process directories with 2-letter uppercase names (ISO codes)
    if (entry.isDirectory() && /^[A-Z]{2}$/.test(entry.name)) {
      const countryCode = entry.name;
      const countryDir = path.join(dataPath, countryCode);

      // A. Load Reference Data (TaxBrackets.csv, etc.) from inside countryDir
      referenceData[countryCode] = loadCountryReferenceData(countryDir);

      // B. Load Income.csv from inside countryDir
      const incomeFile = path.join(countryDir, 'Income.csv');
      if (fs.existsSync(incomeFile)) {
        const countryIncome = parseCSV(fs.readFileSync(incomeFile, 'utf8'));
        // Normalize and augment income records for calculator compatibility
        countryIncome.forEach(record => {
          // Add SourceCountry if missing
          if (!record.SourceCountry) {
            record.SourceCountry = countryCode;
          }
          // Normalize fields - keep original uppercase fields and add lowercase aliases
          record.amount = record.GrossIncome ?? record.Amount ?? record.amount;
          record.currency = record.SourceCurrency ?? record.Currency ?? record.currency ?? 'EUR';
          record.incomeType = record.IncomeType ?? record.incomeType ?? 'employment';
          // Add lowercase aliases for calculator compatibility
          record.sourceCountry = record.SourceCountry;
          record.year = record.Year ?? record.year;
          record.month = record.Month ?? record.month;
          record.day = record.Day ?? record.day ?? 15;
        });
        incomeRecords.push(...countryIncome);
      }
    }
  }

  if (incomeRecords.length === 0) {
    throw new Error(`No Income.csv files found in country subdirectories. Expected structure: ${dataPath}/{PT,GB,DE}/Income.csv`);
  }

  return {
    incomeRecords,
    exchangeRates,
    referenceData
  };
}

/**
 * Load all CSV reference data for a country from a directory.
 *
 * Reads all CSV files (except Income.csv, Residency.csv, ExchangeRates.csv)
 * and parses them into objects. Converts filenames to camelCase keys:
 * - `TaxBrackets.csv` → `taxBrackets`
 * - `SocialSecurity.csv` → `socialSecurity`
 * - `PT_TaxBrackets.csv` → `taxBrackets` (prefix stripped)
 *
 * @param {string} dir - Path to country directory containing CSV files
 * @returns {Object} Parsed data keyed by CSV filename (camelCase)
 *
 * @example
 * const refData = loadCountryReferenceData('./data/PT');
 * // Returns { taxBrackets: [...], socialSecurity: [...], deductions: [...], ... }
 */
function loadCountryReferenceData(dir) {
    const files = fs.readdirSync(dir);
    const data = {};
    for (const file of files) {
        if (file.endsWith('.csv') && file !== 'Income.csv' && file !== 'Residency.csv' && file !== 'ExchangeRates.csv') {
            const name = path.basename(file, '.csv');
            // Remove country prefix if present (PT_TaxBrackets → TaxBrackets)
            const cleanName = name.replace(/^[A-Z]{2}_/, '');

            // Normalize keys to camelCase
            const key = cleanName.charAt(0).toLowerCase() + cleanName.slice(1);
            data[key] = parseCSV(fs.readFileSync(path.join(dir, file), 'utf8'));
        }
    }
    return data;
}

/**
 * Parse CSV content into array of objects.
 *
 * Simple CSV parser that:
 * - Splits on commas (doesn't handle quoted commas)
 * - Converts numbers (e.g., "123.45" → 123.45)
 * - Converts booleans ("true"/"false" → true/false)
 * - Preserves strings as-is
 * - Empty strings become null
 *
 * @param {string} content - CSV file content as string
 * @returns {Array} Array of row objects with keys from CSV header
 * @throws {Error} If content has fewer than 2 lines (no data)
 *
 * @example
 * const csv = "Year,Rate\n2025,0.15\n2026,0.16";
 * const data = parseCSV(csv);
 * // Returns [{ Year: 2025, Rate: 0.15 }, { Year: 2026, Rate: 0.16 }]
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
      // Handle simple CSV splitting (doesn't handle quoted commas)
      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, i) => {
          // Try to convert numbers
          const val = values[i];
          if (val === undefined) return;

          if (val === '') {
              row[h] = null;
          } else if (!isNaN(val)) {
              row[h] = Number(val);
          } else if (val.toLowerCase() === 'true') {
              row[h] = true;
          } else if (val.toLowerCase() === 'false') {
              row[h] = false;
          } else {
              row[h] = val;
          }
      });
      return row;
  });
}

module.exports = {
  loadData,
  parseCSV
};
