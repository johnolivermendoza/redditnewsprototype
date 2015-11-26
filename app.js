var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// ************* Start Mongoose Stuff *******************
var mongoose = require('mongoose');
var Posts = require('./models/Posts');
var Comments = require('./models/Comments');
var Users = require('./models/Users');

/*
mongoose.connection.on('open', function (ref) {
  console.log('Connected to mongo server.');
  
});
mongoose.connection.on('error', function (err) {
  console.log('Could not connect to mongo server!');
  console.log(err);
});*/


mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/news');
//mongoose.connect('mongodb://localhost/news');


// ************* End Mongoose Stuff *******************



// For User PW Authentication and Security
//var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var passport = require('passport');
require('./config/passport');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', routes);
app.use('/users', users);
app.use(passport.initialize());


app.listen(app.get('port'), function() {
  console.log('****** Node app is running on port: ', app.get('port'));
});






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

// Live Reload Code
livereload = require('livereload');
server = livereload.createServer();
server.watch(__dirname + "/public");

module.exports = app;

