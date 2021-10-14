const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
  entry: {
    "custom/js/custom": "./src/custom/js/custom.js",
  },
  plugins: [new CleanWebpackPlugin(["dist/custom/js"])],
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist/"),
  },
};
