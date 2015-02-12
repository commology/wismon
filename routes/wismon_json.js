var express = require('express');
var router = express.Router();

var monJSON = require('../modules/wismon_monjson.js');

var responseMonitorJSON = function (req, res) {
  monJSON.getJSON(null, null, 'Monitor', function (err, monjson) {
    var date = new Date();
    console.log(date.toISOString() + ' Monitor JSON request from ' + req.ip + ' ' + req.ips);
    res.charset = 'utf-8';
    res.type('application/json');
    //res.json(monjson);
    res.send(JSON.stringify(monjson, null, '  '));
  });
}
router.all('/monitor.json', responseMonitorJSON);

var responseEventsJSON = function (req, res) {
  monJSON.getJSON(null, null, 'Events', function (err, eventsjson) {
    var date = new Date();
    console.log(date.toISOString() + ' Events JSON request from ' + req.ip + ' ' + req.ips);
    res.charset = 'utf-8';
    res.type('application/json');
    var timelinejson = [];
    if (req.query.timeline) {
      eventsjson.events.forEach (function (event) {
        timelinejson.push({
          start: event.start,
          end: event.end,
          content: event.title + '<br>' + event.text
        });
      });
      res.json(timelinejson);
    }
    else {
      res.send(JSON.stringify(eventsjson, null, '  '));
    }
  });
}
router.all('/events.json', responseEventsJSON);

var responseAORCentresJSON = function (req, res) {
  monJSON.getJSON(null, null, 'AORCentres', function (err, aorjson) {
    var date = new Date();
    console.log(date.toISOString() + ' AORCentres JSON request from ' + req.ip + ' ' + req.ips);
    res.charset = 'utf-8';
    res.type('application/json');
    //res.json(aorjson);
    res.send(JSON.stringify(aorjson, null, '  '));
  });
}
router.all('/centres.json', responseAORCentresJSON);

module.exports = router;

