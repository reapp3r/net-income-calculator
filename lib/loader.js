const fs = require('fs');
const path = require('path');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (value === '' || value === undefined) {
        row[header] = null;
      } else if (!isNaN(value) && value !== '') {
        row[header] = parseFloat(value);
      } else if (value.toLowerCase() === 'true') {
        row[header] = true;
      } else if (value.toLowerCase() === 'false') {
        row[header] = false;
      } else {
        row[header] = value;
      }
    });
    rows.push(row);
  }

  return rows;
}

function loadCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return parseCSV(content);
}

function validateReferenceData(referenceData) {
  const required = [
    'taxBrackets',
    'socialSecurity',
    'solidarity',
    'deductions',
    'specialRegimes',
    'foreignTaxCredit'
  ];

  for (const field of required) {
    if (!referenceData[field]) {
      throw new Error(`Missing required reference data: ${field}`);
    }
    if (!Array.isArray(referenceData[field])) {
      throw new Error(`Reference data ${field} must be an array`);
    }
  }

  if (referenceData.taxBrackets.length === 0) {
    throw new Error('TaxBrackets.csv must contain at least one row');
  }

  if (referenceData.socialSecurity.length === 0) {
    throw new Error('SocialSecurity.csv must contain at least one row');
  }

  if (referenceData.solidarity.length === 0) {
    throw new Error('SolidarityTax.csv must contain at least one row');
  }

  if (referenceData.deductions.length === 0) {
    throw new Error('Deductions.csv must contain at least one row');
  }

  if (referenceData.specialRegimes.length === 0) {
    throw new Error('SpecialRegimes.csv must contain at least one row');
  }

  return true;
}

function parseSimulationParameters(parametersArray) {
  const params = {};
  for (const row of parametersArray) {
    const key = row.Parameter;
    let value = row.Value;
    
    if (value === 'true' || value === 'TRUE') {
      value = true;
    } else if (value === 'false' || value === 'FALSE') {
      value = false;
    } else if (!isNaN(value) && value !== '' && value !== null) {
      value = parseFloat(value);
    }
    
    params[key] = value;
  }
  return params;
}

function detectCountryPrefix(directoryPath) {
  const files = fs.readdirSync(directoryPath);
  
  const prefixPattern = /^([A-Z]{2,3})_/;
  for (const file of files) {
    const match = file.match(prefixPattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

function getCountryCodeFromName(countryName) {
  const nameToCode = {
    'portugal': 'PT',
    'uk': 'GB',
    'unitedkingdom': 'GB',
    'germany': 'DE',
    'deutschland': 'DE'
  };
  
  return nameToCode[countryName.toLowerCase()] || countryName.toUpperCase();
}

function detectDataStructure(dataPath) {
  // Detect if we're using legacy (data/portugal/) or new (data/ + references/) structure
  const incomeFile = path.join(dataPath, 'Income.csv');
  const residencyFile = path.join(dataPath, 'Residency.csv');
  const referencesDir = path.join(dataPath, 'references');
  
  // Check for new multi-country structure
  if (fs.existsSync(incomeFile) && fs.existsSync(referencesDir)) {
    return {
      type: 'multi-country',
      globalIncomeFile: incomeFile,
      residencyFile: fs.existsSync(residencyFile) ? residencyFile : null,
      referencesDir: referencesDir
    };
  }
  
  // Check for legacy single-country structure
  const legacyDirs = ['portugal', 'pt', 'uk', 'de'];
  for (const dir of legacyDirs) {
    const legacyPath = path.join(dataPath, dir);
    if (fs.existsSync(legacyPath)) {
      const incomeFile = path.join(legacyPath, 'Income.csv');
      if (fs.existsSync(incomeFile)) {
        // Try to detect from legacy dir first, then use directory name
        let prefix = detectCountryPrefix(legacyPath);
        if (!prefix) {
          // For legacy support with reference files moved to references/, use directory name
          const dirToPrefix = {
            'portugal': 'PT',
            'pt': 'PT', 
            'uk': 'GB',
            'de': 'DE'
          };
          prefix = dirToPrefix[dir.toLowerCase()] || dir.toUpperCase();
        }
        // Try to load reference data from references directory first, then from legacy
        const referencesPath = path.join(dataPath, 'references', dir);
        const refDataPath = fs.existsSync(referencesPath) ? referencesPath : legacyPath;
        
        return {
          type: 'legacy',
          countryDir: legacyPath,
          refDataDir: refDataPath,
          countryCode: prefix
        };
      }
    }
  }
  
  throw new Error(`Cannot detect data structure in ${dataPath}. Expected either:
1. Legacy: data/<country>/ with <COUNTRY>_*.csv files
2. Multi-country: data/Income.csv + data/references/<country>/`);
}

function loadReferenceData(directoryPath, countryCode = null) {
  // FUTURE: Multi-country support
  // This function now supports both legacy (data/portugal/) and new (data/references/) structures
  // 1. Legacy: data/portugal/ with PT_*.csv files
  // 2. New: data/references/<country>/ with <COUNTRY>_*.csv files
  // 3. Multi-country: Load multiple countries when data/Income.csv is present
  
  let prefix = countryCode;
  let basePath = directoryPath;
  
  // If no country code provided, detect from directory structure
  if (!prefix) {
    // Check if this is a references directory (data/references/)
    if (directoryPath.includes('references')) {
      // Extract country from path: data/references/portugal -> PT
      const pathParts = directoryPath.split(path.sep);
      const countryName = pathParts[pathParts.length - 1];
      prefix = getCountryCodeFromName(countryName);
    } else {
      // Legacy mode: detect from file prefixes
      prefix = detectCountryPrefix(directoryPath);
    }
  }
  
  if (!prefix) {
    throw new Error(`Cannot determine country code for ${directoryPath}. Either provide countryCode or ensure files have country prefix (e.g., PT_TaxBrackets.csv)`);
  }

  const requiredFiles = [
    `${prefix}_TaxBrackets.csv`,
    `${prefix}_SocialSecurity.csv`,
    `${prefix}_SolidarityTax.csv`,
    `${prefix}_Deductions.csv`,
    `${prefix}_SpecialRegimes.csv`,
    `${prefix}_ForeignTaxCredit.csv`,
    `${prefix}_MonthlyPersonalDeductions.csv`,
    `${prefix}_MonthlyIncome.csv`,
    'SimulationParameters.csv'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(basePath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required file: ${file}. All reference data files must be present in ${basePath}`);
    }
  }

  const referenceData = {
    countryCode: prefix,
    taxBrackets: loadCSV(path.join(basePath, `${prefix}_TaxBrackets.csv`)),
    socialSecurity: loadCSV(path.join(basePath, `${prefix}_SocialSecurity.csv`)),
    solidarity: loadCSV(path.join(basePath, `${prefix}_SolidarityTax.csv`)),
    deductions: loadCSV(path.join(basePath, `${prefix}_Deductions.csv`)),
    specialRegimes: loadCSV(path.join(basePath, `${prefix}_SpecialRegimes.csv`)),
    foreignTaxCredit: loadCSV(path.join(basePath, `${prefix}_ForeignTaxCredit.csv`)),
    personalDeductions: loadCSV(path.join(basePath, `${prefix}_MonthlyPersonalDeductions.csv`)),
    simulationParameters: parseSimulationParameters(loadCSV(path.join(basePath, 'SimulationParameters.csv')))
  };

  validateReferenceData(referenceData);

  console.log(`Loaded ${prefix} tax reference data from ${basePath}`);

  return referenceData;
}

function loadMultiCountryReferenceData(referencesDir, countries) {
  // Load reference data for multiple countries
  const referenceDataMap = {};
  
  for (const country of countries) {
    const countryDir = path.join(referencesDir, country.toLowerCase());
    if (fs.existsSync(countryDir)) {
      referenceDataMap[country.toUpperCase()] = loadReferenceData(countryDir, country.toUpperCase());
    } else {
      throw new Error(`Reference data directory not found: ${countryDir}`);
    }
  }
  
  return referenceDataMap;
}

function loadData(dataPath) {
  // Main entry point for loading data
  // Detects structure and loads appropriate data
  
  const structure = detectDataStructure(dataPath);
  
  if (structure.type === 'legacy') {
    // Legacy mode: load single country
    const incomeFile = path.join(structure.countryDir, 'Income.csv');
    const incomeRecords = loadCSV(incomeFile);
    const referenceData = loadReferenceData(structure.refDataDir || structure.countryDir, structure.countryCode);
    
    return {
      structure: 'legacy',
      incomeRecords,
      referenceData,
      residencyRecords: null
    };
  } else if (structure.type === 'multi-country') {
    // Multi-country mode: load global income and multiple reference data
    const incomeRecords = loadCSV(structure.globalIncomeFile);
    const residencyRecords = structure.residencyFile ? loadCSV(structure.residencyFile) : null;
    
    // Determine which countries are needed from income records
    const countries = new Set();
    incomeRecords.forEach(record => {
      if (record.ResidencyCountry || record.TaxResidency) {
        countries.add((record.ResidencyCountry || record.TaxResidency).toUpperCase());
      }
    });
    
    // Map country codes to directory names for loading
    const countryDirs = Array.from(countries).map(code => {
      const codeToDir = {
        'PT': 'portugal',
        'GB': 'gb',
        'DE': 'germany'
      };
      return codeToDir[code] || code.toLowerCase();
    });
    
    // Load reference data for all required countries
    const referenceDataMap = {};
    Array.from(countries).forEach((code, index) => {
      const dirName = countryDirs[index];
      const countryDir = path.join(structure.referencesDir, dirName);
      if (fs.existsSync(countryDir)) {
        referenceDataMap[code] = loadReferenceData(countryDir, code);
      } else {
        throw new Error(`Reference data directory not found: ${countryDir}`);
      }
    });
    
    return {
      structure: 'multi-country',
      incomeRecords,
      referenceData: referenceDataMap,
      residencyRecords
    };
  }
  
  throw new Error(`Unsupported data structure: ${structure.type}`);
}

function validateIncomeDataCompleteness(incomeRecords, referenceData) {
  const years = new Set(incomeRecords.map(r => r.Year));
  const taxBracketYears = new Set(referenceData.taxBrackets.map(b => b.Year));
  const ssYears = new Set(referenceData.socialSecurity.map(s => s.Year));
  const solidarityYears = new Set(referenceData.solidarity.map(s => s.Year));
  const deductionYears = new Set(referenceData.deductions.map(d => d.Year));

  for (const year of years) {
    if (!taxBracketYears.has(year)) {
      throw new Error(`Income data contains year ${year} but TaxBrackets.csv has no data for this year`);
    }
    if (!ssYears.has(year)) {
      throw new Error(`Income data contains year ${year} but SocialSecurity.csv has no data for this year`);
    }
    if (!solidarityYears.has(year)) {
      throw new Error(`Income data contains year ${year} but SolidarityTax.csv has no data for this year`);
    }
    if (!deductionYears.has(year)) {
      throw new Error(`Income data contains year ${year} but Deductions.csv has no data for this year`);
    }
  }

  return true;
}

module.exports = {
  parseCSV,
  loadCSV,
  loadReferenceData,
  validateReferenceData,
  validateIncomeDataCompleteness,
  detectDataStructure,
  loadMultiCountryReferenceData,
  loadData,
  getCountryCodeFromName
};
