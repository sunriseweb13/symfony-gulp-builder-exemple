'use strict';

var gulp = require('gulp');
var conf = require('../gulp_conf/conf');

gulp.task('js', function () {
    return gulp.src(conf.assets.scripts['js'])
        .pipe(gulp.dest('./web/sources'));
});

