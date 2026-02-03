/**
 * @module loader
 * Data Loading and Parsing Module
 *
 * Loads CSV data files from the filesystem and supports multiple data structures:
 * - **Multi-country structure**: `references/{XX}/` subdirectories with country-specific data
 * - **Legacy structure**: Single-country directories with prefixed files (PT_TaxBrackets.csv)
 *
 * Handles automatic detection of data structure, CSV parsing, and type conversion
 * for tax reference data (brackets, rates, deductions, etc.).
 *
 * @example
 * const { loadData } = require('./lib/loader');
 *
 * // Load multi-country data
 * const data = loadData('./data');
 * console.log(data.referenceData); // { PT: {...}, GB: {...} }
 * console.log(data.incomeRecords); // Array of income records
 *
 * @example
 * // Load legacy Portugal data
 * const legacyData = loadData('./data/portugal');
 * console.log(legacyData.referenceData.PT); // Portuguese tax data
 */

const fs = require('fs');
const path = require('path');

/**
 * Load all data from a data directory.
 *
 * Automatically detects whether the directory structure is:
 * - **Multi-country**: Has `Income.csv` and `references/{XX}/` subdirectories
 * - **Legacy**: Single-country directory with `Income.csv`
 *
 * @param {string} dataPath - Path to data directory
 * @returns {Object} Complete dataset with:
 *   - `incomeRecords`: {Array} Parsed income records
 *   - `exchangeRates`: {Array} Parsed exchange rate records
 *   - `referenceData`: {Object} Country-specific tax data keyed by ISO code
 *   - `taxResidency`: {Object} Residency determination data
 * @throws {Error} If data directory not found or structure cannot be detected
 *
 * @example
 * const data = loadData('./data/PT');
 * // Returns { incomeRecords: [...], referenceData: { PT: {...} }, ... }
 */
function loadData(dataPath) {
  // Validate input path
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data directory not found: ${dataPath}`);
  }

  const structure = detectDataStructure(dataPath);

  if (structure.type === 'multi-country') {
    return loadMultiCountryStructure(dataPath, structure);
  } else {
    return loadLegacyData(dataPath, structure);
  }
}

/**
 * Detect the data structure type of a directory.
 *
 * Checks for:
 * 1. Multi-country: `Income.csv` + `references/` dir or `TaxResidency.csv`
 * 2. Legacy: Country subdirs (pt, uk, de, portugal) with `Income.csv`
 * 3. Direct: Current directory is a country dir with `Income.csv`
 *
 * @param {string} dataPath - Path to data directory
 * @returns {Object} Structure detection result with properties:
 *   - `type`: {'multi-country'|'legacy'}
 *   - For multi-country: `globalIncomeFile`, `residencyFile`, `referencesDir`
 *   - For legacy: `countryDir`, `countryCode`, `incomeFile`
 * @throws {Error} If structure cannot be detected
 *
 * @example
 * detectDataStructure('./data/PT');
 * // Returns { type: 'legacy', countryDir: './data/PT', countryCode: 'PT', ... }
 */
function detectDataStructure(dataPath) {
  const incomeFile = path.join(dataPath, 'Income.csv');
  const residencyCsv = fs.existsSync(path.join(dataPath, 'Residency.csv')) ? 'Residency.csv' : 'TaxResidency.csv';
  const referencesDir = path.join(dataPath, 'references');

  // Check for multi-country structure
  if (fs.existsSync(incomeFile) && (fs.existsSync(referencesDir) || fs.existsSync(path.join(dataPath, residencyCsv)))) {
    return {
      type: 'multi-country',
      globalIncomeFile: incomeFile,
      residencyFile: path.join(dataPath, residencyCsv),
      referencesDir: fs.existsSync(referencesDir) ? referencesDir : dataPath
    };
  }

  // Check for legacy single-country structure
  const legacyDirs = ['portugal', 'pt', 'uk', 'de'];
  for (const dir of legacyDirs) {
    const legacyPath = path.join(dataPath, dir);
    if (fs.existsSync(legacyPath)) {
       // Check inside the country dir
       const incomeFileLegacy = path.join(legacyPath, 'Income.csv');
       if (fs.existsSync(incomeFileLegacy)) {
           return {
               type: 'legacy',
               countryDir: legacyPath,
               countryCode: detectCountryPrefix(legacyPath) || 'PT', // Default to PT
               incomeFile: incomeFileLegacy
           };
       }
    }
  }

  // Also check if dataPath itself is the country dir
  const incomeFileDirect = path.join(dataPath, 'Income.csv');
  if (fs.existsSync(incomeFileDirect)) {
      const prefix = detectCountryPrefix(dataPath);
      if (prefix) {
          return {
              type: 'legacy',
              countryDir: dataPath,
              countryCode: prefix,
              incomeFile: incomeFileDirect
          };
      }
  }

  // Fallback: if we have Income.csv but no clear structure, assume legacy PT
  if (fs.existsSync(incomeFileDirect)) {
    return {
          type: 'legacy',
          countryDir: dataPath,
          countryCode: 'PT',
          incomeFile: incomeFileDirect
    };
  }

  throw new Error(`Cannot detect data structure in ${dataPath}`);
}

/**
 * Detect ISO country prefix from filenames in a directory.
 *
 * Looks for files matching pattern `{XX}_filename.csv` where XX is a
 * 2-3 letter ISO country code (e.g., PT_TaxBrackets.csv, GB_Rates.csv).
 *
 * @param {string} directoryPath - Path to directory to scan
 * @returns {string|null} Country code prefix if found, null otherwise
 *
 * @example
 * detectCountryPrefix('./data/PT');
 * // Returns 'PT' if PT_TaxBrackets.csv exists
 * detectCountryPrefix('./data/GB');
 * // Returns 'GB' if GB_Rates.csv exists
 */
function detectCountryPrefix(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);
    const prefixPattern = /^([A-Z]{2,3})_/;
    for (const file of files) {
        const match = file.match(prefixPattern);
        if (match) {
        return match[1];
        }
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Load multi-country data structure.
 *
 * Loads income from `Income.csv` and reference data from `references/{XX}/` subdirectories.
 * Each country subdirectory should contain CSV files with tax data.
 *
 * @param {string} dataPath - Path to data directory
 * @param {Object} structure - Detected structure from `detectDataStructure()`
 * @returns {Object} Dataset with `incomeRecords`, `referenceData`, `exchangeRates`, `taxResidency`
 *
 * @example
 * // Directory structure:
 * // data/
 * //   Income.csv
 * //   ExchangeRates.csv
 * //   references/
 * //     PT/TaxBrackets.csv
 * //     GB/TaxBrackets.csv
 *
 * const data = loadMultiCountryStructure('./data', structure);
 * // Returns { incomeRecords: [...], referenceData: { PT: {...}, GB: {...} }, ... }
 */
function loadMultiCountryStructure(dataPath, structure) {
    const incomeRecords = parseCSV(fs.readFileSync(structure.globalIncomeFile, 'utf8'));

    // Load residency data if exists
    let taxResidency = {};
    if (fs.existsSync(structure.residencyFile)) {
        // We can parse it if needed, but for now just pass raw data if needed?
        // Or specific format.
    }

    // Load Reference Data
    const referenceData = {};
    const refDir = structure.referencesDir;

    if (fs.existsSync(refDir)) {
        // If 'references' dir exists, look for country subdirs
        const entries = fs.readdirSync(refDir);
        for (const entry of entries) {
            const entryPath = path.join(refDir, entry);
            if (fs.statSync(entryPath).isDirectory()) {
                referenceData[entry.toUpperCase()] = loadCountryReferenceData(entryPath);
            }
        }
    }

    // Also load ExchangeRates.csv if exists
    const exchangeRatesFile = path.join(dataPath, 'ExchangeRates.csv');
    const exchangeRates = fs.existsSync(exchangeRatesFile) ? parseCSV(fs.readFileSync(exchangeRatesFile, 'utf8')) : [];

    return {
        incomeRecords, // Array
        exchangeRates,
        referenceData,
        taxResidency
    };
}

/**
 * Load legacy single-country data structure.
 *
 * Loads income and reference data from a single-country directory.
 * Normalizes field names (GrossIncome → amount, IncomeType → incomeType, etc.)
 * and adds default country codes if missing.
 *
 * @param {string} dataPath - Path to data directory
 * @param {Object} structure - Detected structure from `detectDataStructure()`
 * @returns {Object} Dataset with `incomeRecords`, `referenceData` (single country)
 *
 * @example
 * // Directory structure:
 * // data/portugal/
 * //   Income.csv
 * //   PT_TaxBrackets.csv
 * //   PT_SocialSecurity.csv
 *
 * const data = loadLegacyData('./data/portugal', structure);
 * // Returns { incomeRecords: [...], referenceData: { PT: {...} }, ... }
 */
function loadLegacyData(dataPath, structure) {
    const incomeRecords = parseCSV(fs.readFileSync(structure.incomeFile, 'utf8'));

    // Load reference data from the same directory
    const referenceData = {};
    const countryCode = structure.countryCode;
    referenceData[countryCode] = loadCountryReferenceData(structure.countryDir);

    // Flatten income records to include country code if missing
    incomeRecords.forEach(r => {
        if (!r.ResidencyCountry) r.ResidencyCountry = countryCode;
        if (!r.SourceCountry) r.SourceCountry = countryCode;
        // Map legacy fields if needed
        if (r.Date) {
             const d = new Date(r.Date);
             if (!isNaN(d.getTime())) {
                 r.year = d.getFullYear();
                 r.month = d.getMonth() + 1;
                 r.day = d.getDate();
             }
        }
        if (r.Year && r.Month && !r.year) {
            r.year = r.Year;
            r.month = r.Month;
            r.day = r.Day || 15;
        }
        // Normalize keys
        r.amount = r.GrossIncome || r.Amount;
        r.currency = r.SourceCurrency || r.Currency || 'EUR'; // Default
        r.incomeType = r.IncomeType || 'employment';
    });

    return {
        incomeRecords,
        exchangeRates: [], // Legacy might not have them
        referenceData,
        taxResidency: {}
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
  detectDataStructure,
  parseCSV
};
