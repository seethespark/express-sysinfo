/*jslint node: true */
/*jslint esversion: 6 */
var os = require('os');

var pageviewCounter = 0,
  pageviewCounters = [],
  sysMemory = new Array(45),
  sysCPU = new Array(45),
  saveSysLoadtimer;

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
 * Take a set of values and create an SVG chart
 * @param {array} points
 * @param {object} options - options for this function, maxVal: for the Y axis, xLabel:, yLabel:, yMarkerSuffix: units tp show after marker values
 * @return {string}
 */
function memChart(points, options) {
  /// points must have most recent value first
  /// xmin etc are all pixels for chart size, maxVal is the scale so the max mamory
  var out, xmin = 40, xmax = 400, ymin = 30, ymax = 300, yaxis, _points;
  try {
    options = options || {};
    options.maxVal = options.maxVal || 150;
    options.xLabel = options.xLabel || '';
    options.yLabel = options.yLabel || '';
    options.yMarkerSuffix = options.yMarkerSuffix || '';

    yaxis = new Array(options.maxVal/10);

    _points = points.map(function(point, pointNum) {
      pointx = xmax - pointNum * (xmax-xmin)/points.length;
      pointy = ymax - ymin - (point * (ymax-ymin)/options.maxVal);
      // pointy = 300 - (80/120 * (300-20));
      if (pointy) {
        return String(pointx) + ',' + String(Math.round(pointy));
      }
    }).filter(function(point) {
      if (point && point.indexOf('NaN') === -1) { return true; }
    });

    /// Build the labels for the Y axis
    for (var i = 0; i < (options.maxVal / 10) + 1; i++) {
      if (options.maxVal > 190 && i%2 !== 0) {
        continue;
      }
      /// +4 on the next line is to allow mark to be in the middle of the number
      yaxis[i] =  '<text x="39" y="'+ String(Math.round(ymax -ymin + 5 - ((10*i) * (ymax-ymin))/options.maxVal)) + '">'+ i*10 + options.yMarkerSuffix + '</text>';
    }

    out = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="chart" aria-labelledby="title" role="img">
      <title id="title">A line chart showing server stats</title>
    <g class="grid x-grid" id="xGrid">
      <line x1="40" x2="40" y1="5" y2="280"></line>
    </g>
    <g class="grid y-grid" id="yGrid">
      <line x1="40" x2="400" y1="280" y2="280"></line>
    </g>
      <g class="labels x-labels">
      <text x="40" y="292">-15</text>
      <text x="160" y="292">-10</text>
      <text x="280" y="292">-5</text>
      <text x="390" y="292">-0</text>
      <text x="200" y="299" class="label-x">`;
    out += options.xLabel;
    out += `</text>
      </g>
      <g class="labels y-labels">`;
    out += yaxis.join('\n');
    out += '<text x="-140" y="10" class="label-y">';
    out += options.yLabel;
    out += `</text>
     </g>
    <polyline
         fill="none"
         stroke="#0074d9"
         stroke-width="2"
         points="`;
    out += _points.join('\n');
    out += `
      " />
    </svg>`;
  } catch(err) {
    console.log('express-sysinfo error');
    console.log(err);
    out = 'Chart error';
  }
return out;
}

function chartCss() {
  var out = `<style>
  .chart {
    background: white;
    height: 300px;
    width: 400px;
    /*padding: 20px 20px 20px 0;*/
  }

  .chart .labels.x-labels {
    text-anchor: middle;
  }

  .chart .labels.y-labels {
    text-anchor: end;
  }
  .chart .grid {
    stroke: #ccc;
    stroke-dasharray: 0;
    stroke-width: 1;
  }
  .labels {
    font-size: 12px;
  }

  .label-y {
    font-weight: bold;
    transform: rotate(270deg);
    transform-origin: right top 0;
    float: left;
  }

  .label-x {
    font-weight: bold;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  table tbody {
    display: table-row-group;
  }

  table tr {
    display: table-row;
  }

  table tr:nth-child(odd) td {
    background-color: #F6F6F6;
  }

  table thead {
    display: table-header-group;
  }

  table td, th {
    display: table-cell;
    border: 1px solid #CCC;
    padding: 2px 10px;
    text-align: left;
  }

  </style>
  `;
  return out;
}


/**
 * Turn the info object into basic HTML
 * @param {object} info - info object from sysInfo function
 * @param {object} options - options passed in from the calling app
 * @return {string}
 */
function outTable(info, options) {
  var out;
  try {
    out = '<!DOCTYPE html>\n<html>\n<head>\n<title>Server info</title>\n';
    out += chartCss();
    out += '</head>\n<body>\n<table>\n<thead>\n<tr><th>Measure name</th><th>Value</th></tr>\n</thead>\n<tbody>\n';
    
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
    out += '</td></tr>\n</tbody>\n</table>\n';
    out += '<p>Process memory usage in the past 15 minutes</p>\n';
    out += memChart(sysMemory, {
      maxVal: options.maxMemoryToDisplay,
      xLabel:'Minutes',
      yLabel: 'Process memory (RSS)',
      yMarkerSuffix: 'mb'
    });
    if (os.platform() !== 'win32') {
      out += '<p>CPU usage in the past 15 minutes</p>\n';

      out += memChart(sysCPU, {
        maxVal: 100,
        xLabel:'Minutes',
        yLabel: 'CPU',
        yMarkerSuffix: '%'
      });
    }
    out += '</body>\n</html>';
  } catch (err) {
    console.log('express-sysinfo error');
    console.log(err);
    out = 'Chart error';
  }
  return out;
}

/**
 * Save the current resident set memory size and CPU load into an array
 */
function saveSysLoad() {
  try {
    var len = sysMemory.length-1;
    while (len) {
      sysMemory[len] = sysMemory[len-1];
      len--;
    }
    sysMemory[0] = Math.round(process.memoryUsage().rss/1024/1024);

    /// CPU 
    if (os.platform() !== 'win32') {
      len = sysCPU.length-1;
      while (len) {
        sysCPU[len] = sysCPU[len-1];
        len--;
      }
      sysCPU[0] = os.loadavg()[0];
    }
  } catch (err) {
    console.log('express-sysinfo error');
    console.log(err);
  }

}


/**
 * Clears the page view counter and stores the result
 * @param {integer} imterval - time between clearing counter in milliseconds
 */
function cleardown(interval) {
  // Array manipulation as suggested by https://gamealchemist.wordpress.com/2013/05/01/lets-get-those-javascript-arrays-to-work-fast/
  setInterval(function() {
    var len = pageviewCounters.length;
    while (len) { 
      pageviewCounters[len] = pageviewCounters[len-1]; 
      len--;
    }
    pageviewCounters[0] = pageviewCounter;
    pageviewCounter = 0;
    if (pageviewCounters.length > 60*3600*1000/interval) {
      pageviewCounters.length = 60*3600*1000/interval;
    }
    
  }, interval);
}

/**
 * Get a function which matches the standard Express handler.  The inner function gets system information and sends it out on the response
 * @param {object} options - map of available options.  cleardownInterval, returnFormat, viewerUrl, viewOnly, countOnly
 * 
 */
function sysInfo (options) {
  options = options || {};
  options.cleardownInterval = options.cleardownInterval || 3000;
  options.returnFormat = options.returnFormat || 'HTML';
  options.viewerUrl = options.viewerUrl || '/sysinfo';
  options.maxMemoryToDisplay = options.maxMemoryToDisplay || 150;

  if (options.cleardownInterval > 15*60*1000) {
    console.log('cleardownInterval can\'t be more than 15 minutes.');
    options.cleardownInterval = 15*60*1000;
  }
  if (options.viewOnly !== true) {
    cleardown(options.cleardownInterval);
  }
  if (saveSysLoadtimer === undefined) {
    setTimeout(saveSysLoad, 200); // run once after the app has loaded, rather arbitrary 200ms
    saveSysLoadtimer = setInterval(saveSysLoad, 20*1000);  // Every 20 seconds.  If this changes the array size should be cahnged too (declared at the top.)
  }
  
  return function (req, res, next) {
    try {
      /// Show the info
      if (req.url === options.viewerUrl && req.method === 'GET' && options.countOnly !== true) {
        var procPageviews = 0, procPageviewsSec = 0, procPageviewsSec1 = 0, procPageviewsSec5 = 0, procPageviewsSec15 = 0, procPageviewsSec60 = 0;

        for(var i = 0, l = pageviewCounters.length; i < l; i++) {
          procPageviews+= pageviewCounters[i];
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
        };
        if (pageviewCounters.length > 0) {
          info.procPageviewsSec = procPageviewsSec.toFixed(1);
          info.procPageviewsSec1 = procPageviewsSec1.toFixed(1);
          info.procPageviewsSec5 = procPageviewsSec5.toFixed(1);
          info.procPageviewsSec15 = procPageviewsSec15.toFixed(1);
          info.procPageviewsSec60 = procPageviewsSec60.toFixed(1);
        }

        if (options.returnFormat === 'HTML') {
          res.send(outTable(info, options));
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
        pageviewCounter++;
        next();
      } else {
        console.log('sysInfo settings mismatch.');
        next();
      }
    } catch (err) {
      return next(err);
    }
  };

}


module.exports = sysInfo;