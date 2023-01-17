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

// CCT

buildSync({
	entryPoints: [
		'./src/cct/comp2-lz.ts',
		'./src/cct/enc1-caesar.ts',
		'./src/cct/generate-ip-addresses.ts',
		'./src/cct/graph-2color.ts',
		'./src/cct/largest-prime-factor.ts',
		'./src/cct/min-triangle-path-sum.ts',
		'./src/cct/stock-trader1.ts',
		'./src/cct/stock-trader2.ts',
		'./src/cct/stock-trader3.ts',
		'./src/cct/stock-trader4.ts',
		'./src/cct/unique-paths-grid1.ts',
		'./src/cct/valid-math-expressions.ts',
	],
	bundle,
	target,
	format,
	outdir: './dist/cct/',
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
		cctfinder: './src/cctfinder.ts',
		'fuzz-contract': './src/fuzz-contract.ts',
		pathfinder: './src/pathfinder.ts',
		'payload-b1': './src/payload-b1.ts',
		'score-targets': './src/score-targets.ts',
	},
	bundle,
	target,
	format,
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
	},
	bundle,
	target,
	format,
	splitting: true,
	outdir: './dist/',
	logLevel,
	define: { window: `globalThis`, document: `{ "nodeType": 9 }` },
})
