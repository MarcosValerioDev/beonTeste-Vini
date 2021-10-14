const merge = require("webpack-merge");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const base = require("./webpack.base.js");

module.exports = merge(base, {
  plugins: [new MinifyPlugin()],
});
