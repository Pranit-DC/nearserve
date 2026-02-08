import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "functions/**",
      "scripts/**",
      "public/**",
    ],
  },
  {
    rules: {
      // Downgrade 'any' errors to warnings - proper typing takes time
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      // Allow unescaped entities in JSX (apostrophes etc)
      "react/no-unescaped-entities": "off",
      // Downgrade missing display name
      "react/display-name": "off",
      // Downgrade img element warning
      "@next/next/no-img-element": "warn",
      // Downgrade exhaustive-deps to warning
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
