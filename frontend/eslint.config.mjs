import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Intentional project-wide relaxations (previously declared in .eslintrc.json,
// which flat config does not read). Kept so linting reflects the project's
// real conventions: data shapes from the backend are dynamic (`any`), legal
// copy uses apostrophes, and images are served from API URLs.
const projectRules = {
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/no-wrapper-object-types": "off",
  "react-hooks/set-state-in-effect": "off",
  "react-hooks/exhaustive-deps": "off",
  "react-hooks/immutability": "off",
  "react/no-unescaped-entities": "off",
  "@next/next/no-img-element": "off",
  "jsx-a11y/alt-text": "off",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: projectRules,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
