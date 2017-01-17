/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are split into several files in the gulp directory
 *  because putting it all here was too long
 */

'use strict';

var gulp = require('gulp');
var fs = require('fs');
var path = require('path');

/**
 *  This will load all js files in the gulp directory
 *  in order to load all gulp tasks
 */
fs.readdirSync('./gulp').filter(function(file){
    return (/\.js$/i).test(file);
}).map(function(file) {
    require('./gulp/' + file);
});

/**
 *  Default task clean web/sources and web/dist directories and launch the
 *  main build task
 */
gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
