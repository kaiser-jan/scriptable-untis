import typescript from '@rollup/plugin-typescript'

const banner = `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: graduation-cap;

/*
Untis Widget by kaiser-jan

A widget used to display information from Untis.

built @ ${new Date().toISOString()} UTC
*/
`

export default {
	input: 'index.ts',
	output: {
		format: 'es',
		file: './dist/UntisWidget.js',
		banner: banner,
	},
	plugins: [typescript()],
}
