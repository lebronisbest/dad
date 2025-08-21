module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['import'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' }
      }
    ]
  },
  overrides: [
    {
      files: ['construction-safety-mcp-server/**/*.js'],
      env: {
        es2022: true
      },
      parserOptions: {
        sourceType: 'module'
      }
    }
  ]
};
