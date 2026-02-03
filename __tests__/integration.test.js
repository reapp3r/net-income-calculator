const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SAMPLE_INCOME_CSV = `Year,Month,GrossIncome,IncomeType,SourceCountry,ResidencyCountry
2025,1,5000,employment,PT,PT
2025,1,2000,freelance,UK,PT
2025,2,5000,employment,PT,PT
2025,3,10000,dividend,PT,PT`;

const SAMPLE_SIMULATION_PARAMS = `Parameter,Value
NHRStatusAcquiredDate,2023-06-15
DividendAggregation,false`;

const SAMPLE_MONTHLY_PERSONAL_DEDUCTIONS = `Year,Month,Health,Education,Housing,IVABooksAndCulture
2025,1,0,0,0,0
2025,2,0,0,0,0
2025,3,0,0,0,0`;

describe('CLI Integration', () => {
  const testDataDir = path.join(__dirname, 'test-data-cli');
  const ptDir = path.join(testDataDir, 'PT');

  const monthlyPath = path.join(testDataDir, 'MonthlyResults.csv');
  const annualPath = path.join(testDataDir, 'AnnualSummary.csv');
  const byTypePath = path.join(testDataDir, 'AnnualByType.csv');

  beforeAll(() => {
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Create PT subdirectory if it doesn't exist
    if (!fs.existsSync(ptDir)) {
      fs.mkdirSync(ptDir, { recursive: true });
    }

    // Create income and simulation files in PT subdirectory
    fs.writeFileSync(path.join(ptDir, 'Income.csv'), SAMPLE_INCOME_CSV);
    fs.writeFileSync(
      path.join(ptDir, 'SimulationParameters.csv'),
      SAMPLE_SIMULATION_PARAMS
    );
    fs.writeFileSync(
      path.join(ptDir, 'MonthlyPersonalDeductions.csv'),
      SAMPLE_MONTHLY_PERSONAL_DEDUCTIONS
    );

    // Create dummy ExchangeRates.csv at root level (required by new loader)
    fs.writeFileSync(
      path.join(testDataDir, 'ExchangeRates.csv'),
      'Year,Month,FromCurrency,ToCurrency,Rate\n2025,1,EUR,EUR,1.0\n2025,1,GBP,EUR,1.17'
    );

    [monthlyPath, annualPath, byTypePath].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  });

  // afterAll(() => {
  //   if (fs.existsSync(testDataDir)) {
  //     fs.rmSync(testDataDir, { recursive: true, force: true });
  //   }
  // });

  test('CLI processes directory with all required files', () => {
    execSync(`node bin/net-income-calculator "${testDataDir}"`, {
      stdio: 'pipe',
    });

    expect(fs.existsSync(monthlyPath)).toBe(true);
    expect(fs.existsSync(annualPath)).toBe(true);
    expect(fs.existsSync(byTypePath)).toBe(true);

    const monthlyContent = fs.readFileSync(monthlyPath, 'utf8');
    expect(monthlyContent).toContain('Year');
    expect(monthlyContent).toContain('netIncome');

    const annualContent = fs.readFileSync(annualPath, 'utf8');
    expect(annualContent).toContain('Year');
    expect(annualContent).toContain('GrossIncome');

    const monthlyLines = monthlyContent.split('\n').filter(l => l.trim());
    expect(monthlyLines.length).toBeGreaterThan(1);
  });

  test('CLI fails with non-existent directory', () => {
    expect(() => {
      execSync('node bin/net-income-calculator /nonexistent/directory', {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  test('CLI fails with missing arguments', () => {
    expect(() => {
      execSync('node bin/net-income-calculator', { stdio: 'pipe' });
    }).toThrow(/Usage/);
  });
});
