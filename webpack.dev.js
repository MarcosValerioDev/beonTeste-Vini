const merge = require("webpack-merge");
const base = require("./webpack.base.js");
const custom = require("./webpack.custom.js");

module.exports = merge(base, custom, {
  watch: true,
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist",
  },
});
