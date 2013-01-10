/*
 * bear
 * https://github.com/tvooo/bear
 *
 * Copyright (c) 2012 Tim von Oldenburg
 * Licensed under the MIT license.
 */

var http = require('http'),
    fs = require('fs'),
    http = require('http'),
    url = require('url'),
    hb = require('handlebars'),
    director = require('director'),
    namp = require('namp'),
    async = require('async'),
    mime = require('mime'),
    jsdom = require('jsdom'),
    path = require('path'),
    $ = require('jquery'),
    wrench = require('wrench');

var red, blue, reset;
red   = '\033[31m';
blue  = '\033[34m';
green  = '\033[32m';
reset = '\033[0m';

hb.registerHelper('equal', function(v1, v2, options) {
  if(v1 == v2) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

var registerPartials = function() {
    var partials,
        templates = fs.readdirSync( path.resolve ( config.path.templates ) );
    partials = templates.filter( function( item ) {
        if ( item[0] === '_' ) {
            return item;
        }
    });
    partials.forEach( function( partial ) {
        var name = path.basename( partial, '.html' );
        name = name.substr(1, name.length - 1);
        console.log( 'Registering partial "' + name + '"' );
        var s = fs.readFileSync( path.resolve( config.path.templates, partial ), 'utf8' );
        hb.registerPartial( name, s );
    });
};


hb.registerPartial('navigation', '<ul>' +
                '<li><a href="/">Blog</a></li>' +
                '<li><a href="/projects">Projects</a></li>' +
                '<li><a href="/about">About</a></li>' +
                '</ul>');

var sortByDate = function( a, b ) {
    return new Date( b.metadata.Date ) - new Date( a.metadata.Date );
}

/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/
/*********************** NEW *******************************/

var loadTemplate = function( templateFile ) {
    var tmpl = fs.readFileSync( path.resolve( config.path.templates + templateFile ), 'utf8');

    return hb.compile( tmpl );
};

var loadMarkdown = function( markdownFile ) {
    var markdown = fs.readFileSync( path.resolve( config.path.content + markdownFile ), 'utf8' );
    var html = namp( markdown );
    html.excerpt = $('<div>').html(html.html).find('p').first().html();
    html.url = path.join( '/', path.dirname( markdownFile ), '/' );

    return html;
}


var config = {};

exports.run = function( conf ) {
    config = conf;
    http.createServer(function (req, res) {
        console.log( 'Handling ' + req.url)
        router.dispatch(req, res, function (err) {
            if (err) {
                console.log( err );
                res.writeHead(404);
                res.end();
            }
        });
        //res.end(markdown.toHTML('# Welcome\n\nThis is markdown'));
    }).listen(config.port, config.host);

    console.log('Bear running at http://' + config.host + ':' + config.port + '/');
    return 'awesome';
};

var deployFile = function( file, i ) {
    var input  = path.resolve( config.path.content, file ),
        output;
    stats = fs.statSync( input );
    if ( stats.isDirectory() ) {
        // Create directory
        output = path.resolve( config.path.www, file );
        if ( fs.existsSync( output ) ) {
            console.log( red + 'Directory exists: ' + reset + output );
        } else {
            console.log( 'Creating directory: ' + output );
            fs.mkdir( output );
        }
        if ( hasChildren( input ) && file.split( path.sep ).length > 0 ) {
            // Create Index
            var type = path.dirname( file + '/' );
            type = file;
            fs.writeFileSync( path.join( output, 'index.html' ), createIndex( type ) );
        }
    } else if ( file === config.index ) {
        // Create home page
        output = path.resolve( config.path.www, 'index.html' );
        fs.writeFileSync( output, createHome() );
    } else if ( path.extname( file ) === '.md' && file.split( path.sep ).length > 1 ) {
        // Compile content page
        var templatePath,
            type = path.dirname( file );
        templatePath = path.join( type, '..', 'single.html' );
        if ( !fs.existsSync( path.resolve( config.path.templates, templatePath ) ) ) {
            templatePath = 'static.html';
        }
        output = path.resolve( config.path.www, path.dirname( file ), 'index.html' );
        console.log( blue + 'CC ' + reset + file /*+ ' -> ' + output + ' using ' + templatePath*/ );
        fs.writeFileSync( output, compile( templatePath, file ) );
    } else {
        // Copy any other file
        output = path.resolve( config.path.www, file );
        console.log( green + 'CP ' + reset + file /*+ ' -> ' + output */);
        fs.writeFileSync( output, fs.readFileSync( input ) );
    }
};

var hasChildren = function( dir ) {
    if ( isDirectory( dir ) ) {
        children = fs.readdirSync( dir );
        for ( i = 0; i < children.length; i++ ) {
            if ( isDirectory( path.join( dir, children[i] ) ) ) {
                return true;
            }
        }
    }
    return false;
}

var isDirectory = function( path ) {
    var stats = fs.statSync( path );
    return stats.isDirectory();
}

var listArticles = function( type ) {
    var files = fs.readdirSync( path.resolve( config.path.content, type ) );

    var dirs = files.filter(function( file ) {
        return isDirectory( path.resolve( config.path.content, type, file) );
    });

    return dirs.map( function( item ) {
        if ( fs.existsSync( path.resolve( config.path.content, type, item, item + '.md' ))) {
            return path.join( type, item, item + '.md' );
        } else {
            return path.join( type, item, 'index.md' );
        }
    });
};

var getNavigation = function( file ) {
    var nav = config.navigation,
        fileSplit = file.split( path.sep )[0],
        id = path.basename( fileSplit, path.extname( fileSplit ) );

    return nav.map( function( item ) {
        if ( id === item.name ) {
            item.active = true;
        } else {
            item.active = false;
        }

        // If URL is defined in config, take that one
        if ( item.url ) {
            return item;
        }

        if ( item.name === '' ) {
            item.url = '/';
        } else {
            item.url = path.join( '/', item.name );
        }
        return item;
    });
};

var createIndex = function( type ) {
    console.log('Creating index for ' + type);
    var result,
        articles;

    articles = listArticles( type ).map( loadMarkdown );

    var tmpl = loadTemplate( path.join( type, 'index.html') );

    return tmpl({
        articles : articles.sort( sortByDate ),
        config : config,
        navigation: getNavigation( type )
    });
};

var createHome = function() {
    var tmpl = loadTemplate( 'index.html' ),
        articles = listArticles( 'articles' ).map( loadMarkdown ),
        projects = listArticles( 'projects' ).map( loadMarkdown );

    return tmpl({
        //articles : articles.sort( sortByDate ),
        config : config,
        articles: articles.sort( sortByDate ),
        projects: projects,
        navigation: getNavigation( '/' )
    });
}

var compile = function( templatePath, markdownPath ) {
    var tmpl,
        html;

    tmpl = loadTemplate( templatePath );
    html = loadMarkdown( markdownPath );

    return tmpl({
        content: html.html,
        meta: html.metadata,
        config: config,
        navigation: getNavigation( markdownPath )
    });
};

exports.deploy = function( conf ) {
    config = conf;
    registerPartials();
    // Copy complete assets folder TODO: should later be done using grunt
    wrench.copyDirSyncRecursive( path.resolve( config.path.assets ), path.resolve( config.path.www, config.path.assets ) );

    // Crawl through content, copy all images and style files and compile markdown files using the according templates
    content = wrench.readdirSyncRecursive( path.resolve( config.path.content ) );
    content.forEach( deployFile );
};