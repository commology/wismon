var express = require('express');
var router = express.Router();

var fs = require('fs');
var path = require('path');
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');

var log = require('../modules/wismon_logger.js');
var acl = require('../modules/wismon_acl.js');
var monJSON = require('../modules/wismon_monjson.js');


var responseMonitorJSON = function (req, res) {
  monJSON.getJSON(null, null, 'Monitor', function (err, monjson) {
    log.info('GET Monitor JSON from ' + req.ip + ' ' + req.ips);
    res.charset = 'utf-8';
    res.type('application/json');
    //res.json(monjson);
    res.send(JSON.stringify(monjson, null, '  '));
  });
}
router.get('/monitor.json', responseMonitorJSON);

var responseServicesJSON = function (req, res) {
  monJSON.getJSON(null, null, 'Services', function (err, monjson) {
    log.info('GET Services JSON from ' + req.ip + ' ' + req.ips);
    res.charset = 'utf-8';
    res.type('application/json');
    //res.json(monjson);
    res.send(JSON.stringify(monjson, null, '  '));
  });
}
router.get('/services.json', responseServicesJSON);

var responseAORCentresJSON = function (req, res) {
  monJSON.getJSON(null, null, 'AORCentres', function (err, aorjson) {
    log.info('GET AORCentres JSON from ' + req.ip + ' ' + req.ips);
    res.charset = 'utf-8';
    res.type('application/json');
    //res.json(aorjson);
    res.send(JSON.stringify(aorjson, null, '  '));
  });
}
router.get('/centres.json', responseAORCentresJSON);

var responseEventsJSON = function (req, res) {
  monJSON.getJSON(null, null, 'Events', function (err, eventsjson) {
    log.info('GET Events JSON request from ' + req.ip + ' ' + req.ips);
    res.charset = 'utf-8';
    res.type('application/json');
    res.send(JSON.stringify(eventsjson, null, '  '));
  });
}
router.get('/events.json', responseEventsJSON);

var responseTimelineJSON = function (req, res) {
  monJSON.getJSON(null, null, 'Timeline', function (err, timelinejson) {
    log.info('GET Timeline JSON request from ' + req.ip + ' ' + req.ips);
    res.charset = 'utf-8';
    res.type('application/json');
    res.send(JSON.stringify(timelinejson, null, '  '));
  });
}
router.get('/timeline.json', responseTimelineJSON);

router.get('/ingest', acl.allowUploadJSON, function(req, res) {
  var http_username = acl.getHTTPUsername(req);
  log.info('Dashboard request from ' + http_username + '@' + req.ip + ' ' + req.ips);

  var json = {};
  json.partials =
              {
                head: 'head_basic',
                body: 'json_ingest',
              };
  res.charset = 'utf-8';
  res.render('dashboard', json);
});

/*
 * HTTP METHOD           GET       POST    PUT      DELETE
 * URL: /username/       list      create  --       --
 * URL: /username/files  retrieve  --      #update  --
 */

router.post('/:username', acl.allowUploadJSON, function (req, res) {
  log.info('POST JSON from ' + req.params.username + '@' + req.ip + ' ' + req.ips);

  var valid = monJSON.archiveJSON(req.params.username, 'Monitor', req.url, req.body);
  if (valid) {
    res.send('POST JSON by ' + req.params.username + ' validation OK');
  }
  else {
    res.send('POST JSON by ' + req.params.username + ' validation FAILED');
  }
});

/*
router.put('/:username/:filename', acl.allowUploadJSON, function (req, res) {
  log.info('PUT JSON ' + req.params.filename + ' from ' + req.params.username + '@' + req.ip + ' ' + req.ips);

  res.send('PUT by ' + username);
});
*/

router.use('/:username/', acl.allowUploadJSON, function (req, res, next) {
  var http_username = acl.getHTTPUsername(req);
  var username = req.params.username;
  var options = {
    icons: true,
    view: 'details',
    filter: function (filename, index, files, dir) {
      if (filename.match(/.json$/))
        return true;
      else
        return false;
    }
  }
  if (http_username != username) {
    if (http_username == 'master') {
      serveIndex(path.resolve('json', username), options)(req, res, next);
      return;
    }
    res.sendStatus(403);
    return;
  }
  
  log.info('OPEN JSON directory' + ' from ' + username + '@' + req.ip + ' ' + req.ips);
  serveIndex(path.resolve('json', username), options)(req, res, next);
});

router.get('/:username/:filename', acl.allowUploadJSON, function (req, res) {
  log.info('GET JSON ' + req.params.filename + ' from ' + req.params.username + '@' + req.ip + ' ' + req.ips);

  res.send(fs.readFileSync(path.resolve('json', req.params.username, req.params.filename)));
});

module.exports = router;

