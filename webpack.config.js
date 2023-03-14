const path = require('path')
const webpack = require('webpack')

const banner = `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: graduation-cap;

/*
Untis Widget by JFK-05

A widget used to display information from Untis.
This includes upcoming lessons, exams and grades.

built @ ${new Date().toISOString()}
*/
`

module.exports = {
	entry: './index.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: [/.*scriptable-mock.*/],
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	output: {
		filename: 'untis.js',
		path: path.resolve(__dirname, 'dist'),
		chunkFormat: 'commonjs',
		chunkLoading: 'import',
		iife: false
	},
	experiments: {
		topLevelAwait: true,
	},
	optimization: {
		minimize: false,
		runtimeChunk: false,
		concatenateModules: true,
		chunkIds: 'named',
		mangleExports: false,
		moduleIds: 'named',
		// runtimeChunk: 'single', // would cause multiple files
		
	},

	target: 'node',
	mode: 'production',
	// add a banner to the top of the file
	plugins: [
		new webpack.BannerPlugin({
			banner: banner,
			raw: true,
		}),
		// new webpack.ProvidePlugin({
		// 	module:'module'
		//   })
	]
}
