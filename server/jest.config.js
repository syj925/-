const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname),
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/.cache/',
    '/.bun/'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};
