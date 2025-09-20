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
      "**/*.test.ts",   // ✅ ignore .test.ts files
      "**/*.test.tsx",  // ✅ ignore .test.tsx files
    ],
  },
  {
    rules: {
      // ✅ Allow unused variables without breaking the build
      "@typescript-eslint/no-unused-vars": "off",

      // ✅ Allow use of "any" type
      "@typescript-eslint/no-explicit-any": "off",

      // ✅ Allow use of "ts-ignore" comment
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];

export default eslintConfig;
