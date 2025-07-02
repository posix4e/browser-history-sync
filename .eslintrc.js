module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
  },
  overrides: [
    {
      files: ['chrome-extension/**/*.js'],
      env: {
        webextensions: true,
        browser: true,
      },
      globals: {
        BrowserP2PAdapter: 'readonly',
        importScripts: 'readonly',
      },
    },
    {
      files: ['ios-app/**/Resources/**/*.js', 'ios-app/**/*.js'],
      env: {
        webextensions: true,
        browser: true,
      },
      globals: {
        browser: 'readonly',
        BrowserP2PAdapter: 'readonly',
        webkit: 'readonly',
        show: 'readonly',
      },
    },
    {
      files: ['tests/**/*.js'],
      env: {
        webextensions: true,
        browser: true,
      },
      globals: {
        chrome: 'readonly',
      },
    },
  ],
}
