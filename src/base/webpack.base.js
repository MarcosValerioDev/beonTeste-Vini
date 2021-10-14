const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
  entry: {
    "loader/v4": "./src/js/core/v4/loader.js",
    "core/js/sliders": "./src/js/slider/init.js",
    "core/js/popup": "./src/js/popup/popup.js",
    "core/js/tag_popup": "./src/js/tag_popup/init.js",
    "core/js/easteregg": "./src/js/easteregg/init.js",
    "core/js/clock": "./src/js/clock/init.js",
    "core/js/magicflag": "./src/js/magicflag/init.js",
    "core/js/notification": "./src/js/notification/init.js",
  },
  plugins: [
    new CleanWebpackPlugin(["dist/loader"]),
    new CleanWebpackPlugin(["dist/core/js"]),
  ],
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist/"),
  },
};
