module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended"
  ],
  parserOptions: {
    ecmaVersion: 8
  },
  root: true,
  rules: {
    "eqeqeq": "error",
    "no-console": "off",
    "no-var": "error",
    "one-var": ["error", "never"],
    "prefer-const": "error",
    "quotes": ["error", "double"]
  }
};
