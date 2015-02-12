var url = require('url');
var S = require('string');
var crypto = require('crypto');

var config = require('../etc/wismon_conf.json');

exports.trim = function (str) {
  return S(str).trim().s;
}

exports.capitalize = function (str) {
  var s = str.toUpperCase();
  return s.substring(0, 1) + str.substring(1);
}

var getConfig = function (centreID, type, subtype) {
  if (!centreID) {
    centreID = config.HOME_CENTRE_ID;
  }
  
  var centreConfig = config.WIS_MONITOR_OBJECTS[centreID];
  if (!centreConfig.ENABLED) {
    return null;
  }
  if (!centreConfig[type]) {
    return null;
  }
  
  if (typeof centreConfig[type] != 'object') {
    return centreConfig[type];
  }
  
  if (!centreConfig[type].ENABLED) {
    return null;
  }
  
  if (!subtype) {
    return centreConfig[type];
  }
  
  if (!centreConfig[type][subtype]) {
    return null;
  }
  
  return centreConfig[type][subtype];  
}
exports.getConfig = getConfig;

exports.getConfigURL = function (centreID, type, bString) {
  var urlstr = getConfig(centreID, type, 'URL');
  if (bString)
    return urlstr;
  else
    return url.parse(urlstr);
}

exports.getConfigCRONTAB = function (centreID, type) {
  return getConfig(centreID, type, 'CRONTAB');
}

exports.stringifyDate = function (timestamp) {
  var timestring = '';
  timestring += timestamp.getUTCFullYear();
  if (timestamp.getUTCMonth() + 1 < 10)
    timestring += '0';
  timestring += (timestamp.getUTCMonth() + 1);
  if (timestamp.getUTCDate() < 10)
    timestring += '0';
  timestring += timestamp.getUTCDate();
  if (timestamp.getUTCHours() < 10)
    timestring += '0';
  timestring += timestamp.getUTCHours();
  if (timestamp.getUTCMinutes() < 10)
    timestring += '0';
  timestring += timestamp.getUTCMinutes();
  if (timestamp.getUTCSeconds() < 10)
    timestring += '0';
  timestring += timestamp.getUTCSeconds();
  return timestring;
}

var isAuthenticated = function(username, password) {
  if (typeof username != 'string')
    return false;
  if (typeof password != 'string')
    return false;
  if (!config['USER'])
    return false;
  if (typeof config['USER'] != 'object')
    return false;
  if (!config['USER'][username])
    return false;
  if (typeof config['USER'][username] != 'object')
    return false;
  if (!config['USER'][username]['PASSWORD'])
    return false;
  if (!config['USER'][username].ENABLED)
    return false;
  if (typeof config['USER'][username]['PASSWORD'] != 'string')
    return false;
  
  return (password === config['USER'][username]['PASSWORD']);
}

var isAuthorized = function(username, requiredRole) {
  if (typeof username != 'string')
    return false;
  if (typeof requiredRole != 'string')
    return false;
  if (!config['ROLE'])
    return false;
  if (typeof config['ROLE'] != 'object')
    return false;
  if (!config['ROLE'][requiredRole])
    return false;
  if (typeof config['ROLE'][requiredRole] != 'object')
    return false;
  if (!config['ROLE'][requiredRole].ENABLED)
    return false;
  if (!config['ROLE'][requiredRole]['USERS'])
    return false;
  
  var users = config['ROLE'][requiredRole]['USERS'];
  if (!Array.isArray(users) && typeof users != 'object')
    return false;
  
  var bFound = false;
  for (var i = 0; i < users.length; i++) {
    if (typeof users[i] != 'string')
      continue;
    if (username === users[i]) {
      bFound = true;
      break;
    }
  }
  
  return bFound;
}

exports.authorize = function(req, res, realm, requiredRole) {
  var authorization = req.get('Authorization');
  if (!authorization) {
    res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
    res.status(401).send('');
    return;
  }
 
  var authinfo = new Buffer(authorization.substr(6), 'base64').toString();
  var username = authinfo.split(/:/)[0];
  var password = authinfo.split(/:/)[1];
  var sha1sum = crypto.createHash('sha1').update(password + '\n', 'binary').digest('hex');
 
  if (!isAuthenticated(username, sha1sum))
    return false;
  
  if (!isAuthorized(username, requiredRole))
    return false;
  
  return true;
}

