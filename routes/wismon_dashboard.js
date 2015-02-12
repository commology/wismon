var express = require('express');
var router = express.Router();

var async = require('async');
var humanize = require('humanize');

var utl = require('../modules/wismon_utl.js');
var svc = require('../modules/wismon_svc.js');
var monJSON = require('../modules/wismon_monjson.js');

var config = require('../etc/wismon_conf.json');

var renderGISC_Monitor = function (monjson, req, res) {
  var timestamp = new Date(monjson.timestamp);
  monjson.timestamp = '' + timestamp.getUTCFullYear() + '-' + (timestamp.getUTCMonth()+1) + '-' + timestamp.getUTCDate() + '  ' + timestamp.getUTCHours() + ' UTC';
  monjson.partials = 
              {
                head: 'head_metro',
                body: 'gisc_monitor'
              };
  monjson.metrics.services.catalogue.status = JSON.parse(monjson.metrics.services.catalogue.status);
  
  if (monjson.metrics.metadata_catalogue.number_of_changes_insert_modify
  &&  monjson.metrics.metadata_catalogue.number_of_changes_insert_modify >= 0) {
  }
  else {
     monjson.metrics.metadata_catalogue.number_of_changes_insert_modify = 0;
  }
  
  if (monjson.metrics.metadata_catalogue.number_of_changes_delete
  &&  monjson.metrics.metadata_catalogue.number_of_changes_delete >= 0) {
  }
  else {
     monjson.metrics.metadata_catalogue.number_of_changes_delete = 0;
  }
  
  monjson.metrics.services.oai_pmh.status = JSON.parse(monjson.metrics.services.oai_pmh.status);
  monjson.metrics.services.distribution_system.status = JSON.parse(monjson.metrics.services.distribution_system.status);
  monjson.metrics.cache_24h.bytes_of_cache_all = humanize.filesize(monjson.metrics.cache_24h.bytes_of_cache_all);
  monjson.metrics.cache_24h.bytes_of_cache_without_metadata = humanize.filesize(monjson.metrics.cache_24h.bytes_of_cache_without_metadata);
  
  if (monjson.metrics.cache_24h.number_of_unique_products_without_metadata_all
  &&  monjson.metrics.cache_24h.number_of_unique_products_without_metadata_all >= 0) {
  }
  else {
    monjson.metrics.cache_24h.number_of_unique_products_without_metadata_all = 0;
  }
  
  if (monjson.metrics.cache_24h.number_of_unique_products_without_metadata_AMDCN
  &&  monjson.metrics.cache_24h.number_of_unique_products_without_metadata_AMDCN >= 0) {
  }
  else {
     monjson.metrics.cache_24h.number_of_unique_products_without_metadata_AMDCN = 0;
  }
  
  res.charset = 'utf-8';
  if (req.xhr) {
    res.render('gisc_monitor', monjson);
  }
  else {
    res.render('dashboard', monjson);
  }
}

router.get('/', function(req, res) {
  res.redirect('dashboard/tiles');
});

router.get('/dashboard/tiles', function(req, res) {
  res.redirect('../tiles');
});

router.get('/head', function(req, res) {
  if (req.xhr) {
    res.charset = 'utf-8';
    res.render('head_metro');
  }
  else {
    res.sendStatus(404);
  }
});
 
router.get('/tiles', function(req, res) {
  var date = new Date();
  console.log(date.toISOString() + ' Dashboard request from ' + req.ip + ' ' + req.ips);
  
  var json = {};
  json.partials = 
              {
                head: 'head_basic',
                body: 'tiles',
              };
  res.charset = 'utf-8';
  res.render('dashboard', json);
});
 
router.get('/dev', function(req, res) {
  var date = new Date();
  console.log(date.toISOString() + ' Dashboard (dev) request from ' + req.ip + ' ' + req.ips);
  
  var json = {};
  json.partials = 
              {
                head: 'head_basic',
                body: 'dev',
              };
  res.charset = 'utf-8';
  res.render('dashboard', json);
});

router.get('/gisc/:name', function(req, res) {
  var date = new Date();
  console.log(date.toISOString() + ' GISC ' + req.params.name + ' request from ' + req.ip + ' ' + req.ips);
  
  var centreID = null;
  var monURL = null;
  if (config.WIS_MONITOR_OBJECTS[req.params.name]) {
    centreID = req.params.name; 
    monURL = utl.getConfigURL(req.params.name, 'REALTIME_JSON');
  }
  
  monJSON.getJSON(centreID, monURL, 'Monitor', function (err, result) {
    var realtime_json_url = utl.getConfigURL(req.params.name, 'REALTIME_JSON', true);
    if (err) {
      res.charset = 'utf-8';
      if (err == 'invalid') {
        res.send('JSON schema validation failed: ' + req.params.name + ' [' + realtime_json_url + ']');
      }
      else {
        res.send('JSON is not accessible: ' + req.params.name + ' [' + realtime_json_url + ']');
      }
      return;
    }
    else {
      if (monURL == null) {
        if (req.xhr)
          result.monitor_json_url = '../json/monitor.json';
        else
          result.monitor_json_url = '../../json/monitor.json';
      }
      else {
        result.monitor_json_url = realtime_json_url;
      }
      
      if (req.query.dev)
        result._dev = {};
      
      if (!centreID)
        centreID = config.WIS_CENTRE_ID;
      result.centreID = centreID;
      result._chart = {};
      async.parallel([
        function(callback) {
          monJSON.queryMetrics('METRIC:Monitor:' + centreID + ':metadata:records', function (dataset) {
            /*
            result._chart.metadata_records = {
              'keys': JSON.stringify(keys),
              'vals': JSON.stringify(vals)
            };*/
            result._chart.metadata_records = JSON.stringify(dataset);
            callback(null, dataset);
          }, date.getTime() - 30 * 24 * 60 * 60 * 1000);
        },
        function(callback) {
          monJSON.queryMetrics('METRIC:Monitor:' + centreID + ':datacache:files', function (dataset) {
            result._chart.datacache_files = JSON.stringify(dataset);
            callback(null, dataset);
          }, date.getTime() - 30 * 24 * 60 * 60 * 1000);
        },
        function(callback) {
          monJSON.queryMetrics('METRIC:Monitor:' + centreID + ':datacache:bytes', function (dataset) {
            result._chart.datacache_bytes = JSON.stringify(dataset);
            callback(null, dataset);
          }, date.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
      ],
      function (err, async_result) {
        if (err) {
          return;
        }
        else {
          renderGISC_Monitor(result, req, res);
        }
      });
    }
  });
  
});

router.get('/sandbox', function(req, res) {
  
  var jsonurl = null;
  
  if (req.query.monitor_json_url) {
    jsonurl = url.parse(req.query.monitor_json_url);
    monJSON.getJSON('sandbox', jsonurl, 'Monitor', function (err, result) {
      if (err) {
        res.charset = 'utf-8';
        if (err == 'invalid') {
          res.send('JSON schema validation failed: ' + req.query.monitor_json_url);
        }
        else {
          res.send('JSON is not accessible: ' + req.query.monitor_json_url);
        }
      }
      else {
        if (req.query.type && req.query.type == 'gui') {
          renderGISC_Monitor(result, req, res);
        }
        else {
          res.type('application/json');
          res.send(JSON.stringify(result, null, '  '));
        }
      }
    });
  }
  
  if (req.query.aorcentres_json_url) {
    jsonurl = url.parse(req.query.aorcentres_json_url);
    monJSON.getJSON('sandbox', jsonurl, 'AORCentres', function (err, result) {
      if (err) {
        res.charset = 'utf-8';
        if (err == 'invalid') {
          res.send('JSON schema validation failed: ' + req.query.aorcentres_json_url);
        }
        else {
          res.send('JSON is not accessible: ' + req.query.aorcentres_json_url);
        }
      }
      else {
        res.type('application/json');
        res.send(JSON.stringify(result, null, '  '));
      }
    });
  }
  
  if (req.query.events_json_url) {
    jsonurl = url.parse(req.query.events_json_url);
    monJSON.getJSON('sandbox', jsonurl, 'Events', function (err, result) {
      if (err) {
        res.charset = 'utf-8';
        if (err == 'invalid') {
          res.send('JSON schema validation failed: ' + req.query.events_json_url);
        }
        else {
          res.send('JSON is not accessible: ' + req.query.events_json_url);
        }
      }
      else {
        res.type('application/json');
        res.send(JSON.stringify(result, null, '  '));
      }
    });
  }
  
  if (!jsonurl) {
    res.send();
  }
});

module.exports = router;
