var express = require('express');
var fs = require('fs');
var morgan = require('morgan');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');

var routes = require('./routes/index');
var wismon = require('./routes/wismon_root');

var appRoot = '/monitor/test';

var app = express();
app.enable('strict routing', true);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// create a log write stream in append mode
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'});

// uncomment after placing your favicon in /public
//app.use(appRoot, favicon(__dirname + '/public/favicon.ico'));
app.use(appRoot, logger('dev'));
app.use(appRoot, bodyParser.json());
app.use(appRoot, bodyParser.urlencoded({ extended: false }));
app.use(appRoot, cookieParser());
app.use(appRoot, express.static(path.join(__dirname, 'public')));
app.use(appRoot, morgan('combined', {stream: accessLogStream}));

app.use('/', routes);
app.use(appRoot, wismon);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.enable('trust proxy');

module.exports = app;
