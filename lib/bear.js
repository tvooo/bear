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
    //nQuery = require('nquery');

var _404 = function( res ) {
    res.writeHead(404);
    res.end();
}

mime.charsets = {
  lookup: function(mimeType) {
    // Assume UTF-8, binary if image
    return (/image|octet/).test(mimeType) ? 'binary' : 'utf8';
  }
}


hb.registerHelper('equal', function(v1, v2, options) {
  if(v1 == v2) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

hb.registerPartial('navigation', '<ul>' +
                '<li><a href="/">Blog</a></li>' +
                '<li><a href="/projects">Projects</a></li>' +
                '<li><a href="/about">About</a></li>' +
                '</ul>');

var sortByDate = function( a, b ) {
    return new Date( b.metadata.Date ) - new Date( a.metadata.Date );
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// Get a single file
var getAssets = function( file ) {
    var result,
        res = this.res,
        mimetype = mime.lookup( file ),
        encoding = mime.charsets.lookup( mimetype );

    fs.readFile( config.path.assets + file, encoding, function (err,data) {
        if (err) {
            return _404( res );
        }
        var template = hb.compile( data );
        res.writeHead(200, { 'Content-Type': mimetype });
        res.end(data, encoding);
    });
};

// Get a single file
var getAssetsContent = function( file, res ) {
    var result,
        encoding = 'utf8';
        //mimetype = mime.lookup( file );

    var mimetype = 'text/plain';
    if ( file.endsWith('css') ) {
        mimetype = 'text/css';
    } else if ( file.endsWith('png') ) {
        mimetype = 'image/png';
        encoding = 'binary';
    } else if ( file.endsWith('jpg') ) {
        mimetype = 'image/jpg';
        encoding = 'binary';
    }

    fs.readFile( config.path.content + file, encoding, function (err,data) {
        if (err) {
            return _404( res );
        }
        var template = hb.compile( data );
        res.writeHead(200, { 'Content-Type': mimetype });
        res.end(data, encoding);
    });
};

var loadTemplate = function( template, callback ) {
    fs.readFile( config.path.templates + template, 'utf8', function( err, template ) {
        var compiled_template;

        if (err) {
            return _404( res );
        }

        compiled_template = hb.compile( template );
        callback( null, compiled_template );
    });
}

var loadArticle = function( type, id, callback ) {
    var html,
        excerpt,
        contentPath = path.join( config.path.content, type, id + '.md' );

    fs.readFile( contentPath, 'utf8', function( err, markdown ) {
        if (err) {
            return _404( res );
        }
        html = namp( markdown );
        html.id = id;
        html.url = path.join( '/', type, id );
        //html.excerpt = $(html.html, 'p').html();

        html.excerpt = $('<div>').html(html.html).find('p').first().html();
        console.log ( $(html.html) );
        callback( null, html );
    });
}

var listArticles = function( type, callback ) {
    // TODO: Check here if file is a text document (markdown)
    var contentPath = path.join( config.path.content, type );
    fs.readdir( contentPath, function( err, files ) {
        callback( null, files.map( function( item ) {
            return {
                id: item.substr( 0, item.length - 3 ),
                file: config.path.content + item
            }
        }) );
    });
}

var getHome = function() {
    var result;
    var res = this.res;

    async.series(
        [
            function( callback ) {
                loadTemplate( 'index.html', callback )
            },
            function( callback ){
                listArticles( 'articles', callback );
            },
        ],
        function( err, results ) {
            async.mapSeries(
                results[ 1 ],
                function ( item, cb ) {

                    loadArticle( 'articles', item.id, cb );
                }, function( err2, results2 ) {
                    // write response
                    var articles = results2.sort(sortByDate);
                    var window = jsdom.jsdom().createWindow();
                    var excerpt = $(articles[0].html).find('> p').first().html();
                    articles[0].excerpt = excerpt;
                    res.writeHead( 200, { 'Content-Type': 'text/html' } );
                    res.end( results[ 0 ]({ articles: results2.sort(sortByDate), config: config }) );
                }
            );
        }
    );
};

var getIndex = function( type ) {
    var result;
    var res = this.res;

    async.series(
        [
            function( callback ) {
                loadTemplate( path.join( type, 'index.html'), callback )
            },
            function( callback ){
                listArticles( type, callback );
            },
        ],
        function( err, results ) {
            async.mapSeries(
                results[ 1 ],
                function ( item, cb ) {

                    loadArticle( type, item.id, cb );
                }, function( err2, results2 ) {
                    // write response
                    var articles = results2.sort(sortByDate);

                    //var excerpt = $(articles[0].html).find('> p').first().html();
                    //articles[0].excerpt = excerpt;
                    res.writeHead( 200, { 'Content-Type': 'text/html' } );
                    res.end( results[ 0 ]({ articles: results2.sort(sortByDate), config: config }) );
                }
            );
        }
    );
};

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
        output = path.resolve( config.path.www, file );
        // mkdir
        if ( fs.existsSync( output ) ) {
            console.log( 'Directory exists: ' + output );
        } else {
            console.log( 'Creating directory: ' + output );
            fs.mkdir( output );
        }
        if( file.split( path.sep ).length === 1 ) {
            var type = path.dirname( file + '/' );
            type = file;
            fs.writeFileSync( path.join( output, 'index.html' ), createIndex( type ) );
        }

    } else if ( path.extname( file ) === '.md' ) {
        output = path.resolve( config.path.www, path.dirname( file ), 'index.html' );
        var type = path.dirname( file );
        if ( type === '.' ) {
            return;
        }
        console.log( 'Compiling ' + file + ' -> ' + output );
        var templatePath = path.join( type, '..', 'single.html' );
        fs.writeFileSync( output, compile( templatePath, file ) );
    } else {
        // copy...
        output = path.resolve( config.path.www, file );
        console.log( 'Copying ' + file + ' -> ' + output );
        fs.writeFileSync( output, input );
    }
};

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

var createIndex = function( type ) {
    console.log('Creating index for ' + type);
    var result,
        articles;

    articles = listArticles( type ).map( loadMarkdown );

    var tmpl = loadTemplate( path.join( type, 'index.html') );

    return tmpl({
        articles : articles.sort( sortByDate ),
        config : config
    });
};

var compile = function( templatePath, markdownPath ) {
    var tmpl,
        html;

    tmpl = loadTemplate( templatePath );
    html = loadMarkdown( markdownPath );

    return tmpl({
        content: html.html,
        meta: html.metadata,
        config: config
    });
};

exports.deploy = function( conf ) {
    config = conf;
    // Copy complete assets folder
    wrench.copyDirSyncRecursive( path.resolve( config.path.assets ), path.resolve( config.path.www, config.path.assets ) );

    // Crawl through content, copy all images and style files and compile markdown files using the according templates
    content = wrench.readdirSyncRecursive( path.resolve( config.path.content ) );
    content.forEach( deployFile );
};