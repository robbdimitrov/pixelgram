const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin')
const fs = require('fs');

let nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

module.exports = {
    entry: {
        server: './src/index.ts'
    },
    target: 'node',
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin(['dist'])
    ],
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
              enforce: 'pre',
              test: /\.ts?$/,
              exclude: [path.resolve(__dirname, 'node_modules')],
              use: ['awesome-typescript-loader', 'source-map-loader']
            }
        ]
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    externals: nodeModules
};
