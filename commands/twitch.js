const http = require('http');
const https = require('https');
const fs = require("fs");
const bodyParser = require('body-parser');
var url = require('url');
var randomBoolean = require('random-boolean');
var express = require('express');
var parseString = require('xml2js').parseString;
require("collections/shim-array");
require("collections/listen/array-changes");

var channel, 
	clientID,
	clientSecret,
	host,
	port,
	path;

exports.run = function(config, msg) {

}

exports.messageFired = function(config,msg) {
	//do nothing  
}

exports.init = function(seth, config){
	 channel = seth.channels.get("309108850039062538");
	//get the Client ID and Client Secret
	clientID = config.twitch.twitch_client_id;
	clientSecret = config.twitch.twitch_client_secret;
	host = config.twitch.twitch_callback_host;
	port = config.twitch.twitch_callback_port;
	path = config.twitch.twitch_callback_path;


	console.log("Twitch Webook callback initializing...");
	var app = express();
	app.use(bodyParser.json());
	app.get('/seth/twitch', function(req, res) { 
		var url_parts = url.parse(req.url, true);
		var challenge = url_parts.query['hub.challenge'];
		res.writeHead(200);
		if(challenge)
			res.write(challenge);
		res.end();
	  console.log("something hit me with a get :]");
	});
	app.post('/seth/twitch', function(req, res) {
		var url_parts = url.parse(req.url, true);
		console.log(url_parts);
		var data = req.body.data;
		if(typeof data[0] == "undefined") {
			console.log("something just ended... we can ignore it.");
		}else{
			channel.send("Recieved from twitch: "+JSON.stringify(data[0]));
		}
			
		console.log("something hit me with a post :]");
	  res.sendStatus(200);
	});
	app.listen(3001);
	console.log('Listening on port 3001...');

	var subs = config.twitch.subscriptions;
	for (var sub in subs){
		setUpSubscription(subs[sub]);
	}
	// channel.send("I AM SENTIENT ");
	//setUpKyleSubscription(config);
}

function setUpSubscription(name){

	var options = {
		host: "api.twitch.tv",
		port: 443,
		path: '/kraken/users/'+name,
		method: 'GET',
		headers: {
		    'Client-ID': clientID
		  }
	};

		https.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			var ret = JSON.parse(chunk);
			console.log(chunk);
			if(typeof ret !== "undefined" && ret._id !== undefined){
				options = {
					host: "api.twitch.tv",
					port: 443,
					path: '/helix/webhooks/hub?hub.mode=subscribe&hub.topic=https://api.twitch.tv/helix/streams?user_id='+ret._id+'&hub.callback='+host+':'+port+''+path+'&hub.lease_seconds=172800',
					method: 'POST',
					headers: {
					    'Client-ID': clientID
					  }
				};

				https.request(options, function(response) {
					response.setEncoding('utf8');
					response.on('data', function (data) {
						console.log(JSON.parse(data));
			  		});
				}).end();
			}
  		});
	}).end();

	// 	console.log(accessToken);
	// });
}

//Currently Unused
function getAccessToken(token){
	var options = {
	  host: "api.twitch.tv",
	  port: 443,
	  path: '/kraken/oauth2/token?client_id='+clientID+'&client_secret='+clientSecret+'&grant_type=client_credentials',
	  method: 'POST'
	};

	https.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			token(JSON.parse(chunk).access_token);
  		});
	}).end();
}