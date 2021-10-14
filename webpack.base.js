const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
  entry: {
    // "base/loader/v4": "./src/base/src/js/core/v4/loader.js",
    "base/core/js/sliders": "./src/base/src/js/slider/init.js",
    "base/core/js/popup": "./src/base/src/js/popup/popup.js",
    "base/core/js/tag_popup": "./src/base/src/js/tag_popup/init.js",
    "base/core/js/easteregg": "./src/base/src/js/easteregg/init.js",
    "base/core/js/clock": "./src/base/src/js/clock/init.js",
    "base/core/js/magicflag": "./src/base/src/js/magicflag/init.js",
    "base/core/js/notification": "./src/base/src/js/notification/init.js",
  },
  plugins: [
    new CleanWebpackPlugin(["dist/base/loader"]),
    new CleanWebpackPlugin(["dist/base/core/js"]),
  ],
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist/"),
  },
};
