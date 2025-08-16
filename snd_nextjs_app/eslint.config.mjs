import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(import.meta.url);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "prettier"
  ),
  {
    plugins: ["@typescript-eslint", "prettier"],
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-const": "error",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // React rules
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/no-array-index-key": "warn",
      "react/no-unescaped-entities": "off",
      
      // Accessibility rules
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      
      // Next.js rules
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-sync-scripts": "error",
      
      // Performance rules
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      
      // Code quality rules
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-empty": "warn",
      "no-unused-expressions": "error",
      "no-duplicate-imports": "error",
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
      
      // Prettier integration
      "prettier/prettier": "error",
    },
    overrides: [
      {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
          "@typescript-eslint/no-explicit-any": "warn",
          "@typescript-eslint/no-unused-vars": "error",
        },
      },
      {
        files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
        rules: {
          "@typescript-eslint/no-explicit-any": "off",
          "no-console": "off",
        },
      },
      {
        files: ["**/api/**/*.ts", "**/api/**/*.tsx"],
        rules: {
          "no-console": "off",
        },
      },
    ],
  },
];

export default eslintConfig;
