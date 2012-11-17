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
    mime = require('mime');

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

        /*console.log( mime.lookup( file ) );
        console.log( mime.charsets.lookup('image/png'));*/

    /*var mimetype;
    if ( file.endsWith('css') ) {
        mimetype = 'text/css';
    } else if ( file.endsWith('png') ) {
        mimetype = 'image/png';
        encoding = 'binary';
    } else if ( file.endsWith('woff') ) {
        mimetype = 'application/octet-stream';
        encoding = 'binary';
    } else if ( file.endsWith('ttf') ) {
        mimetype = 'application/octet-stream';
        encoding = 'binary';
    } else if ( file.endsWith('js') ) {
        mimetype = 'application/javascript';
    }*/

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

var loadArticle = function( id, callback ) {
    var html;

    fs.readFile( config.path.content + 'articles/' + id + '.md', 'utf8', function( err, markdown ) {


        if (err) {
            return _404( res );
        }

        html = namp( markdown );
        html.id = id;
        html.url = '/articles/' + id;
        callback( null, html );
    });
}

var listArticles = function( callback ) {
    // TODO: Check here if file is a text document (markdown)
    fs.readdir( config.path.content + 'articles/', function( err, files ) {
        callback( null, files.map( function( item ) {
            return {
                id: item.substr( 0, item.length - 3 ),
                file: config.path.content + item
            }
        }) );
    });
}

var getIndex = function() {
    var result;
    var res = this.res;

    async.series(
        [
            function( callback ) {
                // load template
                loadTemplate( 'index.html', callback )
            },
            function( callback ){
                // load articles
                listArticles( callback );
            },
        ],
        function( err, results ) {
            async.mapSeries(
                results[ 1 ],
                function ( item, cb ) {

                    loadArticle( item.id, cb );
                }, function( err2, results2 ) {
                    // write response
                    res.writeHead( 200, { 'Content-Type': 'text/html' } );
                    res.end( results[ 0 ]({ articles: results2.sort(sortByDate), config: config }) );
                }
            );
        }
    );
};

var getArticle = function( id ) {
    var res = this.res;

    fs.readFile( config.path.templates + 'article.html', 'utf8', function( err, template ) {
        var compiled_template,
            data,
            markdown;

        if (err) {
            return _404( res );
        }
        compiled_template = hb.compile( template );

        fs.readFile( config.path.content + 'articles/' + id + '.md', 'utf8', function( err, markdown ) {
            if (err) {
                return _404( res );
            }
            var html = namp( markdown );

            var result = compiled_template({ article: html.html, meta: html.metadata, config: config });
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(result);
        });
    });
};

var getStatic = function( id ) {
    var res = this.res;
    if ( ! (config.statics.indexOf( id ) > -1) ) {
        return getAssetsContent( id, res );
    }

    fs.readFile( config.path.templates + 'static.html', 'utf8', function( err, template ) {
        var compiled_template,
            data,
            markdown;

        if (err) {
            return _404( res );
        }
        compiled_template = hb.compile( template );

        fs.readFile( config.path.content + id + '.md', 'utf8', function( err, markdown ) {
            var html, result;
            if (err) {
                return _404( res );
            }
            html = namp( markdown );

            result = compiled_template({ article: html.html, meta: html.metadata, config: config });
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(result);
        });
    });
};

var router = new director.http.Router({
    '/assets/(\.+)': {
        get: getAssets
    },
    '/articles/(\.+)': {
        get: getArticle
    },
    '/': {
        get: getIndex
    },
    /*'/(\.+).jpg': {
        get: getAssetsContent
    },*/
    '/:id': {
        get: getStatic
    }
});

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
