import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'lib/**',
      'node_modules/**',
      'coverage/**',
      '*.js',
      '*.mjs'
    ]
  },
  {
    files: ['src/**/*.ts', '__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-console': 'warn'
    }
  }
)
