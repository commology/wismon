var async = require('async');
var fs = require('fs');
var path = require('path');
var url = require('url');

var utl = require('./wismon_utl.js');
var svc = require('./wismon_svc.js');
var log = require('./wismon_logger.js');

exports.harvestMetadataHead = function (centreID, jsonURL) {
  log.info('OAI Harvester from ' + centreID + ' started.');
  log.info('@' + url.format(jsonURL));
  async.waterfall([
    function(callback) {
      svc.accessOAIProvider(
          jsonURL.hostname,
          jsonURL.port,
          jsonURL.pathname,
          'Identify',
          '',
        function (err, result) {
          if (err) {
            callback(err, result);
            return;
          }
          result['OAI-PMH'].Identify[0].granularity.forEach(function(element, index, array) {
            if (element.lastIndexOf('hh:mm:ss') > 0) {
              callback(err, true);
              return true;
            }
            else
              callback(err, false);
          });
        }
      );
    },
    function(resGranularity, callback) {
      // console.log(resGranularity);
      svc.accessOAIProvider(
          jsonURL.hostname,
          jsonURL.port,
          jsonURL.pathname,
          'ListMetadataFormats',
          '',
        function (err, result) {
          if (err) {
            callback(err, result);
            return;
          }
          var bSupportISO19139 = false;
          var metadataFormat = result['OAI-PMH'].ListMetadataFormats[0].metadataFormat;
          if (!metadataFormat) {
            callback('invalid metadata formats', null);
            return;
          }
          for (var i = 0; i < metadataFormat.length; i++) {
            if (metadataFormat[i].metadataPrefix[0] == 'iso19139') {
              bSupportISO19139 = true;
              break;
            }
          }
          if (!bSupportISO19139) {
            callback('unknown metadata formats', metadataFormats);
            return;
          }
          callback(err, { metadataFormat: 'iso19139' });
        }
      );
    },
    function(resMetadataFormat, callback) {
      svc.accessOAIProvider(
          jsonURL.hostname,
          jsonURL.port,
          jsonURL.pathname,
          'ListSets',
          '',
        function (err, result) {
          if (err) {
            callback(err, result);
            return;
          }
          resMetadataFormat.set = result;
          callback(err, resMetadataFormat);
        }
      );
    },
    function(resMetadataSets, callback) {
      var pathOAIHead = path.resolve(__dirname, '../oai/header');
      if (!fs.existsSync(pathOAIHead)) fs.mkdirSync(pathOAIHead, 0755);
      
      var timestamp = new Date();
      var timestring = utl.stringifyDate(timestamp);
      for (var key in resMetadataSets.set) {
        if (centreID == 'beijing') {
          var date = new Date();
          var target = null;
          switch (date.getUTCHours()) {
            case  5: target = 'WIS-GISC-BEIJING'; break;
            case 10: target = 'WIS-GISC-MELBOURNE'; break;
            case 11: target = 'WIS-GISC-SEOUL'; break;
            case 12: target = 'WIS-GISC-EXETER'; break;
            case 13: target = 'WIS-GISC-TOULOUSE'; break;
            case 14: target = 'WIS-GISC-TEHRAN'; break;
            case 15: target = 'WIS-GISC-MOSCOW'; break;
            case 17: target = 'WIS-CATALOGUE'; break;
            case 20: target = 'WIS-GISC-OFFENBACH'; break;
            case 21: target = 'WIS-GISC-TOKYO'; break;
            case 22: target = 'WIS-GISC-BEIJING'; break;
          }
          if (!target || key != target) continue;
        }
        svc.accessOAIProvider(
            jsonURL.hostname,
            jsonURL.port,
            jsonURL.pathname,
            'ListIdentifiers',
            '&metadataPrefix=' + resMetadataSets.metadataFormat + '&set=' + key,
          function (err, result) {
            if (err) {
              callback(err, result);
              return;
            }
            //console.log(JSON.stringify(result['OAI-PMH'], null, '  '));
            if (!result['OAI-PMH'].hasOwnProperty('ListIdentifiers')) {
              callback('OAI Provider replied empty', result);
              return;
            }
            var setSpec = result['OAI-PMH'].request[0]['$'].set;
            var filenameOAIHead = path.resolve(__dirname, '../oai/header/' + setSpec + '_' + centreID + '_' + timestring + '.txt');
            var filenameOAIHeadDeleted = path.resolve(__dirname, '../oai/header/' + setSpec + '(deleted)' + '_' + centreID + '_' + timestring + '.txt');
            var resumptionToken = svc.getJSONXMLtext(result['OAI-PMH']['ListIdentifiers'][0].resumptionToken);
            fs.writeFileSync(filenameOAIHead, '');
            fs.writeFileSync(filenameOAIHeadDeleted, '');
            result['OAI-PMH']['ListIdentifiers'][0].header.forEach(function (head) {
              var line = head.identifier[0] + ' ' + head.datestamp[0] + ' ' + head.setSpec[0];
              if (head.hasOwnProperty('$') && head['$'].hasOwnProperty('status')) {
                line += ' ' + head['$'].status;
                fs.appendFileSync(filenameOAIHeadDeleted, line + '\n');
              }
              else {
                fs.appendFileSync(filenameOAIHead, line + '\n');
              }
            });
            async.whilst (
              function() {
                return resumptionToken;
              },
              function (err_callback) {
                svc.accessOAIProvider(
                    jsonURL.hostname,
                    jsonURL.port,
                    jsonURL.pathname,
                    'ListIdentifiers',
                    '&resumptionToken=' + resumptionToken,
                  function (errRest, resultRest) {
                    if (errRest) {
                      err_callback(errRest);
                      return;
                    }
                    //console.log(JSON.stringify(resultRest['OAI-PMH'], null, '  '));
                    if (resultRest['OAI-PMH'].hasOwnProperty('error')) {
                      //console.log(JSON.stringify(resultRest['OAI-PMH'], null, '  '));
                      err_callback([setSpec, resultRest]);
                      return;
                    }
                    resultRest['OAI-PMH']['ListIdentifiers'][0].header.forEach(function (head) {
                      var line = head.identifier[0] + ' ' + head.datestamp[0] + ' ' + head.setSpec[0];
                      if (head.hasOwnProperty('$') && head['$'].hasOwnProperty('status')) {
                        line += ' ' + head['$'].status;
                        fs.appendFileSync(filenameOAIHeadDeleted, line + '\n');
                      }
                      else {
                        fs.appendFileSync(filenameOAIHead, line + '\n');
                      }
                    });
                    resumptionToken = svc.getJSONXMLtext(resultRest['OAI-PMH']['ListIdentifiers'][0].resumptionToken);
                    if (resumptionToken) {
                    }
                    err_callback(null);
                });
              },
              function (errRest) {
                if (!errRest) {
                }
                else {
                  log.error('OAI harvesting failed: ');
                  log.error(JSON.stringify(errRest, null, '  '));
                }
              }
            );
          }
        );
      }
      callback(null, resMetadataSets.set);
    },
    function(result, callback) {
      callback(null, result);
    }
  ],
  function (err, async_result) {
    if (err) {
      log.error('OAI Harvester error: ' + err);
      log.info(async_result);
    }
  });
}

