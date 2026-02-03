/**
 * @module loader
 *
 * Loads all data for the net income calculator.
 * Supports new multi-country structure with automatic residency determination.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load all data from data directory
 *
 * @param {string} dataPath - Path to data directory
 * @returns {Object} Complete dataset with all needed components
 * @throws {Error} If data directory not found or invalid
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
 * Detect current data structure type
 *
 * @param {string} dataPath - Path to data directory
 * @returns {Object} Structure detection result
 */
function detectDataStructure(dataPath) {
  const incomeFile = path.join(dataPath, 'Income.csv');
  const residencyCsv = fs.existsSync(path.join(dataPath, 'Residency.csv'))
    ? 'Residency.csv'
    : 'TaxResidency.csv';
  const referencesDir = path.join(dataPath, 'references');

  // Check for multi-country structure
  if (
    fs.existsSync(incomeFile) &&
    (fs.existsSync(referencesDir) || fs.existsSync(path.join(dataPath, residencyCsv)))
  ) {
    return {
      type: 'multi-country',
      globalIncomeFile: incomeFile,
      residencyFile: path.join(dataPath, residencyCsv),
      referencesDir: fs.existsSync(referencesDir) ? referencesDir : dataPath,
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
          incomeFile: incomeFileLegacy,
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
        incomeFile: incomeFileDirect,
      };
    }
  }

  // Fallback: if we have Income.csv but no clear structure, assume legacy PT
  if (fs.existsSync(incomeFileDirect)) {
    return {
      type: 'legacy',
      countryDir: dataPath,
      countryCode: 'PT',
      incomeFile: incomeFileDirect,
    };
  }

  throw new Error(`Cannot detect data structure in ${dataPath}`);
}

/**
 * Detect country prefix from file names
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
  } catch {
    return null;
  }
  return null;
}

/**
 * Load multi-country structure
 */
function loadMultiCountryStructure(dataPath, structure) {
  const incomeRecords = parseCSV(fs.readFileSync(structure.globalIncomeFile, 'utf8'));

  // Load residency data if exists
  const taxResidency = {};
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
  const exchangeRates = fs.existsSync(exchangeRatesFile)
    ? parseCSV(fs.readFileSync(exchangeRatesFile, 'utf8'))
    : [];

  return {
    incomeRecords, // Array
    exchangeRates,
    referenceData,
    taxResidency,
  };
}

/**
 * Load legacy data
 */
function loadLegacyData(dataPath, structure) {
  const incomeRecords = parseCSV(fs.readFileSync(structure.incomeFile, 'utf8'));

  // Load reference data from the same directory
  const referenceData = {};
  const countryCode = structure.countryCode;
  referenceData[countryCode] = loadCountryReferenceData(structure.countryDir);

  // Flatten income records to include country code if missing
  incomeRecords.forEach((r) => {
    if (!r.ResidencyCountry) {
      r.ResidencyCountry = countryCode;
    }
    if (!r.SourceCountry) {
      r.SourceCountry = countryCode;
    }
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
    taxResidency: {},
  };
}

function loadCountryReferenceData(dir) {
  const files = fs.readdirSync(dir);
  const data = {};
  for (const file of files) {
    if (
      file.endsWith('.csv') &&
      file !== 'Income.csv' &&
      file !== 'Residency.csv' &&
      file !== 'ExchangeRates.csv'
    ) {
      const name = path.basename(file, '.csv');
      // Remove country prefix if present (PT_TaxBrackets -> TaxBrackets)
      const cleanName = name.replace(/^[A-Z]{2}_/, '');

      // Normalize keys to camelCase
      const key = cleanName.charAt(0).toLowerCase() + cleanName.slice(1);
      data[key] = parseCSV(fs.readFileSync(path.join(dir, file), 'utf8'));
    }
  }
  return data;
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    // Handle simple CSV splitting (doesn't handle quoted commas)
    const values = line.split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      // Try to convert numbers
      const val = values[i];
      if (val === undefined) {
        return;
      }

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
  parseCSV,
};
