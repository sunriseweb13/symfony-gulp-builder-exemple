'use strict';

var dirBase = '{app,src}/**/Resources/public';

exports.options = {
    imageop: true
}

exports.browserSync = {
    proxy: 'symfony-gulp-builder:8080',
    startPath: '/app_dev.php'
}

exports.inject = {
    styles:  '<link rel="stylesheet" href="{{ asset("[filePath]") }}" />',
    scripts: '<script src="{{ asset("[filePath]") }}"></script>'
}

exports.templates  = ['./{app,src}/**/*.twig'];

exports.assets = {
    styles:  {
        css: [dirBase+'/**/*.css'],
// Add your CSS preprocessors below
        sass:[dirBase+'/**/*.scss'] // ex: sass
    },
    scripts: {
        js: [dirBase+'/**/*.js']
// Add your JS preprocessors below
    },
    img:   [dirBase+'/**/img/**/*.{png,jpg,jpeg,gif,svg}'],
    fonts: [dirBase+'/**/fonts/**/*.{eot,woff,woff2,ttf,otf,svg}'],
    components: ['app/Resources/components'] // if bower is installed
};
