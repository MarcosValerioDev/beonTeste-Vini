const merge = require("webpack-merge");
const base = require("./webpack.base.js");

module.exports = merge(base, {
  watch: true,
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist",
  },
});
