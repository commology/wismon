var S = require('string');

exports.trim = function (str) {
  return S(str).trim().s;
}

exports.capitalize = function (str) {
  var s = str.toUpperCase();
  return s.substring(0, 1) + str.substring(1);
}

exports.formatISODate = function (str) {
  var date = new Date(str);
  if (date.toString() === 'Invalid Date') {
    var fstr = str.replace(/[TZ]/gi, ' ');
    date = new Date(fstr);
  }
  return date;
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

