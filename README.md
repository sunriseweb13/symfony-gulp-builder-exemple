# Symfony Gulp Builder

This repo is an alternative to Assetic based on gulp.

## How Does it Work?

There are 2 environments that you can use : _dev_ and _prod_ (that do not match the prod and dev environment of symfony).

- In the **dev** environment, all JS and CSS files listed into `gulp_conf/conf.inject.json` are compiled before being injected between injection placeholder tags in the source code of your templates. Each file is still served individually and vendor files are always injected before app files.  
While you are working, it monitors your changes and maintains your output files.  
Run `gulp` or `gulp --serve` (if you want additionnaly lauching BrowserSync) to use the dev environnement.

- In the **prod** environment, JS and CSS files are additionally concatenated and minified. If the compressing options is set to true, images are optimized. The JS and CSS files are served from a different location (`web/css` and `web/js` folders) so any relative paths inside your CSS files will break. Don't worry! To fix this, The task parses your CSS files and corrects the paths internally to reflect the new location.  
Run `gulp --prod` or `gulp --prod --serve` to use the prod environnement.

## Directory structure

```
├── app/
├── bin/
│
├── gulp/
│   ├── conf.js
│   ├── images.js
│   ├── main.js
│   ├── misc.js
│   ├── scripts.js
│   ├── styles.js
│   ├── update-conf.js
│   └── utils.js
│
├──  gulp_conf/
│    ├── conf.inject.json
│    └── conf.js
│
├── nodes_modules/
│
├── src/
│   ├── AppBundle/
│   │   ├── Controller/
│   │   ├── Resources/
│   │   │   └── public/
│   │   │       ├── fonts/
│   │   │       ├── img/
│   │   │       ├── scripts/
│   │   │       └── styles/
│   │   │
│   │   └── AppBundle.php
│   │
│   └── DemoBundle/
│       ├── Controller/
│       ├── Resources/
│       │   └── public/
│       │       ├── fonts/
│       │       ├── img/
│       │       ├── scripts/
│       │       └── styles/
│       │
│       └── DemoBundle.php
│
├── tests/
├── vendor/
│
├── web/
│   ├── bundles/
│   ├── components/(optional)
│   ├── css/
│   ├── fonts/
│   ├── img/
│   ├── js/
│   └── sources/
│
├── .bowerrc (optional)
├── .gitignore
├── bower.json (optional)
├── gulpfile.js
└── package.json

```

## Use Gulp tasks

### Main tasks

- `gulp` or `gulp --serve` to work in dev environnement

- `gulp --prod` or `gulp --prod --serve` to open the project in prod environnement

### Individual tasks

- `gulp assets` to process assets, compile it (eventually) and serve it in `web/sources` and `web/img` folder

- `gulp clean` to delete `web/css`, `web/fonts`, `web/img`, `web/js` and `web/sources` folders

- `gulp conf:update` to save a template containing injection placeholder tags into the `gulp_conf/conf.inject.json` file

- `gulp inject:reset` to clean all between the injection placeholder tags

- `gulp assets:show:diff` to check if all of JS and CSS files paths listed into `gul_conf/conf.inject.json` exist and to see the list of CSS and JS app files paths available to be injected into your views.

- `bower install --save <package>` to install frontend dependencies

- `gulp bower:list` to see the list of bower files paths available to be injected into your templates. If some files are incorrect or missing you can always [override](https://github.com/taptapship/wiredep#bower-overrides) `bower.json`.

- `gulp help` to display available gulp commands

## How use it?

### 1. Edit gulp_conf/conf.js

```js
// gulp_conf/conf.js

'use strict';

var dirBase = '{app,src}/**/Resources/public';

exports.options = {
    imageop: true // images optimization actived
}

exports.browserSync = {
    proxy: 'your_project:8080', //Replace this with your vhost url
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
// Add your CSS preprocessors tasks below
        sass:[dirBase+'/**/*.scss'] // ex: sass
    },
    scripts: {
        js: [dirBase+'/**/*.js']  
// Add your JS preprocessors tasks below
    },
    img:   [dirBase+'/**/img/**/*.{png,jpg,jpeg,gif,svg}'],
    fonts: [dirBase+'/**/fonts/**/*.{eot,woff,woff2,ttf,otf,svg}']
};
```
Configuration : you can customize gulp files below

- `gulp/images.js`: contains the image task. You can custom this file by changing plugins options for exemple.

- `gulp/styles.js`: contains the styles tasks. You can add or removing tasks according CSS prepocessor you are using in your project. Don't forget to declare these tasks names in `exports.assets[styles]` into `gulp_conf/conf.js`. You can also add plugins*.

- `gulp/scripts.js`: contains the scripts tasks. You can add or removing tasks according JS prepocessor you are using in your project. Don't forget to declare this tasks names in `exports.assets[scripts]` into `gulp_conf/conf.js`.You can also add plugins*.

*To use a new plugin it is necessary to run `npm install --save-dev <package>`

### 2. Edit your templates by adding placeholder tag

Each pair of comments are the injection placeholders.

_app/Resources/views/base.html.twig_

```html

<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>{% block title %}Welcome!{% endblock %}</title>
        {% block stylesheets %}{% endblock %}
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}" />
        <!-- inject:head:js -->
        <!-- endinject -->
    </head>
    <body>
        {% block body %}{% endblock %}
        {% block javascripts %}
        <!-- inject:js -->
        <!-- endinject -->
        {% endblock %}
    </body>
</html>
```
_src/DemoBundle/Resources/views/layout.html.twig_

```html
{% extends "::base.html.twig" %}

{% block stylesheets %}
    {{ parent() }}
        <!-- inject:css -->
        <!-- endinject -->
{% endblock %}
{% block body  %}
{% endblock %}

{% block javascripts %}
    {{ parent() }}
        <!-- inject:js -->
        <!-- endinject -->
{% endblock %}

```

### 3. Configure gulp_conf/conf.inject.json

Before starting your project, **gulp_conf/conf.inject.json** only contains an empty array:

```js
[]
```

Run `gulp conf:update` in order to fill it.

This task searches through your templates containing injection placeholder tags and ask you what files (stylesheets and/or scripts according to starting placeholder tag found) you want add in the selected template.
At the end of the task, you can edit `gulp_conf/conf.inject.json`(to change the order your scripts must be included for exemple).   
Rerun `gulp conf:update` each time you want save a new template into `gulp_conf/conf.inject.json`.  

Exemple :

1) Step 1 : Select your template

![CMD1](http://sunriseweb.fr/doc/cmd-1.png)

2) Step 2 : Select CSS files you want to inject in the template selected previously

![CMD2](http://sunriseweb.fr/doc/cmd-2.png)

2) Step 3 : Select JS files you want to inject in the template selected previously

![CMD3](http://sunriseweb.fr/doc/cmd-3.png)

4) Step 4 : Run `gulp --serve` (if it is not already running) to take account of the update of the `gulp_conf/conf.inject.json` file

## Get started
This repository is an example of a symfony (version 2.8) project on which this gulp configuration is installed. It uses bower and sass.

To run the demo :

- Clone this repository

- Run `php composer.phar install`

- Run `bower install` and `npm install` to install the required dependencies.

- Run `gulp --serve` for work in dev environnement with browserSync or `gulp --prod --serve` to test the prod environnement.
