import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { createHtmlPlugin } from "vite-plugin-html"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const indexHtmlPath = path.resolve(__dirname, "src/index.html")

export default defineConfig({
	root: "src",
	publicDir: path.resolve(__dirname, "public"),
	build: {
		outDir: path.resolve(__dirname, "docs"),
		emptyOutDir: true,
		rollupOptions: {
			input: indexHtmlPath,
		},
	},
	plugins: [
		createHtmlPlugin({
			entry: "/main.js",
			inject: {
				ejsOptions: {
					// Required so EJS `include()` resolves paths relative to the page template
					filename: indexHtmlPath,
				},
			},
		}),
	],
})
