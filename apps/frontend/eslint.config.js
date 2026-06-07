// @ts-check
const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname
});

module.exports = [
  {
    ignores: ['projects/**/*', 'dist/**/*', 'coverage/**/*', 'node_modules/**/*']
  },
  ...compat.config({
    overrides: [
      {
        files: ['*.ts'],
        parserOptions: {
          project: ['tsconfig.json'],
          createDefaultProgram: true
        },
        extends: [
          'plugin:@angular-eslint/recommended',
          'plugin:@angular-eslint/template/process-inline-templates'
        ],
        rules: {
          '@angular-eslint/directive-selector': [
            'error',
            {
              type: 'attribute',
              prefix: 'app',
              style: 'camelCase'
            }
          ],
          '@angular-eslint/component-selector': [
            'error',
            {
              type: 'element',
              prefix: 'app',
              style: 'kebab-case'
            }
          ],
          '@angular-eslint/prefer-standalone': 'off',
          '@angular-eslint/prefer-inject': 'off'
        }
      },
      {
        files: ['*.html'],
        extends: ['plugin:@angular-eslint/template/recommended'],
        rules: {}
      }
    ]
  })
];
