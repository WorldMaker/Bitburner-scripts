import { buildSync } from 'esbuild'

buildSync({
	entryPoints: ['./src/bootstrap-service.ts'],
	bundle: true,
	target: 'es2018',
	format: 'esm',
	outfile: './dist/service.js',
	logLevel: 'info',
})

buildSync({
	entryPoints: ['./src/hack-service.ts'],
	bundle: true,
	target: 'es2018',
	format: 'esm',
	outfile: './dist/hack-service.js',
	logLevel: 'info',
})
