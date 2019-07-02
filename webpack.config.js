const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const config = {
    entry: __dirname + '/index.js',
    output: {
        filename: 'bundle.js',
        path: __dirname + '/dist'
    },
    mode: 'development',
    plugins: [
        new HtmlWebpackPlugin(),
    ]
};

module.exports = config;