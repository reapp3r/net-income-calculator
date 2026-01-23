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

function loadReferenceData(directoryPath) {
  // FUTURE: Multi-country support
  // This function currently loads reference data from a single country directory.
  // Future enhancements:
  // 1. Support data/references/portugal/ structure (in addition to current data/portugal/)
  // 2. Load multiple countries when data/Income.csv is present (global income file)
  // 3. Load optional data/Residency.csv for residency tracking
  // See docs/FUTURE_ARCHITECTURE.md for complete specification
  
  const prefix = detectCountryPrefix(directoryPath);
  
  if (!prefix) {
    throw new Error(`Cannot detect country prefix in ${directoryPath}. Reference files must be named with country prefix (e.g., PT_TaxBrackets.csv)`);
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
    const filePath = path.join(directoryPath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required file: ${file}. All reference data files must be present in ${directoryPath}`);
    }
  }

  const referenceData = {
    countryCode: prefix,
    taxBrackets: loadCSV(path.join(directoryPath, `${prefix}_TaxBrackets.csv`)),
    socialSecurity: loadCSV(path.join(directoryPath, `${prefix}_SocialSecurity.csv`)),
    solidarity: loadCSV(path.join(directoryPath, `${prefix}_SolidarityTax.csv`)),
    deductions: loadCSV(path.join(directoryPath, `${prefix}_Deductions.csv`)),
    specialRegimes: loadCSV(path.join(directoryPath, `${prefix}_SpecialRegimes.csv`)),
    foreignTaxCredit: loadCSV(path.join(directoryPath, `${prefix}_ForeignTaxCredit.csv`)),
    personalDeductions: loadCSV(path.join(directoryPath, `${prefix}_MonthlyPersonalDeductions.csv`)),
    simulationParameters: parseSimulationParameters(loadCSV(path.join(directoryPath, 'SimulationParameters.csv')))
  };

  validateReferenceData(referenceData);

  console.log(`Loaded ${prefix} tax reference data from ${directoryPath}`);

  return referenceData;
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
  validateIncomeDataCompleteness
};
