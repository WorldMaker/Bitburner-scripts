import { buildSync } from 'esbuild'
import globule from 'globule'

const bundle = true
const target = 'es2020'
const format = 'esm'
const logLevel = 'info'

// Simple payloads

buildSync({
	entryPoints: [
		'./src/payload-all.ts',
		'./src/payload-g.ts',
		'./src/payload-h.ts',
		'./src/payload-w.ts',
		'./src/payload-sg.ts',
		'./src/payload-sh.ts',
		'./src/payload-sw.ts',
		'./src/payload-bg.ts',
		'./src/payload-bh.ts',
		'./src/payload-bw.ts',
	],
	bundle,
	target,
	format,
	outdir: './dist/',
	logLevel,
})

// Tests

buildSync({
	entryPoints: globule.find('./src/**/*.test.ts'),
	bundle,
	target,
	format,
	outdir: './test/',
	logLevel,
	platform: 'node',
	splitting: true,
})

// Simple Target "Apps"

buildSync({
	entryPoints: {
		autocct: './src/autocct.ts',
		'fuzz-contract': './src/fuzz-contract.ts',
		pathfinder: './src/pathfinder.ts',
		'payload-b1': './src/payload-b1.ts',
	},
	bundle,
	target,
	format,
	splitting: true,
	outdir: './dist/',
	logLevel,
	define: { window: `globalThis`, document: `{ "nodeType": 9 }` },
})

// Bigger "Apps"

buildSync({
	entryPoints: {
		able: './src/bootstrap-service.ts',
		boot: './src/bootstrap-service-cct.ts',
		corp: './src/corporate-service.ts',
		'score-targets': './src/score-targets.ts',
		shirt: './src/shirt.ts',
	},
	bundle,
	target,
	format,
	splitting: true,
	outdir: './dist/',
	logLevel,
	define: { window: `globalThis`, document: `{ "nodeType": 9 }` },
})
