module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
  ],
  rules: {
    // 파일 및 함수 길이 제한
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
    'complexity': ['warn', 12],
    
    // React 관련 규칙
    'react/function-component-definition': ['error', {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function'
    }],
    'react-hooks/exhaustive-deps': 'error',
    'react/prop-types': 'off', // TypeScript 사용 시
    'react/react-in-jsx-scope': 'off', // React 17+ 에서는 불필요
    
    // TypeScript 관련 규칙
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // 일반적인 코딩 규칙
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // 에러 처리 규칙
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // 가독성 규칙
    'max-depth': ['warn', 4],
    'max-params': ['warn', 4],
    'max-statements': ['warn', 20],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // TypeScript 파일에만 적용되는 규칙
        '@typescript-eslint/no-unused-vars': 'error',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      rules: {
        // JavaScript 파일에만 적용되는 규칙
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
