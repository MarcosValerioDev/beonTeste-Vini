const merge = require("webpack-merge");
const MinifyPlugin = require("babel-minify-webpack-plugin");
// const base = require("./webpack.base.js");
const custom = require("./webpack.custom.js");

module.exports = merge(
  // base,
  custom,
  {
    plugins: [new MinifyPlugin()],
  }
);
