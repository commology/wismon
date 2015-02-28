var express = require('express');
var router = express.Router({
  caseSensitive:        true,
  strict:               true
});

var fs = require('fs');
var path = require('path');
var net = require('net');
var url = require('url');
var cronjob = require('node-crontab');
var crontab = require('crontab');

var utl = require('../modules/wismon_utl.js');
var svc = require('../modules/wismon_svc.js');
var cfg = require('../modules/wismon_config.js');
var log = require('../modules/wismon_logger.js');
var monJSON = require('../modules/wismon_monjson.js');

var config = require('../modules/wismon_config.js');

var installCRONTAB = function () {
  cronjob.scheduleJob(cfg.getCentreCRONTAB(null, 'PORTAL'), function () {
    svc.onAccessService('WISPortal');
  });
  cronjob.scheduleJob(cfg.getCentreCRONTAB(null, 'OAI_PROVIDER'), function () {
    svc.onAccessService('OAIProvider');
    svc.onAccessService('MetadataCount');
  });
  cronjob.scheduleJob(cfg.getCentreCRONTAB(null, 'CACHE24H'), function () {
    svc.onAccessService('IntraFTP');
    svc.onAccessService('MetadataCount');
  });
  
  var centreIDs = cfg.getCentreIDs();
  for (var i = 0; i < centreIDs.length; i++) {
    var key = centreIDs[i];
    if (!cfg.getCentreCRONTAB(key, 'MONITOR_JSON'))
      continue;
    cronjob.scheduleJob(cfg.getCentreCRONTAB(key, 'MONITOR_JSON'), function (centreID) {
      var URL = null;
      if (centreID)
        URL = cfg.getCentreURL(centreID, 'MONITOR_JSON');
      monJSON.fetchJSON(centreID, URL, 'Monitor', function (err, monjson) {
        log.info('Monitor JSON automatically fetch from ' + centreID);
        //console.log(JSON.stringify(monjson, null, '  '));
      });
    }, [key]);
  }
  for (var i = 0; i < centreIDs.length; i++) {
    var key = centreIDs[i];
    if (!cfg.getCentreCRONTAB(key, 'SERVICES_JSON'))
      continue;
    cronjob.scheduleJob(cfg.getCentreCRONTAB(key, 'SERVICES_JSON'), function (centreID) {
      var URL = null;
      if (centreID)
        URL = cfg.getCentreURL(centreID, 'SERVICES_JSON');
      monJSON.fetchJSON(centreID, URL, 'Services', function (err, monjson) {
        log.info('Services JSON automatically fetch from ' + centreID);
        //console.log(JSON.stringify(monjson, null, '  '));
      });
    }, [key]);
  }
  for (var i = 0; i < centreIDs.length; i++) {
    var key = centreIDs[i];
    if (!cfg.getCentreCRONTAB(key, 'AORCENTRES_JSON'))
      continue;
    cronjob.scheduleJob(cfg.getCentreCRONTAB(key, 'AORCENTRES_JSON'), function (centreID) {
      var URL = null;
      if (centreID)
        URL = cfg.getCentreURL(centreID, 'AORCENTRES_JSON');
      monJSON.fetchJSON(centreID, URL, 'AORCentres', function (err, monjson) {
        log.info('AORCentres JSON automatically fetch from ' + centreID);
        //console.log(JSON.stringify(monjson, null, '  '));
      });
    }, [key]);
  }
  for (var i = 0; i < centreIDs.length; i++) {
    var key = centreIDs[i];
    if (!cfg.getCentreCRONTAB(key, 'DOWNTIME_JSON'))
      continue;
    cronjob.scheduleJob(cfg.getCentreCRONTAB(key, 'DOWNTIME_JSON'), function (centreID) {
      var URL = null;
      if (centreID)
        URL = cfg.getCentreURL(centreID, 'DOWNTIME_JSON');
      monJSON.fetchJSON(centreID, URL, 'Events', function (err, monjson) {
        log.info('Events JSON automatically fetch from ' + centreID);
        //console.log(JSON.stringify(monjson, null, '  '));
      });
    }, [key]);
  }
}
installCRONTAB();

router.use('/json', require('./wismon_json.js'));
router.use('/dashboard', require('./wismon_dashboard.js'));
router.use('/oai', require('./wismon_oai.js'));

var pathJSON = path.resolve(__dirname, 'json');
if (!fs.existsSync(pathJSON)) fs.mkdirSync(pathJSON, 0755);

var pathOAI = path.resolve(__dirname, 'oai');
if (!fs.existsSync(pathOAI)) fs.mkdirSync(pathOAI, 0755);

router.get('/', function(req, res) {
  res.redirect('dashboard/');
});

router.get('/head', function(req, res) {
  if (!req.xhr) {
    res.sendStatus(404);
    return;
  }
  res.charset = 'utf-8';
  res.render('head_metro');
});

router.get('/dashboard', function(req, res) {
  res.redirect('dashboard/');
});

module.exports = router;

