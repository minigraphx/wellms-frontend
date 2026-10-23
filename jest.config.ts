import type { Config } from "jest";
import nextJest from "next/jest.js";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

// Jest runs CommonJS, but react-markdown and the unified/remark/rehype packages it uses ship
// only ES modules. Find every installed package marked "type": "module" so Jest transforms them,
// including nested copies (e.g. an ESM escape-string-regexp under mdast-util-find-and-replace).
function esmOnlyPackages(nodeModules = path.resolve("node_modules"), found = new Set<string>()): Set<string> {
  let entries: string[];
  try {
    entries = readdirSync(nodeModules);
  } catch {
    return found;
  }

  const names = entries.flatMap((entry) =>
    entry.startsWith("@") ? readdirSync(path.join(nodeModules, entry)).map((sub) => `${entry}/${sub}`) : [entry]
  );

  for (const name of names) {
    const dir = path.join(nodeModules, name);
    try {
      if (JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")).type === "module") found.add(name);
    } catch {
      // not a package (e.g. .bin)
    }
    esmOnlyPackages(path.join(dir, "node_modules"), found);
  }

  return found;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function jestConfig(): Promise<Config> {
  const resolved = await createJestConfig(config)();
  const esm = [...esmOnlyPackages()].map(escapeRegExp).join("|");

  // next/jest's first pattern ignores node_modules except an allow-list "(?!(a|b)/)"; extend that list.
  const [nodeModulesPattern, ...rest] = resolved.transformIgnorePatterns ?? [];
  const extended = nodeModulesPattern?.replace("(?!(", `(?!(${esm}|`);

  return {
    ...resolved,
    transformIgnorePatterns: extended ? [extended, ...rest] : resolved.transformIgnorePatterns,
  };
}
