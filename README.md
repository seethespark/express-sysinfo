# express-sysinfo
Basic, batteries included system information display for Express apps.  
In one line it can add a page to display the OS and process info available in Node.  It can also count page views to indicate system load.
No dependancies outside Node's built in modules for now.

## Installation

	$ npm install express-sysinfo

## Getting started
Drop a reference to express-sysinfo into your application and it will log page views.  If the correct URL is requested it will display the data.
Something like this:

	const app = require('express')();
	const http = require('http');
	const sysInfo = require('express-sysinfo');
	
	app.use(sysInfo());
	
	http.createServer(app).listen(3000, function() {
			var addr = this.address();
			console.log('My server is listening on %s:%d', addr.address, addr.port);
	});

Open a browser and go to http://localhost:3000/sysinfo

## Options
express-sysinfo takes an options parameter

|Option |Purpose |Default
|---|---|---
|cleardownInterval|Milliseconds. Page views are stored to an array and presented from there. Higher numbers load the server less but make the display less current. Max is 15 minutes.|3000
|returnFormat|The format to present the data. Available values are JSON, HTML or a valid template name.     |JSON
|viewerUrl|URL path which will display the system information.  Requires the leading slash. |/sysinfo
|countOnly | This instance only counts page views if set to true.| undefined
|viewOnly | This instance only displays system information, it doesn't count page views.| undefined


## Further usage
In its default form express-sysinfo presents the viewer to anyone who has the URL.  While it's not showing anything particularly confidential I prefer not to display this to unauthenticated users.

Tracking page views is very lightweight and should happen on every call to the server.  

For these reasons my preference is to call into express-sysinfo twice like so:
Anywhere in the Express app

	app.use(sysInfo({countOnly: true}));

After the auth checks, assuming you are using something like Passport, you can route the viewer:

	app.use('/sysinfo', ensureAuthenticated, sysInfo({viewOnly: true, returnFormat: 'HTML', viewerUrl: '/'}));
Note than the viewerUrl is relative to the route hence it's only a single slash to route to https://myserver/sysinfo

## Using templates
This is only tested with Handlebars. 
If you would prefer to presentation to match the rest of your site then express-sysinfo can take a template name and use Express's render method.

	app.use('/sysinfo', ensureAuthenticated, sysInfo({viewOnly: true, returnFormat: 'systemInfo', viewerUrl: '/'}));
The response.render function will take the returnFormat value and add an object with all of the info values.  In the example above the following could be the template file, systemInfo.hbs

	<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Value</th>
	</tr>
	</thead>
	<tr>
		<td>OS hostname</td>
		<td>{{osHostname}}</td>
	</tr>
	<tr>
		<td>OS free mem</td>
		<td>{{osFreemem}}</td>
	</tr>
	<tr>
		<td>OS total mem</td>
		<td>{{osTotalmem}}</td>
	</tr>
	<tr>
		<td>OS load average 1 minute (not Windows)</td>
		<td>{{osLoadav1}}</td>
	</tr>
	<tr>
		<td>OS load average 15 minute (not Windows)</td>
		<td>{{osLoadav15}}</td>
	</tr>
	<tr>
		<td>OS uptime</td>
		<td>{{osUptime}}</td>
	</tr>
	<tr>
		<td>Process memory usage resident set size</td>
		<td>{{procMemoryusageRss}}</td>
	</tr>
	<tr>
		<td>Process memory usage heap total</td>
		<td>{{procMemoryusageHeaptotal}}</td>
	</tr>
	<tr>
		<td>Process memory usage heap used</td>
		<td>{{procMemoryusageHeapused}}</td>
	</tr>
	<tr>
		<td>Node version</td>
		<td>{{procVersionsNode}}</td>
	</tr>
	<tr>
		<td>V8 version</td>
		<td>{{procVersionsV8}}</td>
	</tr>
	<tr>
		<td>OpenSSL version</td>
		<td>{{procVersionsOpenssl}}</td>
	</tr>
	<tr>
		<td>Node process uptime</td>
		<td>{{procUptime}}</td>
	</tr>
	<tr>
		<td>Page views per second currently</td>
		<td>{{procPageviewsSec}}</td>
	</tr>
	<tr>
		<td>Page views per second, past 15 mins</td>
		<td>{{procPageviewsSec15}}</td>
	</tr>
	<tr>
		<td>Page views per second, past hour</td>
		<td>{{procPageviewsSec60}}</td>
	</tr>
	</table>
	