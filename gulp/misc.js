'use strict';

var gulp = require('gulp');
var wiredep = require('wiredep');
var path = require('path');
var through2 = require('through2');
var rename = require('gulp-rename');
var gutil = require('gulp-util');
var utils = require('./utils');
var fs = require('fs');

var paths = JSON.parse(fs.readFileSync('./gulp_conf/conf.inject.json'));

var dirSearch = ['./web/{sources,components}/**/*.css', './web/{sources,components}/**/*.js'];
var gulpTasks = [
{
    name: 'gulp',
    desc: 'Build your application to work in dev environnement without Browsersync'
},
{
    name: 'gulp --serve',
    desc: 'Build your application to work in dev environnement with Browsersync'
},
{
    name: 'gulp --prod',
    desc: 'Build an optimized version of your application without Browsersync'
},
{
    name: 'gulp --prod --serve',
    desc: 'Build an optimized version of your application with Browsersync'
},
{
    name: 'gulp assets',
    desc: 'Process assets, compiles it (eventually) and serves it in web/sources folder'
},
{
    name: 'gulp clean',
    desc: 'Delete web/css, web/fonts, web/img, web/js and web/sources folders'
},
{
    name: 'gulp conf:update',
    desc: 'Save a template containing inject tag into the gulp_conf/conf.inject.json file'
},
{
    name: 'gulp inject:reset',
    desc: 'Clean all between the inject tags'
},
{
    name: 'gulp assets:show:diff',
    desc: 'Compare assets saved into your gulp/conf.inject.json file and assets available under the sources web directory'
},
{
    name: 'gulp bower:list',
    desc: 'Display the list of bower files paths available to be injected into your templates. If some files are incorrect or missing you can always override bower.json.'
}
];

var arrayPath = [], arrayPath2 = [], arrayPath3 = [];

var header = function(length){
    console.log('-'.repeat(length)+'\n Path \n'+'-'.repeat(length));
}

var footer = function(length){
    console.log('-'.repeat(length));
}

var line = function(pattern, length){
    return pattern.repeat(length);
}

var drawLine = function(pattern, length){
    console.log(line(pattern,length));
}

gulp.task('bower:list', function() {
    try{
        var wd = utils.wiredepPath();
        header(55);
        for(var i=0;i<wd.length;i++){
            var filepath = utils.formatPath(path.relative(process.cwd(), wd[i]));
            console.log(' ./'+filepath);
        }
        footer(55);
    }
    catch(e){
        console.log(e);
    }
});

var assetsList = function(){
    return gulp.src(dirSearch, {
        read: false
    })
    .pipe(through2.obj(function(file, enc, callback) {
        var filepath = utils.formatPath(path.relative(process.cwd(), file.path));
        this.push(filepath);
        callback();
    }))
    .on('data', function(record) {
        arrayPath.push(record);
    });
}

var assetsList2 = function(arrayPath2){
    arrayPath3 = [];
    return gulp.src(arrayPath2, {
        read: false
    })
    .pipe(through2.obj(function(file, enc, callback) {
        var filepath = utils.formatPath(path.relative(process.cwd(), file.path));
        this.push(filepath);
        callback();
    }))
    .on('data', function(record) {
        arrayPath3.push(record);
    });
}

var checkDiff = function(arrayPath, arrayPath2, step){
    drawLine('',1);
    var j = 0;
    for (var i in arrayPath2) {
        var p = arrayPath2[i];
        if(step == 'step-1')
            p = p.substring(p.indexOf('web'))
        if(arrayPath.indexOf(p) === -1){
            if(p.indexOf('*') === -1)
                j++;
            if(j==1){
                if(step == 'step-1')
                    gutil.log(gutil.colors.red('WARNING'), 'Files below are listed into', gutil.colors.magenta('./gulp_conf/conf.inject.json'), 'file but they don\'t exist.');
                else
                    gutil.log(gutil.colors.blue('INFO'), 'Files below are stored in your application but not used. Add them to', gutil.colors.magenta('./gulp_conf/conf.inject.json') ,'to change this.');
                drawLine('',1);
            }
            if(!(step == 'step-1' && p.indexOf('*') !== -1))
                console.log(' ./'+p);
        }
    }
    if(j == 0)
        if(step == 'step-1')
            gutil.log(gutil.colors.green('OK'), 'All of your CSS and JS files listed into', gutil.colors.magenta('./gulp_conf/conf.inject.json'), 'exist.');
        else
            gutil.log(gutil.colors.green('OK'), 'All of your CSS and JS files stored in your application are used.');
}

gulp.task('diff', function() {
    arrayPath = [];
    arrayPath2 = utils.confPaths();
    assetsList().on('end', function () {
        assetsList2(arrayPath2).on('end', function () {
            arrayPath3.sort();
            checkDiff(arrayPath, arrayPath2, 'step-1');
            checkDiff(arrayPath3, arrayPath, 'step-2');
            drawLine('',1);
        });
    });
});

gulp.task('help', function() {
    var max = 0;
    for (var i in gulpTasks) {
        if(gulpTasks[i].name.length > max)
            max = gulpTasks[i].name.length;
    }
    var espace = 10+max;
    drawLine('',1);
    console.log('Available gulp commands:');
    for (i in gulpTasks) {
        console.log(' '+gulpTasks[i].name+line(' ',espace-gulpTasks[i].name.length)+gulpTasks[i].desc);
    }
    drawLine('',1);
});

gulp.task('assets:show:diff', function () {
    gulp.start('diff');
});
