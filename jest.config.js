module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  setupFilesAfterEnv: ['./jest-setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native'
      + '|@react-native'
      + '|@react-navigation'
      + '|react-redux'
      + '|@reduxjs/toolkit'  
      + '|immer'            
      + '|@expo'
      + '|expo'
      + '|@expo/vector-icons'
      + '|expo-font'
      + '|expo-sqlite'
      + ')/)',
  ],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverage: true,
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'screens/**/*.{js,jsx,ts,tsx}',
    'util/**/*.{js,jsx,ts,tsx}',
    'redux/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!navigation/*.{js,jsx,ts,tsx}',
    '!**/__mocks__/**',
    '!**/App.js',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
};