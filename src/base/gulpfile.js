"use strict";

var gulp = require("gulp");
var webpack = require("webpack-stream");
var sass = require('gulp-sass');
var minifyCSS = require("gulp-csso");
var browserSync = require("browser-sync").create();

// css

gulp.task("sass", function () {
  return gulp
    .src("src/**/css/*.scss")
    .pipe(sass())
    .pipe(gulp.dest("dist/"))
    .pipe(browserSync.stream());
});

gulp.task("sass-watch", function () {
  return gulp.watch("src/**/*.scss", gulp.parallel("sass"));
});

gulp.task("minify", function () {
  return gulp
    .src("src/**/css/*.scss")
    .pipe(sass())
    .pipe(minifyCSS())
    .pipe(gulp.dest("dist/"));
  // .pipe(browserSync.stream());
});

//

gulp.task("sync-js", function () {
  return gulp
    .src("src/**/js/*.js")
    .pipe(gulp.dest("dist"))
    .pipe(browserSync.stream());
});

gulp.task("sync-watch", function () {
  return gulp.watch("src/**/js/*.js", gulp.parallel("sync-js"));
});

// webpack
gulp.task("dev-js-core", function () {
  return gulp
    .src("src/@base/js/core/**/loader.js")
    .pipe(webpack(require("./webpack.dev.js")))
    .pipe(gulp.dest("dist"));
});

gulp.task("webpack-dev", gulp.parallel("dev-js-core"));

gulp.task("webpack-prod", function () {
  return gulp
    .src("src/@base/js/core/**/loader.js")
    .pipe(webpack(require("./webpack.prod.js")))
    .pipe(gulp.dest("dist"));
});

gulp.task("bsinit", function () {
  browserSync.init({
    server: {
      baseDir: "./",
    },
    socket: {
      domain: "localhost:3000",
    },
  });

  gulp.watch("./tests/**/*.html").on("change", browserSync.reload);
  // gulp.watch("./dist/**/*.css").on('change', browserSync.reload);
});

// main tasks

gulp.task(
  "build",
  gulp.parallel(
    "minify",
    "webpack-prod"
    // "sync-js"
  )
);
gulp.task(
  "dev",
  gulp.parallel(
    "bsinit",
    "webpack-dev",
    "sass",
    "sass-watch"
    // "sync-watch"
  )
);
