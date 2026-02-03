module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended/all'],
  testMatch: [
    '**/__tests__/unit/**/*.test.js',
    '**/__tests__/integration/**/*.test.js',
    '**/__tests__/*.test.js'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/index.js',
    '!**/__tests__/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/fixtures/',
    '/__tests__/helpers/',
    '/bin/'
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    // 100% for Portugal calculation modules
    './lib/residency/pt/progressive.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/residency/pt/socialSecurity.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/residency/pt/solidarity.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/residency/pt/nhr.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/residency/pt/deductions.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/residency/pt/foreignTaxCredit.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    // 100% for UK calculation modules
    './lib/residency/gb/progressive.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/residency/gb/nationalInsurance.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/residency/gb/deductions.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    // 100% for shared utilities
    './lib/utils/currency.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/temporal.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/utils/validation.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    },
    './lib/utils/referenceData.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  },
  verbose: true,
  testTimeout: 10000
};
