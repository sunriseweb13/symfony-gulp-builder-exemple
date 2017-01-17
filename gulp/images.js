'use strict';

var gulp = require('gulp');
var conf = require('../gulp_conf/conf');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
var imageop = require('gulp-image-optimization');
var cache = require('gulp-cache');
var rename = require('gulp-rename');
var utils = require('./utils');

var options = conf.options;
var prod = argv.prod;
var compressing = prod && options.imageop;

gulp.task('img', function () {
    return gulp.src(conf.assets.img)
        .pipe(cache(gulpif(compressing, imageop({
            progressive: true, 
            interlaced: true
        }))))
        .pipe(gulp.dest('./web/sources'))
        .pipe(rename(function (path) {
            path.dirname = path.dirname.replace(/src|app/, '')
                .replace(utils.formatPathReverse('/Resources/public'), '')
                .replace(utils.formatPathReverse('/img'), '')
                .replace(/(\w+)Bundle/, '$1')
                .toLowerCase()
        }))
        .pipe(gulp.dest('./web/sources/img'));
});

gulp.task('cache:clear', function (done) {
  return cache.clearAll(done);
});

