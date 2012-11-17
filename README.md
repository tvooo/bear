# Bear

Bear is a simple publishing engine for the web.

## Getting Started
Install the module with: `npm install bear`

```javascript
var bear = require('bear'),
    config = {
        host: '127.0.0.1',
        port: 1080,
        title: 'My blog',
        path: {
            templates: 'templates/',
            assets: 'assets/',
            content: 'content/',
            '404': 'templates/404.html',
            favicon: 'assets/favicon.ico'
        },
        statics: ['about', 'projects']
    };

bear.run( config );
```

## Documentation

### Configuration

The `config` object passed to `bear.run()` can have the following properties:

* `host`
* `port`
* `title`
* `path`is an object that contains the server-side paths to different resources:
    * `assets` is the folder that contains all assets that are relevant to page style or functionality --- everything that is **not content**.
    * `content` is the folder that contains all static pages, articles and images that are used within those.
    * `templates` contains the HTML templates ([Handlebars.js](http://handlebarsjs.com/) format) used for delivering your pages.
    * `'404'` is the path to your 404 page
    * `favicon`is the location of your Favicon

### Document Metadata
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/cowboy/grunt).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2012 Tim von Oldenburg
Licensed under the MIT license.
