const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  entry: {
    main: './src/index.js',
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist',
  },
  mode: "production",
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.ttf$/,
				use: ['file-loader']
			}
		]
	},
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      chunks: ['main']
    }),
    new CopyWebpackPlugin({
        patterns: [
          {
            context: "node_modules/@r-wasm/webr/dist",
            from: "webr-*.js",
          },
          {
            context: "node_modules/@r-wasm/webr/dist",
            from: "R.bin.*",
          },
          {
            context: "node_modules/@r-wasm/webr/dist",
            from: "*.so",
          },
          {
            from: "repo",
            to: "repo"
          }
        ]
    }),
		new MonacoWebpackPlugin({
			languages: ['r']
		})
]
};
