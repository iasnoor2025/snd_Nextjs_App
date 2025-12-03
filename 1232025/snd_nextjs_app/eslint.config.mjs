import eslintPlugin from '@typescript-eslint/eslint-plugin';
import tseslint from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['*.config.*', '**/node_modules/**', '**/.next/**', '**/public/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': eslintPlugin,
    },
    rules: {
      ...eslintPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off', // Disable strict any checking for now
      '@typescript-eslint/no-unused-vars': [
        'warn', // Change to warn instead of error
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      ...eslintConfigPrettier.rules,
    },
  },
];

