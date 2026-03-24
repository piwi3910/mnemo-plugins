export default [
  {
    files: ["plugins/**/*.js"],
    ignores: ["plugins/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        Promise: "readonly",
        Array: "readonly",
        Map: "readonly",
        Set: "readonly",
        Date: "readonly",
        Error: "readonly",
        RegExp: "readonly",
        parseInt: "readonly",
        encodeURIComponent: "readonly",
        decodeURIComponent: "readonly",
        exports: "readonly",
        require: "readonly",
        module: "readonly",
        Object: "readonly",
        typeof: "readonly",
        JSON: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "off",
      "semi": ["error", "always"],
      "no-var": "off",
      "prefer-const": "off",
      "eqeqeq": "error"
    }
  }
];
