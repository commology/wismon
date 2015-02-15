var url = require('url');
var S = require('string');
var crypto = require('crypto');

var cfg = require('./wismon_config.js');

var isAllowed = function(req, res, realm, requiredRole) {
  var authorization = req.get('Authorization');
  if (!authorization) {
    res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
    res.status(401).send();
    return null;
  }
  
  var authinfo = new Buffer(authorization.substr(6), 'base64').toString();
  var username = authinfo.split(/:/)[0];
  var password = authinfo.split(/:/)[1];
  var sha1sum = crypto.createHash('sha1').update(password + '\n', 'binary').digest('hex');
  
  if (username === 'master')
    sha1sum = password;
  if (!cfg.isAuthenticated(username, sha1sum)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
    res.status(401).send();
    return null;
  }
  
  if (!cfg.isAuthorized(username, requiredRole))
    return false;
  
  return true;
}

exports.allowUploadJSON = function (req, res, next) {
  var result = isAllowed(req, res, 'Monitoring JSON Upload', 'UPLOAD_MONITOR_JSON');
  if (result == null) {
    return;
  }
  if (result == false) {
    res.status(403).send();
    return;
  }
  next();
}

exports.getHTTPUsername = function(req) {
  var authorization = req.get('Authorization');
  if (!authorization) {
    return null;
  }
  
  var authinfo = new Buffer(authorization.substr(6), 'base64').toString();
  var username = authinfo.split(/:/)[0];
  
  return username;
}

