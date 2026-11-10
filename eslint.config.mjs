import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/coverage/**",
      "**/dist/**",
      "**/web-build/**",
      "**/.expo/**",
      "e2e/cypress/videos/**",
      "e2e/cypress/screenshots/**",
    ],
  },
  {
    files: ["backend/**/*.js"],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: globals.node },
  },
  {
    files: ["backend/test/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
  {
    files: ["frontend/**/*.{js,jsx}"],
    ...js.configs.recommended,
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
    },
  },
  {
    files: ["e2e/**/*.js"],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.node, ...globals.mocha, cy: "readonly", Cypress: "readonly" } },
  },
];
