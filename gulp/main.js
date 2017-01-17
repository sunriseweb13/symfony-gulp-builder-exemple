'use strict';

var gulp = require('gulp');
var gulpif = require('gulp-if');
var argv = require('yargs').argv;
var browserSync = require('browser-sync').create();
var conf = require('../gulp_conf/conf');
var fs = require('fs');
var modifyCssUrls = require('gulp-modify-css-urls');
var path = require('path');
var reload = browserSync.reload;
var runSequence = require('run-sequence');
var series = require('stream-series');
var utils = require('./utils');

var $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*', 'del', 'path']
});

var prod = argv.prod;
var serve = argv.serve;

var stylesTasks = [], 
stylesDir = [], 
scriptsTasks = [], 
scriptsDir = [],
buildTasks = [],
compiled = {};

function addTaskDir(arrayVar, arrayTask, arrayDir){
    if (arrayVar.hasOwnProperty(name)) {
        arrayTask.push(name);
        arrayDir.push(arrayVar[name]);
        compiled[path.extname(arrayVar[name][0]).substring(1)] = name;
    }    
}

for (var name in conf.assets.styles) {
    addTaskDir(conf.assets.styles, stylesTasks, stylesDir);
}

for (name in conf.assets.scripts) {
    addTaskDir(conf.assets.scripts, scriptsTasks, scriptsDir);
}

gulp.task('styles', stylesTasks);
gulp.task('scripts', scriptsTasks);

gulp.task('fonts', function () {
    return gulp.src(conf.assets.fonts)
        .pipe(gulp.dest('./web/sources'));
});

var injectOptions = {
    ignorePath: '/web/',
    addRootSlash: false,
    transform: function (filePath, file, i, length) {
        if (path.extname(filePath) === '.js') {
            console.log('Inject script  '+ filePath);
            return conf.inject.scripts.replace('[filePath]',filePath);
        }
        else if(path.extname(filePath) === '.css'){
            console.log('Inject stylesheet  '+ filePath);
            return conf.inject.styles.replace('[filePath]',filePath);        
        }
        return null;
    }
};

var injectOptions2 = Object.assign({}, injectOptions);
injectOptions2['starttag'] = '<!-- inject:head:{{ext}} -->';

function transformCssUrls(url, filePath){
    if(url.indexOf('/') === 0){
        return url.slice(url.indexOf('/'));
    }
    if(url.indexOf('http:') !== -1){
        return url.slice(url.indexOf('http:')).replace('http:', 'http:/');
    }
    if(url.indexOf('data:') !== -1){
        return url.slice(url.indexOf('data:'));
    }
    var split = path.resolve(filePath,'../'+url).split(path.join(path.resolve(),utils.formatPath('/web')));
    return utils.formatPath(split[1]);
}

var fileCssStream = function(paths, filename){
    return gulp.src(paths)
        .pipe(modifyCssUrls({
            modify: function (url, filePath) {
                return transformCssUrls(url, filePath);
            }
        }))
        .pipe(gulpif(prod, $.concat(filename+'.css')))
        .pipe(gulpif(prod, $.cssmin()))
        .pipe(gulpif(prod, $.rev()))
        .pipe(gulpif(prod, gulp.dest('./web/dist/css')));
}

var fileJsStream = function(paths, filename){
    return gulp.src(paths)
        .pipe(gulpif(prod, $.concat(filename+'.js')))
        .pipe(gulpif(prod, $.jsmin()))
        .pipe(gulpif(prod, $.rev()))
        .pipe(gulpif(prod, gulp.dest('./web/dist/js'))); 
}

var injectFiles = function(paths){
    var vendorStreamCss = fileCssStream(paths.css.vendor, 'vendor-'+paths.output),
    vendorStreamJs      = fileJsStream(paths.javascript.vendor, 'vendor-'+paths.output),
    appStreamCss        = fileCssStream(paths.css.app, paths.output),
    appStreamJs         = fileJsStream(paths.javascript.app, paths.output),  
    headStreamJs        = fileJsStream(paths.javascript.head, 'head-'+paths.output);

    var injectJs  = series(vendorStreamJs, appStreamJs);
    var injectCss = series(vendorStreamCss, appStreamCss);
    
    gulp.src(paths.dir+paths.view)
        .pipe($.inject(headStreamJs, injectOptions2))
        .pipe($.inject(injectJs, injectOptions))
        .pipe($.inject(injectCss, injectOptions))
        .pipe(gulp.dest(paths.dir))
        .pipe(reload({stream: true}));
}

gulp.task('inject', function() {
    var paths = JSON.parse(fs.readFileSync('./gulp_conf/conf.inject.json'));
    for (var i in paths) {
        injectFiles(paths[i]);
    }
});

gulp.task('inject:reset', function () {
    return gulp.src(conf.templates)
        .pipe($.inject(gulp.src('empty.js'), {empty:true}))
        .pipe(gulp.dest('./'));
});

gulp.task('assets', ['styles', 'scripts', 'img', 'fonts']);
gulp.task('clean', $.del.bind(null, ['web/sources', 'web/dist']));

function deleteFile(eventPath, ext){
    var destFilePath = utils.destFilePath(eventPath, ext);
    $.del.sync(destFilePath);
    if(ext == null){
        var destFileShortPath = utils.findShortPath(destFilePath);
        $.del.sync(destFileShortPath);
        $.util.log('File' , $.util.colors.magenta(destFileShortPath), 'has been', $.util.colors.cyan('deleted'));
    }
    $.util.log('File' , $.util.colors.magenta(destFilePath), 'has been', $.util.colors.cyan('deleted'));
}

function watchActions(event, ext){
    $.util.log('File' , $.util.colors.magenta(event.path), 'has been', $.util.colors.cyan(event.type));
    var type = path.extname(event.path).substring(1);
    var isImgOrFont = (ext == 'img' || ext == 'fonts');
    try{
        if(event.type === 'changed' && !isImgOrFont){
            runSequence([compiled[type]], function(){
                var destFilePath = utils.destFilePath(event.path, ext);
                if(path.basename(event.path).indexOf('_') === 0)
                    reload();
                else
                    reload(destFilePath);
            });
        }
        else{
            if (event.type === 'deleted') {
                if(isImgOrFont) 
                    ext = null;
                deleteFile(event.path, ext);
            }
            if(!isImgOrFont){
                if(event.type !== 'renamed'){
                    runSequence([compiled[type]], 'inject', 'diff', function(){
                        reload();
                    });
                }
            }
        }
    }catch(e){
        runSequence('assets', 'inject', 'diff');
    }
}

gulp.task('preServe', function (callback) {
    runSequence('assets', 'inject:reset', 'inject', callback);
});

gulp.task('build', ['preServe'], function(){
    if(argv.serve){
        browserSync.init({
            proxy:  conf.browserSync.proxy,
            startPath: conf.browserSync.startPath
        });
    }
    if(prod)
        return;  
        
    gulp.watch(stylesDir).on('change', function (event) {
        watchActions(event, 'css');
    });
    gulp.watch(scriptsDir).on('change', function (event) {
        watchActions(event, 'js');
    });
    gulp.watch(conf.assets.img, ['img']).on('change', function (event) {
        watchActions(event, 'img');
    });
    gulp.watch(conf.assets.fonts, ['fonts']).on('change', function (event) {
        watchActions(event, 'fonts');
    });
    gulp.watch('./gulp_conf/conf.inject.json').on('change', function (event) {
        runSequence('inject:reset', 'inject', 'diff');
    });
    gulp.watch(conf.templates).on('change', function (event) {
        reload();
    });
});