module.exports = {
  root: true,
  env: { node: true, es2022: true, jest: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
  extends: ['eslint:recommended', 'prettier'],
  ignorePatterns: ['node_modules/', 'uploads/', 'coverage/'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$|^req$|^res$', ignoreRestSiblings: true }]
  }
};
