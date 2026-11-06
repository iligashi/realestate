module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['unused-imports'],
  settings: { react: { version: 'detect' } },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    'react-hooks/exhaustive-deps': 'warn'
  }
};
