var bunyan = require('bunyan');
var logger = bunyan.createLogger({
  name: 'wismon',
  streams: [
    {
      stream: process.stdout,
      level: 'info',
      serializers: bunyan.stdSerializers
    },
    {
      type: 'rotating-file',
      path: __dirname + '/../log/info.log',
      period: '1d',
      count: 35,
      level: 'debug',
      serializers: bunyan.stdSerializers
    }
  ]
});

module.exports = logger;
