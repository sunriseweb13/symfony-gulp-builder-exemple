'use strict';

var gulp = require('gulp');
var conf = require('../gulp_conf/conf');
var sass = require('gulp-sass');

gulp.task('css', function () {
    return gulp.src(conf.assets.styles['css'])
        .pipe(gulp.dest('./web/sources'));
});

gulp.task('sass', function () {
    return gulp.src(conf.assets.styles['sass'])
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./web/sources'));
});


