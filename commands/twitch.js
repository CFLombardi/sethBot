const http = require('http');
const https = require('https');
const fs = require("fs");
var randomBoolean = require('random-boolean');
const bodyParser = require('body-parser');
var parseString = require('xml2js').parseString;
require("collections/shim-array");
require("collections/listen/array-changes");

var clientID,clientSecret;

exports.run = function(config, msg) {

}

exports.messageFired = function(config,msg) {
	//do nothing  
}

exports.init = function(config){
	console.log("Twitch initializing");
	var express = require('express');
	var app = express();
	app.use(bodyParser.json());
	app.post('/seth/twitch', function(req, res) {
	  console.log(req.body);
	  res.sendStatus(200);
	});
	app.listen(3001);
	console.log('Listening on port 3001...');
	clientID = config.client_id;
	clientSecret = config.client_secret;
	setUpKyleSubscription(config);
}

function setUpKyleSubscription(config){

	getAccessToken(function(accessToken){
		console.log(accessToken);
	});
}

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