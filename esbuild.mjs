import { buildSync } from 'esbuild'

const bundle = true
const target = 'es2020'
const format = 'esm'
const logLevel = 'info'

buildSync({
	entryPoints: ['./src/bootstrap-service.ts'],
	bundle,
	target,
	format,
	outfile: './dist/boot.js',
	logLevel,
})

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
