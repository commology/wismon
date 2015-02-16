var fs = require('fs');
var path = require('path');
var net = require('net');
var http = require('http');
var url = require('url');
var iconv = require('iconv-lite');
var xml2js = require('xml2js');
var libxmljs = require('libxmljs');

var utl = require('./wismon_utl.js');
var log = require('./wismon_logger.js');
var cfg = require('./wismon_config.js');

var accessHTTPService = function (serviceHost, servicePort, servicePath, callback) {
  
  var req_options = {
    hostname: serviceHost,
    port: servicePort,
    path: servicePath,
    method: 'GET'
  };
  
  var req = http.request(req_options, function(res) {
    
    //console.log('STATUS: '  + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers, null, '  '));
    
    if (res.statusCode != 200) {
        callback(res.statusCode, null);
        return;
    }
    
    var contentLength = res.headers['content-length'] || '';
    contentLength = utl.trim(contentLength);
    var contentType = res.headers['content-type'] || '';
    contentType = utl.trim(contentType);
    var mimeType = contentType.split(';')[0];
    mimeType = utl.trim(mimeType);
    var charset = contentType.split(';')[1] || '';
    charset = utl.trim(charset);
    if (charset.split('=')[0].toLowerCase() == 'charset')
      charset = charset.split('=')[1];
    charset = utl.trim(charset);
    if (charset == '') charset = 'UTF-8';
    //res.setEncoding(charset);
    
    var chunks = [];
    var size = 0;
     
    res.on('data', function (chunk) {
      chunks.push(chunk);
      size += chunk.length;
    });
   
    res.on('end', function () {
      var buf = Buffer.concat(chunks, size);
      var str = iconv.decode(buf, charset);
      callback(null, str, contentType, mimeType, charset, contentLength);
    });

  });
  
  req.end();
  
  req.on('error', function (err) {
    callback(err, null);
    return;
  });
}
exports.accessHTTPService = accessHTTPService;

var getJSONXMLtext = function (element) {
  if (element) {
    var token;
    if (typeof element != 'string' && element.length > 0) {
      token = element[0];
    }
    else {
      token = element;
    }
    if (typeof token == 'string')
      return token;
    else if (typeof token == 'object') {
      if (token.hasOwnProperty('_'))
        return token['_'];
    }
    return null;
  }
  else {
    return null;
  }
}
exports.getJSONXMLtext = getJSONXMLtext;

var accessOAIProvider = function (providerHost, providerPort, providerPath, verb, params, callback) {
  
  accessHTTPService(providerHost, providerPort, providerPath + '?verb=' + verb + params,
    function (err, data, contentType, mimeType, charset, contentLength) {
      
      if (err) {
        callback(err, data);
        return;
      }

      if (!(mimeType == 'text/xml' ||  mimeType == 'application/xml')) {
        callback("not xml", data);
        return;
      }
   
      var xml = data;
      var xmlDoc = libxmljs.parseXml(xml);
      var xsdUrl = null;
      if (xmlDoc.root().attr('schemaLocation')) {
        xmlDoc.root().attr('schemaLocation').value().replace(/[ \t\r\n]+/g, ' ').split(' ')
        .forEach(function(element, index, array) {
          if (element.lastIndexOf('xsd') > 0) {
            xsdUrl = element;
            return true;
          }
        });
      }
      
      /*
      accessHTTPService(url.parse(xsdUrl).hostname, url.parse(xsdUrl).port, url.parse(xsdUrl).pathname,
        function (err, data, contentType, mimeType, charset, contentLength) {
          
          if (err) {
            callback(err, data);
            return;
          }
    
          var xsd = data;
          var xsdDoc = libxmljs.parseXml(xsd);
          if (xmlDoc.validate(xsdDoc) != true) {
            console.log(xmlDoc.validationErrors);
            callback('invalid xml', xml);
            return;
          }
      });
      */
      
      xml2js.parseString(data, function (err, jsonXML) {
      
      if (err) throw err;
         
        switch (verb) {
          
          case 'Identify':
            callback(null, jsonXML);
            break;
          
          case 'ListMetadataFormats':
            callback(null, jsonXML);
            break;
          
          case 'ListSets':
            var result = {};
            jsonXML["OAI-PMH"].ListSets[0].set.forEach(function (elemSet) {
              var setSpec = elemSet.setSpec[0];
              var setSize;
              elemSet.setDescription[0]['oai_dc:dc'][0]['dc:description'].forEach(function (elemDesc) {
                var setDesc = getJSONXMLtext(elemDesc);
                setDesc.split(' ').forEach(function (element) {
                  if (!isNaN(parseInt(element))) {
                    setSize = parseInt(element);
                    return true;
                  }
                });
              });
              //console.log(setSpec + ':' + setSize);
              result[setSpec] = setSize;
            });
            callback(null, result);
            break;
          
          case 'ListIdentifiers':
            callback(null, jsonXML);
            break;
          
          default:
            log.info(xml);
            break;
        }
      }
    );
  });
}
exports.accessOAIProvider = accessOAIProvider;

var accessSocketService = function (serviceHost, servicePort, servicePath, callback) {
  
  var client = new net.Socket();
  client.connect(servicePort, serviceHost, function () {
    //console.log('CONNECTED TO: ' + serviceHost);
  });
  
  client.on('data', function (data) {
    //console.log('DATA: ' + data);
    callback(null, data);
    client.destroy();
  });
  
  client.on('timeout', function (err) {
    callback('timeout', null);
    //console.log('TIMEOUT');
  });
  
  client.on('error', function (err) {
    callback(err, null);
    //console.log('ERROR');
  });
  
  client.on('close', function () {
    //console.log('CLOSED.');
  });
}
exports.accessSocketService = accessSocketService;

var writeServiceStatusResult = function (event, err, result) {
  if (!err) {
    fs.writeFile(path.resolve(__dirname, '../tmp/wismon_' + event + '.dat'),
        cfg.getProp('WIS_MONITOR_SERVICE_ONLINE'), function (ferr) {
      if (ferr) throw ferr;
    });
    //console.log(result);
  }
  else {
    fs.writeFile(path.resolve(__dirname, '../tmp/wismon_' + event + '.dat'),
        cfg.getProp('WIS_MONITOR_SERVICE_OFFLINE'), function (ferr) {
      if (ferr) throw ferr;
    });
    log.err('write service status result');
  }
}

var writeWISPortalStatusResult = function (err, result) {
  writeServiceStatusResult('portal', err, result);
}

var writeOAIProviderStatusResult = function (err, result) {
  writeServiceStatusResult('provider', err, result);
}

var writeMetadataCountResult = function (err, result) {
  var count = result[cfg.getProp('HOME_METADATA_SETSPEC')];
  if (!err) {
    fs.writeFile(path.resolve(__dirname, '../tmp/wismon_' + 'metadata_count' + '.dat'), count, function (ferr) {
      if (ferr) throw ferr;
    });
    //console.log(count);
  }
  else {
    fs.writeFile(path.resolve(__dirname, '../tmp/wismon_' + 'metadata_count' + '.dat'), null, function (ferr) {
      if (ferr) throw ferr;
    });
    log.error('write metadata count result');
  }
}

var writeIntraFTPStatusResult = function (err, result) {
  writeServiceStatusResult('intra_ftp', err, result);
}

var onAccessService = function (event) {
  //console.log(event);
  switch (event) {
    case 'WISPortal':
      var URL = cfg.getCentreURL(null, 'PORTAL');
      accessHTTPService(
          URL.hostname,
          URL.port,
          URL.pathname,
          writeWISPortalStatusResult);
      break;
    case 'OAIProvider':
      var URL = cfg.getCentreURL(null, 'OAI_PROVIDER');
      accessOAIProvider(
          URL.hostname,
          URL.port,
          URL.pathname,
          'ListMetadataFormats',
          '',
          writeOAIProviderStatusResult);
      break;
    case 'MetadataCount':
      var URL = cfg.getCentreURL(null, 'OAI_PROVIDER');
      accessOAIProvider(
          URL.hostname,
          URL.port,
          URL.pathname,
          'ListSets',
          '',
          writeMetadataCountResult);
      break;
    case 'IntraFTP':
      var URL = cfg.getCentreURL(null, 'CACHE24H');
      accessSocketService(
          URL.hostname,
          URL.port,
          URL.pathname,
          writeIntraFTPStatusResult);
      break;
    default:
      break;
  }
}
exports.onAccessService = onAccessService;

