'use strict';

var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var conf = require('../gulp_conf/conf');
var fs = require('fs');
var path = require('path');
var prompt = require('gulp-prompt');
var through2 = require('through2');
var utils = require('./utils');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*', 'del']
});

var paths = JSON.parse(fs.readFileSync('./gulp_conf/conf.inject.json'));

function string_src(filename, string) {
  var src = require('stream').Readable({ objectMode: true })
  src._read = function () {
    this.push(new gutil.File({
      cwd: "",
      base: "",
      path: filename,
      contents: new Buffer(string)
    }))
    this.push(null)
  }
  return src
}

function createPathsArray(paths){
     var length = paths.length;
     var str = length > 0 ? "\n" : "";
     for(var i=0;i<length;i++){
        var last = i<length-1 ? "," : "";
        str += '            "./'+paths[i]+'"'+last+'\n';
     }   
     str += length > 0 ? "        ]" : "]";
     return str;
}

function newEl(params,tplPaths){
   var json = '{\n';
     json += '    "dir": "./'+params.dir+'",\n';
     json += '    "view": "/'+params.view+'",\n';
     json += '    "output": "'+params.output+'",\n';
     json += '    "javascript":{\n';
     json += '        "vendor":[';
     json += createPathsArray(tplPaths["js"]["vendor"]);
     json += ',\n';
     json += '        "head":[],\n';
     json += '        "app":[';
     json += createPathsArray(tplPaths["js"]["app"]);
     json += '\n';
     json += '    },\n';
     json += '    "css":{\n';
     json += '        "vendor":[';
     json += createPathsArray(tplPaths["css"]["vendor"]);
     json += ',\n';
     json += '        "app":[';
     json += createPathsArray(tplPaths["css"]["app"]);
     json += '\n';
     json += '    }\n';
     json += '}';
  return json;
}

var arrayPath = [];

function getParams(tplFile){
    var output, bundlePrefix;
    var split = tplFile.split('/');
    var dir   = split.splice(0,split.length-1).join('/');
    var view  = split.pop();

    split = tplFile.split('/');
    if(split[0] == 'app'){
        bundlePrefix = null;
        output = view.substring(0,view.indexOf('.html.twig'));
    }
    else if(split[0] == 'src'){
        if(tplFile.indexOf('Bundle') !== -1){
            bundlePrefix = tplFile.substring(0,tplFile.indexOf('Bundle')).split('/').pop().toLowerCase()
            output = bundlePrefix;
        }
        if(dir.split('/').pop() != 'views')   
            output += '-'+dir.split('/').pop()+'-'+view.substring(0,view.indexOf('.view.twig'));
    }
    return {dir:dir, view:view, output:output.toLowerCase(), bundlePrefix:bundlePrefix};
}

function addSources(tplFile, ext){
    var tplPaths = {js:{vendor:[],app:[]},css:{vendor:[],app:[]}};  
    var params = getParams(tplFile);
    var arrayPath = {css:[],js:[]};
    var arrayPrompt = [];
    var dirSearch = [];
    
    try{
        var wd = utils.wiredepPath();
        for(var i=0;i<wd.length;i++){
            var filepath = utils.formatPath(path.relative(process.cwd(), wd[i]));
            dirSearch.push(filepath);  
        }
    }
    catch(e){//console.log(e);
    }
    
    if(ext.indexOf('css') !== -1) {
        dirSearch.push('./web/sources/**/*.css');
    }
    if(ext.indexOf('js') !== -1){
        dirSearch.push('./web/sources/**/*.js');
    }
    
    gulp.src(dirSearch, {read: false})
    .pipe(through2.obj(function(file, enc, callback) { 
        var filepath = utils.formatPath(path.relative(process.cwd(), file.path));
        this.push(filepath);
        callback();
    }))
    .on('data', function(record) {
        arrayPath[utils.guessExt(record)].push(record);
    })
    .on('end', function () {
        if(arrayPath['css'].length > 0 && ext.indexOf('css') !== -1){
            arrayPrompt.push({
                type: 'checkbox',
                name: 'styles',
                message: 'What stylesheets would you like to inject in the selected template?',
                choices: arrayPath['css']
                
            }); 
        }
        if(arrayPath['js'].length > 0 && ext.indexOf('js') !== -1){
            arrayPrompt.push({
                type: 'checkbox',
                name: 'scripts',
                message: 'What scripts would you like to inject in the selected template?',
                choices: arrayPath['js']
            }); 
        }
        gulp.src(dirSearch, {read: false}).pipe(prompt.prompt(arrayPrompt, function(res){
            console.log('');
            var files = [];
            if(res.styles)
                files = files.concat(res.styles);
            if(res.scripts)
                files = files.concat(res.scripts);           
            for(var i=0;i<files.length;i++){
                if(files[i].indexOf('web/components') !== -1)
                    tplPaths[utils.guessExt(files[i])]['vendor'].push(files[i]);
                else
                    tplPaths[utils.guessExt(files[i])]['app'].push(files[i]);
            }
            if(files.length > 0){
                write(params,tplPaths);
                gutil.log('File' , gutil.colors.magenta('.gulp_conf/conf.inject.json'), 'has been successfuly', gutil.colors.green('updated'));
            }
            else{
               gutil.log('No change has been saved into', gutil.colors.magenta('.gulp_conf/conf.inject.json'));
            }
        }));
    });
}

function write(params,tplPaths){
    var json = newEl(params,tplPaths);
    var txt = '';
    var readStream = fs.createReadStream('./gulp_conf/conf.inject.json');

    readStream.setEncoding('utf8');

    readStream
    .on('data', function (chunk) {
        txt = chunk.slice(0, -1);
        if(paths.length > 0)
            txt = txt+',';
        txt += '\n'+json;
        txt += ']';
    })
    .on('end', function () {
        return string_src('./gulp_conf/conf.inject.json', txt)
            .pipe(gulp.dest('.'))
    });    
}

gulp.task('conf:update', function () {
  gulp.src(conf.templates, {read: true})
    .pipe(through2.obj(function(file, enc, callback) { 
        if(file.contents.toString().indexOf('<!-- endinject -->') !== -1){
            var filepath = utils.formatPath(path.relative(process.cwd(), file.path));
            var found = false;     
            for(var i=0;i<paths.length;i++){
                if(paths[i].dir+paths[i].view == './'+filepath)
                    found = true;    
            }
            if(!found)
                this.push(filepath);
        }
        callback();
    }))
    .on('data', function(record) {
        arrayPath.push(record);
    })
    .on('end', function () {
        var nothingToAdd = arrayPath.length == 0;
        if(nothingToAdd)
            gutil.log(gutil.colors.white('All your twig files containing "<!-- endinject -->" are already saved into', gutil.colors.magenta('.gulp_conf/conf.inject.json')));
        
        gulp.src(conf.templates, {read: false})
        .pipe(gulpif(!nothingToAdd, prompt.prompt([{
            type: 'list',
            name: 'tpl',
            message: 'What template would you like to save?',
            choices: arrayPath
        }], function(res){
            var ext = [];
             gulp.src([res.tpl], {read: true})
            .pipe(through2.obj(function(file, enc, cb) {
                if(file.contents.toString().indexOf('<!-- inject:css -->') !== -1)
                    ext.push('css');
                if(file.contents.toString().indexOf('<!-- inject:js -->') !== -1)
                    ext.push('js');
                
                this.push(ext);
            }))
            .on('data', function(record) {
                addSources(res.tpl, record.join(','));
            });
        })));
    });
});