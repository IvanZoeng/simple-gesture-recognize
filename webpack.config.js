const HtmlWebpackPlugin = require('html-webpack-plugin')

const config = {
    entry: __dirname + '/camera.js',
    output: {
        filename: 'bundle.js',
        path: __dirname + '/dist'
    },
    mode: 'development',
    plugins: [
        new HtmlWebpackPlugin({
            template: 'entries/index.html',
            filename: './index.html', // 输出文件【注意：这里的根路径是module.exports.output.path】
        })
    ]
  };
  
  module.exports = config;