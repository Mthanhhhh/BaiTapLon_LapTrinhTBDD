// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", "dist-*/**", ".expo/**"],
  },
  {
    // Compiler migration diagnostics remain visible while this existing RN app
    // uses imperative Animated refs and synchronizes server data into forms.
    // Hook ordering and exhaustive dependency checks keep their Expo defaults.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
]);
