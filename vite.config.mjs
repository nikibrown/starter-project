import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { render as renderEjs } from "ejs"
import { defineConfig } from "vite"
import { createHtmlPlugin } from "vite-plugin-html"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcRoot = path.resolve(__dirname, "src")

function collectHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === "inc") continue
      files.push(...collectHtmlFiles(fullPath))
      continue
    }

    if (!entry.isFile()) continue
    if (!entry.name.endsWith(".html")) continue
    if (entry.name.startsWith("_")) continue

    files.push(fullPath)
  }

  return files
}

const htmlFiles = collectHtmlFiles(srcRoot)

const rollupInput = Object.fromEntries(
  htmlFiles.map((absPath) => {
    const rel = path.relative(srcRoot, absPath).replace(/\\/g, "/")
    const key = rel.replace(/\.html$/, "")
    return [key, absPath]
  }),
)

const pages = htmlFiles.map((absPath) => {
  const rel = path.relative(srcRoot, absPath).replace(/\\/g, "/")
  return {
    template: rel,
    filename: rel,
    injectOptions: {
      ejsOptions: {
        filename: absPath,
      },
    },
  }
})

function ejsIncludesFirst() {
  return {
    name: "ejs-includes-first",
    enforce: "pre",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!html.includes("<%")) return html
        const filename = ctx.filename
          ? path.resolve(ctx.filename)
          : path.join(srcRoot, "index.html")
        return renderEjs(html, {}, { filename, views: [srcRoot] })
      },
    },
  }
}

export default defineConfig({
  // Relative base so assets work on GitHub Pages project sites (/<repo>/), not only at domain root
  base: "./",
  root: srcRoot,
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: path.resolve(__dirname, "docs"),
    emptyOutDir: true,
    rollupOptions: {
      input: rollupInput,
    },
  },
  plugins: [
    ejsIncludesFirst(),
    createHtmlPlugin({
      entry: "/main.js",
      pages,
    }),
  ],
})
