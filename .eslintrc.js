// .eslintrc.js
module.exports = {
    root: true,
    extends: [
      'expo',
      '@react-native-community',
      'eslint:recommended',
      '@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-native/all',
      'prettier',
    ],
    plugins: [
      '@typescript-eslint',
      'react',
      'react-native',
      'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    env: {
      'react-native/react-native': true,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // React
      'react/prop-types': 'off', // TypeScript使用のため不要
      'react/react-in-jsx-scope': 'off', // React 17+では不要
      'react/display-name': 'off',
      
      // React Native
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'error',
      'react-native/split-platform-components': 'warn',
      
      // Prettier
      'prettier/prettier': 'error',
      
      // その他
      'no-console': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  };
  