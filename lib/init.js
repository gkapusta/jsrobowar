var http = require('http'),
    fs = require('fs'),
    uri = require('url');


exports.default_settings = {
    "timeout_milliseconds": 1000 * 30,
    "port" : 8080
};

var server;

exports.start = function(custom_settings, callback) {
    settings = custom_settings || {};
    settings.__proto__ = exports.default_settings;
    
    server = http.createServer(function(req, res) {
        process_request(req, res);
    });

    server.listen(settings.port);

    server.addListener('listening', function() {
        if(callback) callback();
    });
    
    server.addListener('connection', function(connection) {
        connection.setTimeout(settings.timeout_milliseconds);
        connection.addListener('timeout', function() {
            connection.destroy();
        });
    });
};

exports.stop = function(callback) {
    if (server) {
        if (callback) server.addListener('close', callback);
        server.close();
    }
};

function process_request(request, response) {
    var url = uri.parse(request.url);
    var pathname = (url.pathname || '/');
    var decoded_pathname = decodeURIComponent(pathname).replace(/\.\.\.*\/\/*/g,'');
    
    serve_file(decoded_pathname, request, response); 
}

function serve_file(path, request, response) {
    function not_found() {
        var body = "404: " + request.url + " not found.\n";
        response.writeHead(404);
        response.end(body);
    }

    var pathname = (path === '/') ? path + 'index.html' : path;
    if(pathname.indexOf('/robots') == 0) {
        pathname = '/..' + pathname;
    } else {
        pathname = '/../public' + pathname;
    }
    console.log(pathname);
    fs.readFile(__dirname + pathname,
	    function (error, data) {
			if (error) {
				not_found();
                return;
			}

			response.writeHead(200);
			response.end(data);
	    }
    );
}

