const { defineConfig } = require('eslint/config')

module.exports = defineConfig([
  {
    plugins: ['perfectionist'],
    extends: ['eslint:recommended', 'plugin:react/recommended'],
    rules: {
      semi: 'error',
      'prefer-const': 'error',
      'perfectionist/sort-imports': 'error',
      'perfectionist/sort-jsx-props': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc'
        }
      ],
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: true,
          shorthandFirst: false,
          shorthandLast: true,
          multiline: 'ignore',
          ignoreCase: false,
          noSortAlphabetically: false,
          locale: 'auto'
        }
      ]
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  }
])
