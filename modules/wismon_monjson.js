var fs = require('fs');
var path = require('path');
var url = require('url');

var utl = require('./wismon_utl.js');
var svc = require('./wismon_svc.js');
var log = require('./wismon_logger.js');

var cfg = require('./wismon_config.js');

var Validator = require('jsonschema').Validator;
var validator = new Validator();

var redis = require('redis');
var redis_cli = redis.createClient();

redis_cli.on('error', function (err) {
  log.error('Redis: ' + err);
  throw Error(err); 
});

redis_cli.select(1, function () {
});

var schema_monitor = require('../etc/wismon_schema_monitor.json');
var schema_events = require('../etc/wismon_schema_events.json');
var schema_aorcentres = require('../etc/wismon_schema_aorcentres.json');
var templ_monitor = require('../etc/wismon_templ_monitor.json');
var templ_services = require('../etc/wismon_templ_services.json');
var templ_events = require('../etc/wismon_templ_events.json');
var templ_aorcentres = require('../etc/wismon_templ_aorcentres.json');


var generateJSON_Monitor = function (callback) {
  var str = JSON.stringify(templ_monitor);
  var monjson = JSON.parse(str);
  
  if (!validator.validate(monjson, schema_monitor).valid) {
    log.error("Monitor JSON template: schema validation failed!");
    callback("invalid", null);
  }
  
  var date = new Date();
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  monjson.timestamp = date.toISOString();
  
  monjson.centre = cfg.getCentreType(null) + ' ' + cfg.getCentreName(null);
  monjson.gisc_properties.catalogue_url = cfg.getCentreURL(null, 'PORTAL', true);
  monjson.gisc_properties.monitor_url = cfg.getCentreURL(null, 'DASHBOARD', true);
  monjson.gisc_properties.oai_url = cfg.getCentreURL(null, 'OAI_PROVIDER', true);
  monjson.gisc_properties.events_url = cfg.getCentreURL(null, 'DOWNTIME_JSON', true);
  monjson.gisc_properties.centres_inAoR_url = cfg.getCentreURL(null, 'AORCENTRES_JSON', true);
  monjson.gisc_properties.backup_giscs = cfg.getProp('HOME_BACKUP_CENTRES');
  monjson.gisc_properties.contact_info.voice = cfg.getProp('HOME_CONTACT_TEL');
  monjson.gisc_properties.contact_info.email = cfg.getProp('HOME_CONTACT_MAIL');
  monjson.remarks = cfg.getProp('REMARKS');
  
  monjson.metrics.rmdcn = cfg.getProp('RMDCN_BANDWIDTH_DIAGRAM_URL');
  
  monjson.metrics.metadata_catalogue.number_of_records_at00UTC
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'metadata_count' + '.dat')).toString());
  monjson.metrics.metadata_catalogue.number_of_changes_insert_modify
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'metadata_updated' + '.dat')).toString());
  monjson.metrics.metadata_catalogue.number_of_changes_delete
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'metadata_deleted' + '.dat')).toString());
  
  monjson.metrics.services.catalogue.status
   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'portal' + '.dat')).toString());
  monjson.metrics.services.oai_pmh.status
   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'provider' + '.dat')).toString());
  monjson.metrics.services.distribution_system.status
   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'intra_ftp' + '.dat')).toString());
  
  monjson.metrics.cache_24h.bytes_of_cache_all
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'cache_bytes' + '.dat')).toString());
  monjson.metrics.cache_24h.number_of_products_all
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'cache_files' + '.dat')).toString());
  
  monjson.metrics.cache_24h.bytes_of_cache_without_metadata
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'cache_bytes_without_metadata' + '.dat')).toString());
  monjson.metrics.cache_24h.number_of_products_without_metadata
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'cache_files_without_metadata' + '.dat')).toString());
  
  monjson.metrics.cache_24h.number_of_unique_products_without_metadata_all
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'cache_unique_without_metadata' + '.dat')).toString());
  monjson.metrics.cache_24h.number_of_unique_products_without_metadata_AMDCN
   = parseInt(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'cache_unique_without_metadata_AMDCN' + '.dat')).toString());
  
  if (!validator.validate(monjson, schema_monitor).valid) {
    log.error("Monitor JSON instance: schema validation failed!");
    callback("invalid", null);
  }
  
  // console.log(JSON.stringify(monjson, null, '  '));
  delete monjson['_locals'];
  callback(null, monjson);
}

var generateJSON_Services = function (callback) {
  var str = JSON.stringify(templ_services);
  var monjson = JSON.parse(str);
  
  /*
  if (!validator.validate(monjson, schema_monitor).valid) {
    log.error("Monitor JSON template: schema validation failed!");
    callback("invalid", null);
  }
  */
  
  var date = new Date();
  date.setSeconds(0);
  date.setMilliseconds(0);
  monjson.timestamp = date.toISOString();
  
  monjson.centre = cfg.getCentreType(null) + ' ' + cfg.getCentreName(null);
  monjson.remarks = cfg.getProp('REMARKS');
  
  monjson.metrics.services.catalogue.status
   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'portal' + '.dat')).toString());
  monjson.metrics.services.oai_pmh.status
   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'provider' + '.dat')).toString());
  monjson.metrics.services.distribution_system.status
   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/wismon_' + 'intra_ftp' + '.dat')).toString());
  
  /*
  if (!validator.validate(monjson, schema_monitor).valid) {
    log.error("Monitor JSON instance: schema validation failed!");
    callback("invalid", null);
  }
  */
  
  // console.log(JSON.stringify(monjson, null, '  '));
  delete monjson['_locals'];
  callback(null, monjson);
}

var generateJSON_Events = function (callback) {
  var str = JSON.stringify(templ_events);
  var eventsjson = JSON.parse(str);
  
  if (!validator.validate(eventsjson, schema_events).valid) {
    log.error("Events JSON template: schema validation failed!");
    callback("invalid", null);
  }
  
  var date = new Date();
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  eventsjson.timestamp = date.toISOString();
  
  for (var i = 0; i < eventsjson.events.length; i++) {
    eventsjson.events[i].start = utl.formatISODate(eventsjson.events[i].start).toISOString();
    eventsjson.events[i].end = utl.formatISODate(eventsjson.events[i].end).toISOString();
  }
  if (!validator.validate(eventsjson, schema_events).valid) {
    log.error("Events JSON instance: schema validation failed!");
    callback("invalid", null);
  }
  
  // console.log(JSON.stringify(eventsjson, null, '  '));
  delete eventsjson['_locals'];
  callback(null, eventsjson);
}

var generateJSON_AORCentres = function (callback) {
  var str = JSON.stringify(templ_aorcentres);
  var aorjson = JSON.parse(str);
  
  if (!validator.validate(aorjson, schema_aorcentres).valid) {
    log.error("AOR Centres JSON template: schema validation failed!");
    callback("invalid", null);
  }
  
  var date = new Date();
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  aorjson.timestamp = date.toISOString();
  
  if (!validator.validate(aorjson, schema_aorcentres).valid) {
    log.error("AOR Centres JSON instance: schema validation failed!");
    callback("invalid", null);
  }
  
  // console.log(JSON.stringify(aorjson, null, '  '));
  delete aorjson['_locals'];
  callback(null, aorjson);
}

var fetchJSON = function (jsonURL, schema, callback) {
  svc.accessHTTPService(
      jsonURL.hostname,
      jsonURL.port,
      jsonURL.pathname,
    function (err, result) {
      if (err) {
        callback(err, result);
        return;
      }
      
      var json = JSON.parse(result);
      if (!validator.validate(json, schema).valid) {
        callback('invalid', result);
      }
      else {
        callback(null, json);
      }
    }
  );
}

var archiveJSON = function (centreID, type, strURL, json) {
  var date = new Date();
  json.archive_timestamp = date.toISOString();
  
  if (!centreID)
    centreID = cfg.getProp('HOME_CENTRE_ID');
  
  var pathJSON = path.resolve(__dirname, '../json/' + centreID);
  if (!fs.existsSync(pathJSON)) fs.mkdirSync(pathJSON, 0755);
  var filenameJSON = path.resolve(__dirname, '../json/' + centreID + '/' + type.toLowerCase() + '_' + centreID + '_' + utl.stringifyDate(date) + '.json');
  fs.writeFileSync(filenameJSON, JSON.stringify(json, null, '  '));
  
  delete json.archive_timestamp;
  delete json.url;
}

exports.archiveJSON = function (centreID, type, strURL, json) {
  if (type == 'Monitor') {
    if (!validator.validate(json, schema_monitor).valid) {
      log.error("Monitor JSON instance uploaded: schema validation failed!");
      type += '-invalid';
      archiveJSON(centreID, type, strURL, { invalid: json });
      return false;
    }
    else {
      archiveJSON(centreID, type, strURL, json);
      return true;
    }
  }
}

var digestJSON = function (centreID, type, json) {
  var date = new Date(json.timestamp);
  
  if (!centreID)
    centreID = cfg.getProp('HOME_CENTRE_ID');
  
  if (type == 'Monitor') {
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'web_portal',		// key
        date.getTime(),							// field
        json.metrics.services.catalogue.status
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'oai_provider',	// key
        date.getTime(),							// field
        json.metrics.services.oai_pmh.status
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'distribution',	// key
        date.getTime(),							// field
        json.metrics.services.distribution_system.status
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'metadata:records',	// key
        date.getTime(),							// field
        json.metrics.metadata_catalogue.number_of_records_at00UTC
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'metadata:updated',	// key
        date.getTime(),							// field
        json.metrics.metadata_catalogue.number_of_changes_insert_modify
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'metadata:deleted',	// key
        date.getTime(),							// field
        json.metrics.metadata_catalogue.number_of_changes_delete
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'datacache:files',	// key
        date.getTime(),							// field
        json.metrics.cache_24h.number_of_products_all
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'datacache:bytes',	// key
        date.getTime(),							// field
        json.metrics.cache_24h.bytes_of_cache_all
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'datacache:files:without_metadata',	// key
        date.getTime(),							// field
        json.metrics.cache_24h.number_of_products_without_metadata
      ], redis.print);
    redis_cli.hset(
      [
        'METRIC:' + type + ':' + centreID + ':' + 'datacache:bytes:without_metadata',	// key
        date.getTime(),							// field
        json.metrics.cache_24h.bytes_of_cache_without_metadata
      ], redis.print);
  }
}

exports.getJSON = function (centreID, jsonURL, type, callback) {
  if (centreID == cfg.getProp('HOME_CENTRE_ID')) {
    jsonURL = null;
  }
  
  if (typeof(jsonURL) === "undefined" || jsonURL == null || utl.trim(jsonURL).length == 0) {
    if (type == "AORCentres")
      generateJSON_AORCentres(function (err, result) {
        if (err) {
          if (err == 'invalid')
            archiveJSON(centreID, type + '-invalid', url.format(jsonURL), { invalid: result });
          else
            archiveJSON(centreID, type + '-error', url.format(jsonURL), { error: err });
        }
        else {
          archiveJSON(centreID, type, url.format(jsonURL), result);
          digestJSON(centreID, type, result);
        }
        callback(err, result);
      });
    else if (type == "Events")
      generateJSON_Events(function (err, result) {
        if (err) {
          if (err == 'invalid')
            archiveJSON(centreID, type + '-invalid', url.format(jsonURL), { invalid: result });
          else
            archiveJSON(centreID, type + '-error', url.format(jsonURL), { error: err });
        }
        else {
          archiveJSON(centreID, type, url.format(jsonURL), result);
          digestJSON(centreID, type, result);
        }
        callback(err, result);
      });
    else if (type == "Services")
      generateJSON_Services(function (err, result) {
        if (err) {
          if (err == 'invalid')
            archiveJSON(centreID, type + '-invalid', url.format(jsonURL), { invalid: result });
          else
            archiveJSON(centreID, type + '-error', url.format(jsonURL), { error: err });
        }
        else {
          archiveJSON(centreID, type, url.format(jsonURL), result);
          digestJSON(centreID, type, result);
        }
        callback(err, result);
      });
    else
      generateJSON_Monitor(function (err, result) {
        if (err) {
          if (err == 'invalid')
            archiveJSON(centreID, type + '-invalid', url.format(jsonURL), { invalid: result });
          else
            archiveJSON(centreID, type + '-error', url.format(jsonURL), { error: err });
        }
        else {
          archiveJSON(centreID, type, url.format(jsonURL), result);
          digestJSON(centreID, type, result);
        }
        callback(err, result);
      });
  }
  else {
    if (type == "AORCentres")
      fetchJSON(jsonURL, schema_aorcentres, function (err, result) {
        if (err) {
          if (err == 'invalid')
            archiveJSON(centreID, type + '-invalid', url.format(jsonURL), { invalid: result });
          else
            archiveJSON(centreID, type + '-error', url.format(jsonURL), { error: err });
        }
        else {
          result.timestamp = utl.formatISODate(result.timestamp).toISOString();
          archiveJSON(centreID, type, url.format(jsonURL), result);
          digestJSON(centreID, type, result);
        }
        callback(err, result);
      });
    else if (type == "Events")
      fetchJSON(jsonURL, schema_events, function (err, result) {
        if (err) {
          if (err == 'invalid')
            archiveJSON(centreID, type + '-invalid', url.format(jsonURL), { invalid: result });
          else
            archiveJSON(centreID, type + '-error', url.format(jsonURL), { error: err });
        }
        else {
          result.timestamp = utl.formatISODate(result.timestamp).toISOString();
          for (var i = 0; i < result.events.length; i++) {
            result.events[i].start = utl.formatISODate(eventsjson.events[i].start).toISOString();
            result.events[i].end = utl.formatISODate(eventsjson.events[i].end).toISOString();
          }
          archiveJSON(centreID, type, url.format(jsonURL), result);
          digestJSON(centreID, type, result);
        }
        callback(err, result);
      });
    else if (type == 'Services')
      fetchJSON(jsonURL, schema_monitor, function (err, result) {
        if (err) {
          if (err == 'invalid')
            archiveJSON(centreID, type + '-invalid', url.format(jsonURL), { invalid: result });
          else
            archiveJSON(centreID, type + '-error', url.format(jsonURL), { error: err });
        }
        else {
          result.timestamp = utl.formatISODate(result.timestamp).toISOString();
          archiveJSON(centreID, type, url.format(jsonURL), result);
          digestJSON(centreID, type, result);
        }
        callback(err, result);
      });
    else
      fetchJSON(jsonURL, schema_monitor, function (err, result) {
        if (err) {
          if (err == 'invalid')
            archiveJSON(centreID, type + '-invalid', url.format(jsonURL), { invalid: result });
          else
            archiveJSON(centreID, type + '-error', url.format(jsonURL), { error: err });
        }
        else {
          result.timestamp = utl.formatISODate(result.timestamp).toISOString();
          archiveJSON(centreID, type, url.format(jsonURL), result);
          digestJSON(centreID, type, result);
        }
        callback(err, result);
      });
  }
}

exports.queryMetrics = function (redis_key, callback, begin_timestamp, end_timestamp) {
  var dataset = [];
  redis_cli.hgetall(redis_key, function (err, hitems) {
    redis_cli.hkeys(redis_key, function (err, hkey) {
      var hkeys = [];
      var hvals = [];
      var data = null;
      hkey.forEach(function (element, index, array) {
        var timestamp = parseInt(element);
        if (end_timestamp) {
          if (timestamp > end_timestamp)
            // ignore 
            return true;
        }
        else
          end_timestamp = 0;
  
        if (begin_timestamp) {
          if (timestamp < begin_timestamp) {
            // ignore 
            return true;
          }
        }
        else
          begin_timestamp = 0;
        
        hkeys.push(timestamp);
        if (hitems.hasOwnProperty(element)) {
          data = parseInt(hitems[element]);
          hvals.push(data);
          dataset.push(
          {
            'key': timestamp,
            'val': data
          });
        }
        else {
          hvals.push(null);
          dataset.push(
          {
            'key': timestamp,
            'val': null
          });
        }
      });
      //callback(hkeys, hvals);
      callback(dataset);
    });
  });
}

