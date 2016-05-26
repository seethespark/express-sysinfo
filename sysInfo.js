var os = require('os');

var sysinfoCounter = 0,
  sysinfoCounters = [];

/**
 * Convert seconds into a days hh:nn:ss format
 * @param {integer} seconds
 * @return {string}
 */
function secondsToTimeString(seconds) {
  var days   = Math.floor(seconds / 3600 / 24);
  var hours = Math.floor((seconds - (days * 24 * 3600)) / 3600);
  var minutes = Math.floor((seconds - (days * 24 * 3600) - (hours * 3600)) / 60);
  var sec = seconds - (days * 24 * 3600) - (hours * 3600) - (minutes * 60);

  sec = Math.round(sec);
  if (hours   < 10) {hours   = '0'+hours;}
  if (minutes < 10) {minutes = '0'+minutes;}
  if (sec < 10) {sec = '0'+sec;}
  return days + 'd ' + hours+':'+minutes+':'+sec;
}

/**
 * Turn the info object into basic HTML
 * @param {object} info - info object from sysInfo function
 * @return {string}
 */
function outTable(info) {
  var out = '<!DOCTYPE html>\n<html>\n<head>\n<title>Server info</title>\n</head>\n<body>\n<table>\n<thead>\n<tr><th>Name</th><th>Value</th></tr>\n</thead>\n<tbody>\n';
  
  out += '<tr><td>OS hostname</td><td>';
  out += info.osHostname;
  out += '</td></tr>\n<tr><td>OS free memory</td><td>';
  out += info.osFreemem;
  out += ' mb</td></tr>\n<tr><td>OS total memory</td><td>';
  out += info.osTotalmem;
  out += ' mb</td></tr>\n<tr><td>OS uptime</td><td>';
  out += info.osUptime;
  if (os.platform() !== 'win32') {
    out += '</td></tr>\n<tr><td>OS load average 1 min</td><td>';
    out += info.osLoadav1;
    out += '</td></tr>\n<tr><td>OS load average 5 min</td><td>';
    out += info.osLoadav5;
    out += '</td></tr>\n<tr><td>OS load average 15 min</td><td>';
    out += info.osLoadav15;
  }
  out += '</td></tr>\n<tr><td>Process memory usage resident set size</td><td>';
  out += info.procMemoryusageRss;
  out += ' mb</td></tr>\n<tr><td>Process memory usage heap total</td><td>';
  out += info.procMemoryusageHeaptotal;
  out += ' mb</td></tr>\n<tr><td>Process memory usage heap used</td><td>';
  out += info.procMemoryusageHeapused;
  out += ' mb</td></tr>\n<tr><td>Process Node version</td><td>';
  out += info.procVersionsNode;
  out += '</td></tr>\n<tr><td>Process V8 version</td><td>';
  out += info.procVersionsV8;
  out += '</td></tr>\n<tr><td>Process OpenSSL version</td><td>';
  out += info.procVersionsOpenssl;
  out += '</td></tr>\n<tr><td>Process uptime</td><td>';
  out += info.procUptime;
  if (info.procPageviewsSec) {
    out += '</td></tr>\n<tr><td>Current page views/second</td><td>';
    out += info.procPageviewsSec;
    out += '</td></tr>\n<tr><td>Average pageviews/second 15 mins</td><td>';
    out += info.procPageviewsSec15;
    out += '</td></tr>\n<tr><td>Average pageviews/second 60 mins</td><td>';
    out += info.procPageviewsSec60;
  }
  out += '</td></tr>\n</tbody>\n</table>\n</body>\n</html>';

  return out;
}


/**
 * Clears the page view counter and stores the result
 * @param {integer} imterval - time between clearing counter in milliseconds
 */
function cleardown(interval) {
  // Array manipulation as suggested by https://gamealchemist.wordpress.com/2013/05/01/lets-get-those-javascript-arrays-to-work-fast/
  setInterval(function() {
    var len = sysinfoCounters.length;
    while (len) { 
      sysinfoCounters[len] = sysinfoCounters[len-1]; len--
    }
    sysinfoCounters[0] = sysinfoCounter;
    sysinfoCounter = 0;
    if (sysinfoCounters.length > 60*3600*1000/interval) {
      sysinfoCounters.length = 60*3600*1000/interval;
    }
    
  }, interval);
}

/**
 * Get a function which matches the standard Express handler.  The inner function gets system information and sends it out on the response
 * @param {object} options - map of available options.  cleardownInterval, returnFormatm viewerUrl, viewOnly, countOnly
 * 
 */
function sysInfo (options) {
  options = options || {};
  options.cleardownInterval = options.cleardownInterval || 3000;
  options.returnFormat = options.returnFormat || 'HTML';
  options.viewerUrl = options.viewerUrl || '/sysinfo';

  if (options.cleardownInterval > 15*60*1000) {
    console.log('cleardownInterval can\'t be more than 15 minutes.');
    options.cleardownInterval = 15*60*1000;
  }
  if (options.viewOnly !== true) {
    cleardown(options.cleardownInterval);
  }
  
  return function (req, res, next) {
    /// Show the info
    if (req.url === options.viewerUrl && req.method === 'GET' && options.countOnly !== true) {
      var procPageviews = 0, procPageviewsSec = 0, procPageviewsSec1 = 0, procPageviewsSec5 = 0, procPageviewsSec15 = 0, procPageviewsSec60 = 0;

      for(var i = 0, l = sysinfoCounters.length; i < l; i++) {
        procPageviews+= sysinfoCounters[i];
        if (i <= Math.round(15 / (options.cleardownInterval/1000))) { // 15 second average
          procPageviewsSec = procPageviews / 15;
        }
        if (i <= Math.round(60 / (options.cleardownInterval/1000))) { //1 minute average
          procPageviewsSec1 = procPageviews / 60;
        }
        if (i <= Math.round(5*60 / (options.cleardownInterval/1000))) { //5 minute average
          procPageviewsSec5 = procPageviews / 300;
        } 
        if (i <= Math.round(15*60 / (options.cleardownInterval/1000))) { //15 minute average
          procPageviewsSec15 = procPageviews / 900;
        } 
        if (i <= Math.round(3600 / (options.cleardownInterval/1000))) { //60 minute average
          procPageviewsSec60 = procPageviews / 3600;
        }
      }
      var info = {
        osHostname: os.hostname(),
        osFreemem: Math.round(os.freemem()/1024/1024),
        osTotalmem: Math.round(os.totalmem()/1024/1024),
        osLoadav1: os.loadavg()[0],
        osLoadav5: os.loadavg()[1],
        osLoadav15: os.loadavg()[2],
        osUptime: secondsToTimeString(os.uptime()),
        procMemoryusageRss: Math.round(process.memoryUsage().rss/1024/1024),
        procMemoryusageHeaptotal: Math.round(process.memoryUsage().heapTotal/1024/1024),
        procMemoryusageHeapused: Math.round(process.memoryUsage().heapUsed/1024/1024),
        procVersionsNode: process.versions.node,
        procVersionsV8: process.versions.v8,
        procVersionsOpenssl: process.versions.openssl,
        procUptime: secondsToTimeString(process.uptime()),
      }
      if (sysinfoCounters.length > 0) {
        info.procPageviewsSec = procPageviewsSec.toFixed(1);
        info.procPageviewsSec1 = procPageviewsSec1.toFixed(1);
        info.procPageviewsSec5 = procPageviewsSec5.toFixed(1);
        info.procPageviewsSec15 = procPageviewsSec15.toFixed(1);
        info.procPageviewsSec60 = procPageviewsSec60.toFixed(1);
      }

      if (options.returnFormat === 'HTML') {
        res.send(outTable(info));
        res.end();
      } else if (options.returnFormat === 'JSON') {
        res.send(info);
        res.end();
      }
      else {
        res.render(options.returnFormat, info);
      }
    } else if (options.viewOnly !== true) {
      /// Log a page view
      sysinfoCounter++;
      next();
    } else {
      console.log('sysInfo settings mismatch.')
      next();
    }
  }
}


module.exports = sysInfo;