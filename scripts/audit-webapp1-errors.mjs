import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcRoot = path.join(root, "src");
const entry = path.join(srcRoot, "App.jsx");
const extensions = [".js", ".jsx", ".ts", ".tsx"];

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const base = specifier.startsWith("@/")
    ? path.join(srcRoot, specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, ...extensions.map((ext) => `${base}${ext}`), ...extensions.map((ext) => path.join(base, `index${ext}`))];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const reachable = new Set();
const queue = [entry];
const importPattern = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

while (queue.length) {
  const file = queue.pop();
  if (reachable.has(file)) continue;
  reachable.add(file);
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const resolved = resolveImport(file, match[1]);
    if (resolved && !reachable.has(resolved)) queue.push(resolved);
  }
}

const violations = [];
for (const file of [...reachable].sort()) {
  const source = stripComments(fs.readFileSync(file, "utf8"));
  if (!source.includes("VITE_APP_FIN_URL") || !/\bfetch\s*\(/.test(source)) continue;
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\bfetch\s*\(/.test(line) || (line.includes("VITE_APP_FIN_URL") && lines.slice(Math.max(0, index - 3), index + 1).some((candidate) => /\bfetch\s*\(/.test(candidate)))) {
      violations.push(`${path.relative(root, file)}:${index + 1}`);
    }
  });
}

if (violations.length) {
  console.error(`Unmanaged active WebApplication1 fetch call sites (${violations.length}):`);
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exitCode = 1;
} else {
  console.log(`WebApplication1 audit passed across ${reachable.size} active source files.`);
}
