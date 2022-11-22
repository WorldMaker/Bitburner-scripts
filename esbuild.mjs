import { buildSync } from 'esbuild'

const bundle = true
const target = 'es2020'
const format = 'esm'
const logLevel = 'info'

buildSync({
	entryPoints: ['./src/payload-all.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-all.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-g.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-g.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-h.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-h.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-w.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-w.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-sg.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-sg.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-sh.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-sh.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-sw.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-sw.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-bg.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-bg.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-bh.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-bh.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/payload-bw.ts'],
	bundle,
	target,
	format,
	outfile: './dist/payload-bw.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/pathfinder.ts'],
	bundle,
	target,
	format,
	outfile: './dist/pathfinder.js',
	logLevel,
})

buildSync({
	entryPoints: ['./src/bootstrap-service.ts'],
	bundle,
	target,
	format,
	outfile: './dist/boot.js',
	logLevel,
	define: { window: `{}`, document: `{ "nodeType": 9 }` },
})
