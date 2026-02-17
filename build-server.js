import path from "path"
import { fileURLToPath } from "url"
import esbuild from "esbuild"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

esbuild
  .build({
    entryPoints: ["server/index-prod.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: "dist/index.js",
    external: ["pg-native", "@ton/ton", "@ton/crypto"],
    resolveExtensions: [".ts", ".js"],
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
    },
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
  })
  .catch(() => process.exit(1))
