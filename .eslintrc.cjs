const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['packages/*/src/**/*.js', 'packages/*/nodes/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { require: 'readonly', module: 'readonly', exports: 'readonly', process: 'readonly' },
    },
    rules: {
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['packages/*/ui/**/*.vue'],
    plugins: { vue: require('eslint-plugin-vue') },
    rules: {
      'vue/no-v-html': 'error',
    },
  },
];
