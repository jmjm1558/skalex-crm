import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const manifestPath = path.join(distDir, "manifest.json");

function fail(message) {
  console.error(`[verify-dist] ❌ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distDir)) fail(`No existe dist/: ${distDir}`);
if (!fs.existsSync(manifestPath)) fail(`No existe dist/manifest.json`);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (e) {
  fail(`manifest.json no es JSON válido: ${String(e)}`);
}

const required = new Set();

// background service worker
const sw = manifest?.background?.service_worker;
if (typeof sw === "string" && sw.length > 0) required.add(sw);

// content scripts
for (const cs of manifest?.content_scripts ?? []) {
  for (const js of cs?.js ?? []) required.add(js);
  for (const css of cs?.css ?? []) required.add(css);
}

if (required.size === 0) {
  fail(`No encontré archivos requeridos en manifest (background/content_scripts).`);
}

const missing = [];
for (const rel of required) {
  const abs = path.join(distDir, rel);
  if (!fs.existsSync(abs)) missing.push(rel);
}

if (missing.length > 0) {
  fail(
    `Faltan archivos referenciados por manifest:\n` +
      missing.map((m) => `  - ${m}`).join("\n") +
      `\n\nContenido actual de dist/: ${fs.readdirSync(distDir).join(", ")}`
  );
}

console.log(`[verify-dist] ✅ OK. Manifest consistente. Encontrados: ${Array.from(required).join(", ")}`);
