import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

import { fileURLToPath } from "url";
import { dirname } from "path";

import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rewriteWorkerJs = (isStandalone: boolean) => {
  const inputPath = path.resolve(__dirname, "src/utils/pyworker_sw.js");
  const outputPath = path.resolve(__dirname, "public/static/js/pyworker_sw.js");

  let contents = fs.readFileSync(inputPath, "utf-8");
  if (isStandalone) {
    console.log(
      "[vite] replacing STANDALONE_BUILD = false with STANDALONE_BUILD = true in src/utils/pyworker_sw.js -> public/static/js/pyworker_sw.js"
    );
    contents = contents.replace(
      "const STANDALONE_BUILD = false",
      "const STANDALONE_BUILD = true"
    );
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, contents, "utf-8");

  console.log(
    `[vite] Processed pyworker_sw.js: STANDALONE_BUILD=${isStandalone}`
  );
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isStandalone = env.VITE_STANDALONE_BUILD === "true";
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
    },
    plugins: [
      {
        name: "transform-pyworker",
        apply: "build",
        buildStart() {
          rewriteWorkerJs(isStandalone);
        },
      },
      {
        name: "transform-pyworker-dev",
        apply: "serve",
        configureServer() {
          rewriteWorkerJs(false);
        },
      },
      // 🔑 Conditional removal of cdn-mirror from output
      {
        name: "remove-cdn-mirror-when-not-standalone",
        apply: "build",
        writeBundle() {
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
          }
        },
      },
      react({}),
    ],
  };
});
