var express = require('express');
var router = express.Router({
  caseSensitive:        true,
  strict:               true
});

var path = require('path');
var net = require('net');
var url = require('url');
var cronjob = require('node-crontab');
var crontab = require('crontab');

var utl = require('../modules/wismon_utl.js');
var svc = require('../modules/wismon_svc.js');
var monJSON = require('../modules/wismon_monjson.js');
var oaih = require('../modules/wismon_oai_harvester.js');

var config = require('../etc/wismon_conf.json');

var installCRONTAB = function () {
  cronjob.scheduleJob(utl.getConfigCRONTAB(null, 'PORTAL'), function () {
    svc.onAccessService('WISPortal');
  });
  cronjob.scheduleJob(utl.getConfigCRONTAB(null, 'OAI_PROVIDER'), function () {
    svc.onAccessService('OAIProvider');
    svc.onAccessService('MetadataCount');
  });
  cronjob.scheduleJob(utl.getConfigCRONTAB(null, 'CACHE24H'), function () {
    svc.onAccessService('IntraFTP');
    svc.onAccessService('MetadataCount');
  });
  
  for (var key in config.WIS_MONITOR_OBJECTS) {
    if (!utl.getConfigCRONTAB(key, 'REALTIME_JSON'))
      continue;
    cronjob.scheduleJob(utl.getConfigCRONTAB(key, 'REALTIME_JSON'), function (centreID) {
      var URL = null;
      if (centreID && centreID != config.HOME_CENTRE_ID)
        URL = utl.getConfigURL(centreID, 'REALTIME_JSON');
      monJSON.getJSON(centreID, URL, 'Monitor', function (err, monjson) {
        console.log((new Date()).toISOString() + ' Monitor JSON automatically fetch from ' + centreID);
        //console.log(JSON.stringify(monjson, null, '  '));
      });
    }, [key]);
  }
  
  for (var key in config.WIS_MONITOR_OBJECTS) {
    if (!utl.getConfigCRONTAB(key, 'OAI_PROVIDER'))
      continue;
    cronjob.scheduleJob(utl.getConfigCRONTAB(key, 'OAI_PROVIDER'), function (centreID) {
      oaih.harvestMetadataHead(centreID, utl.getConfigURL(centreID, 'OAI_PROVIDER'));
      console.log((new Date()).toISOString() + ' Metadata automatically harvest from ' + centreID);
      //console.log(JSON.stringify(monjson, null, '  '));
    }, [key]);
  }
}
installCRONTAB();

router.use('/json', require('./wismon_json.js'));
router.use('/dashboard', require('./wismon_dashboard.js'));
router.use('/oai', require('./wismon_oai.js'));

router.get('/', function(req, res) {
  res.redirect('dashboard/');
});

router.get('/dashboard', function(req, res) {
  res.redirect('dashboard/');
});

module.exports = router;

