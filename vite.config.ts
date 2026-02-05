import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

import { fileURLToPath } from "url";
import { dirname } from "path";

import fs from "fs";
import { mkdir } from "node:fs/promises";
import path from "path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INCLUDED_WHEELS = [
  "micropip",
  "regex",
  "networkx",
  "numpy",
  "pandas",
  "opencv-python",
  "scikit-learn",
  "scikit-image",
  "sqlite3",
  "svgwrite",
  "typing-extensions",
  "shapely",
  "pillow",
  "requests",
];

const identifyAllWheelFiles = (packageFilePath: string, version: string) => {
  const packageJson: Record<string, any> = JSON.parse(
    fs.readFileSync(packageFilePath, "utf-8")
  ).packages;
  let queue = [...INCLUDED_WHEELS];
  let seen = new Set<string>(queue);
  let urls = [];
  while (queue.length > 0) {
    let name = queue.shift();
    if (!name) continue;
    if (name === "lazy_loader") {
      name = "lazy-loader"; // normalise to find in package
    }
    const node = packageJson[name];
    if (!node) {
      throw new Error(`Package ${name} not found in ${packageFilePath}`);
    }
    if (node && !seen.has(node)) {
      const fileName = node.file_name;
      const url = `https://cdn.jsdelivr.net/pyodide/${version}/full/${fileName}`;
      urls.push(url);
      for (const dep of node.depends) {
        if (!seen.has(dep)) {
          queue.push(dep);
          seen.add(dep);
        }
      }
    }
  }
  return urls;
};

async function downloadToFile(url: string, destPath: string) {
  await mkdir(path.dirname(destPath), { recursive: true });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  if (!res.body) {
    throw new Error(`No response body for ${url}`);
  }

  const out = fs.createWriteStream(destPath);
  // Convert Web ReadableStream -> Node Readable
  const nodeReadable = Readable.fromWeb(res.body as unknown as ReadableStream);
  await pipeline(nodeReadable, out);
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isStandalone = env.VITE_STANDALONE_BUILD === "true";
  const shouldIncludeWheels = env.VITE_INCLUDE_WHEELS === "true";
  return {
    server: {
      port: 3000,
      proxy: {
        "/books": {
          target: "http://localhost:5001",
          changeOrigin: true,
          rewrite: (path) => path,
        },
        "/api": {
          target: "http://localhost:5001",
          changeOrigin: true,
          rewrite: (path) => path,
        },
      },
    },
    build: {
      outDir: "build",
      sourcemap: false,
    },
    plugins: [
      {
        name: "transform-pyworker",
        apply: "build",
        buildStart() {},
      },
      {
        name: "transform-pyworker-dev",
        apply: "serve",
        configureServer() {},
      },
      // Process cdn-mirror; normal build doesn't need it; standalone may or may not need wheels
      {
        name: "remove-cdn-mirror-when-not-standalone",
        apply: "build",
        async writeBundle() {
          if (!isStandalone) {
            const target = path.resolve(__dirname, "build/static/cdn-mirror");
            try {
              fs.rmSync(target, { recursive: true, force: true });
              console.log(
                "[vite] Removed static/cdn-mirror (non-standalone build)."
              );
            } catch (e) {
              // okay if it wasn't there
            }
          } else {
            console.log("[vite] Keeping static/cdn-mirror (standalone build).");
            if (shouldIncludeWheels) {
              console.log("[vite] Including wheels in standalone build.");
              const versionDir = fs.readdirSync(
                path.resolve(__dirname, "build/static/cdn-mirror/pyodide")
              );
              if (versionDir.length !== 1) {
                throw new Error(
                  "Expected exactly one Pyodide version directory in build/static/cdn-mirror/pyodide"
                );
              }
              const pyodideVersion = versionDir[0];
              console.log("Pyodide Version found:", pyodideVersion);
              console.log("Downloading wheels...");
              const wheelUrls = identifyAllWheelFiles(
                `build/static/cdn-mirror/pyodide/${pyodideVersion}/full/pyodide-lock.json`,
                pyodideVersion
              );
              const pyodideWheelsTargetDir = path.resolve(
                __dirname,
                `build/static/cdn-mirror/pyodide/${pyodideVersion}/full`
              );
              const tasks = wheelUrls.map((url) => {
                const filename = path.basename(new URL(url).pathname);
                const targetPath = path.join(pyodideWheelsTargetDir, filename);

                if (fs.existsSync(targetPath)) {
                  console.log(`[skip] ${filename} already exists`);
                  return Promise.resolve({ url, skipped: true });
                }
                console.log(`[get ] ${filename}`);
                return downloadToFile(url, targetPath)
                  .then(() => ({ url, ok: true }))
                  .catch((err) => ({ url, ok: false, err }));
              });
              await Promise.all(tasks);
              console.log(
                "[vite] Removed old wheels from static/cdn-mirror/py-packages"
              );
            }
          }
        },
      },
      react({}),
    ],
  };
});
