var express = require('express');
var router = express.Router();

var async = require('async');
var fs = require('fs');
var path = require('path');
var net = require('net');
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var crypto = require('crypto');
var humanize = require('humanize');
var cronjob = require('node-crontab');
var crontab = require('crontab');

var utl = require('../modules/wismon_utl.js');
var svc = require('../modules/wismon_svc.js');
var oaih = require('../modules/wismon_oai_harvester.js');

var config = require('../modules/wismon_config.js');


router.get('/', function(req, res) {
  res.send('');
});

router.get('/stat', function(req, res) {
  if (utl.isAllowed(req, res, 'OAI Statistics', 'VIEW_OAI_STATISTICS')) {
    var today = new Date();
    var yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    res.redirect('digest/' + utl.stringifyDate(yesterday));
  }
  else {
    res.sendStatus(403);
  }
});

router.get('/stat/:date', function(req, res) {
  var date = req.params.date;
  if (!date || utl.trim(date).length < 6) {
    var today = new Date();
    date = utl.stringifyDate(today);
  }

  date = date.substring(0, 8);
  var MDStat = {};
  var pathname = path.resolve(__dirname, '../oai/stat/');
  fs.readdir(pathname, function (err, files) {
    for (var f = 0; f < files.length; f++) {
      var fn = pathname + '/' + files[f];
      if (fn.indexOf('statMetadata') >= 0 && fn.lastIndexOf('.txt') >=0
      && fn.indexOf('_' + date) > 0) {
        var stat = fs.readFileSync(fn).toString();
        var lines = stat.split('\n');
        var Set;
        var head;
        var part = 1;
        var isHead = true;
        for (var l = 0; l < lines.length; l++) {
          if (utl.trim(lines[l]).length == 0) {
            part++;
            isHead = true;
            continue;
          }
          items = lines[l].split(' ');
          if (isHead) {
            if (part == 1) {
              Set = items[0];
              head = items;
              MDStat[Set] = {};
            }
            if (part >= 2) {
              head = items;
            }
            isHead = false;
            continue;
          }
          var centre;
          for (var i = 0; i < items.length; i++) {
            //console.log('(' + l + ',' + i + ')' + items[i]);
            if (part == 1) {
              if (i == 0) {
                centre = utl.capitalize(items[0]);
                MDStat[Set][centre] = {};
              }
              else {
                var ilbrace = items[i].indexOf('[');
                var irbrace = items[i].lastIndexOf(']');
                MDStat[Set][centre][head[i]] = {};
                if(ilbrace >= 0 && irbrace >= 0) {
                  MDStat[Set][centre][head[i]]['number'] = items[i].substring(0, ilbrace);
                  MDStat[Set][centre][head[i]]['filename'] = items[i].substring(ilbrace+1, irbrace);
                }
                else {
                  MDStat[Set][centre][head[i]]['number'] = items[i];
                  MDStat[Set][centre][head[i]]['filename'] = '';
                }
              }
            }
            if (part >= 2) {
              var type;
              switch (part) {
                case 2:
                  type = 'TOTAL';
                  break;
                case 3:
                  type = 'TOTAL(1D)';
                  break;
                case 4:
                  type = 'DELETED(1D)';
                  break;
                default:
                  break;
              }
              if (i == 0) {
                centre = utl.capitalize(items[0]);
                MDStat[Set][centre][type + '_DIFF'] = {};
              }
              else {
                var ilbrace = items[i].indexOf('[');
                var irbrace = items[i].lastIndexOf(']');
                MDStat[Set][centre][type + '_DIFF'][utl.capitalize(head[i])] = {};
                if(ilbrace >= 0 && irbrace >= 0) {
                  MDStat[Set][centre][type + '_DIFF'][utl.capitalize(head[i])]['number'] = items[i].substring(0, ilbrace);
                  MDStat[Set][centre][type + '_DIFF'][utl.capitalize(head[i])]['filename'] = items[i].substring(ilbrace+1, irbrace);
                }
                else {
                  MDStat[Set][centre][type + '_DIFF'][utl.capitalize(head[i])]['number'] = items[i];
                  MDStat[Set][centre][type + '_DIFF'][utl.capitalize(head[i])]['filename'] = '';
                }
              }
            }
          }
        }
      }
    }
    
    //console.log(JSON.stringify(MDStat, null, '  '));
    var outSummary = '<table border=1>';
    outSummary += '<tr>';
    for (var Set in MDStat) {
      outSummary += '<th>';
      outSummary += '</th>';
      for (var centre in MDStat[Set]) {
        outSummary += '<th>';
        outSummary += centre;
        outSummary += '</th>';
      }
      break;
    }
    outSummary += '</tr>';
    for (var Set in MDStat) {
      outSummary += '<tr>';
      outSummary += '<th>';
      outSummary += Set;
      outSummary += '</th>';
      for (var centre in MDStat[Set]) {
        outSummary += '<td>';
        outSummary += '<a href=\'../MDlist/' + MDStat[Set][centre]['TOTAL']['filename'] + '\' >' + MDStat[Set][centre]['TOTAL']['number'
] + '</a>' + '<br>';
        outSummary += '<a href=\'../MDlist/' + MDStat[Set][centre]['TOTAL(1D)']['filename'] + '\'>' + MDStat[Set][centre]['TOTAL(1D)']['number'] + '</a>' + '<br>';
        outSummary += '<a href=\'../MDlist/' + MDStat[Set][centre]['DELETED(1D)']['filename'] + '\'>' + MDStat[Set][centre]['DELETED(1D)']['number'] + '</a>';
        outSummary += '</td>';
      }
      outSummary += '</tr>';
    }
    outSummary += '</table>';
    
    res.charset = 'utf-8';
    if (req.xhr) {
      res.send(outSummary);
    }
    else {
      //res.render('dashboard', monjson);
      res.send('<!--' + JSON.stringify(MDStat, null, '  ') + '-->');
    }
  });
});

module.exports = router;

