const http = require('http');
const https = require('https');
const fs = require("fs");
const bodyParser = require('body-parser');
var CronJob = require('cron').CronJob;
var url = require('url');
var randomBoolean = require('random-boolean');
var express = require('express');
var parseString = require('xml2js').parseString;
require("collections/shim-array");
require("collections/listen/array-changes");

//Key: Twitch User ID ::: Value: Discord Name
const userIDMap = new Map();

var channel, 
	clientID,
	clientSecret,
	host,
	port,
	path;

var inited = false;

exports.run = function(config, msg) {
	var command = msg.content.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
	//we can assume command[0] is useless.
	if(command[1].toLowerCase() == "add"){
		var username = command[2];
		if(typeof username == "undefined"){
			msg.channel.send("Gotta include a name. !twitch add [twitchusername]");
			return;
		}
		var name = [];
		name.push(username);
		setUpSubscription(name, "subscribe", function(){
			msg.channel.send("Successfully paired "+username+"!");
		});

	}
	else if(command[1].toLowerCase() == "remove"){
		var username = command[2];
		var foundInMap = false;
		if(typeof username == "undefined"){
			msg.channel.send("Gotta include a name. !twitch add [twitchusername]");
			return;
		}
	  	userIDMap.forEach( function(value,key,userIDMap) {
	  		if(value.name == username){
	  			foundInMap = true;
	  		}
	  	});
	  	if(!foundInMap){
	  		msg.channel.send(username+" wasn't being watched.");
			return;
	  	}
		var name = [];
		name.push(username);
		setUpSubscription(name, "unsubscribe", function(){
			msg.channel.send("Successfully unpaired "+username+"!");
		});
	}
	else if(command[1].toLowerCase() == "list"){
		var values = [];
	  	userIDMap.forEach( function(value,key,userIDMap) {
	  		values.push(value.name);
	  	});
		if(values.length == 0){
			msg.channel.send("I'm not watching shit.");
			return;
		}
		msg.channel.send("I'm watching: \n"+values.join("\n"));
	}else{
		msg.channel.send("Sorry bro. I only accept \"add\", \"remove\" or \"list\"")
	}

}

exports.messageFired = function(config,msg) {
	//do nothing  
}

exports.init = function(seth, config){
	if(inited)return;
	inited = true;
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
		if(challenge){
			res.write(challenge);
			console.log("Successful subscription pairing")
		}
		res.end();
	  console.log("something hit me with a get :]");
	});
	app.post('/seth/twitch', function(req, res) {
		var url_parts = url.parse(req.url, true);
		var data = req.body.data;
		if(typeof data[0] == "undefined") {
			console.log("something just ended... we can ignore it.");
		}else{
			postNotification(data[0]);
		}
			
		console.log("something hit me with a post :]");
	  res.sendStatus(200);
	});
	app.listen(3001);
	console.log('Listening on port 3001...');

	updateAll();
	new CronJob('0 0 2 * * * ', function() {
		console.log("updating twitch");
		updateAll();
	}, null, true, 'America/New_York');
	
	// }
}

function updateAll(){
	userIDMap.clear();
	var subs = getSubs();
	var names = [];
	for(var i in subs){
		names.push(subs[i].name);
	}
	setUpSubscription(names, "subscribe");	

	// setUpSubscription(names, "unsubscribe", function(){
	// });
}

function setUpSubscription(names, subVal, pair){
	if(typeof names == "undefined" || names.length == 0 ) return;

	var options = {
		host: "api.twitch.tv",
		port: 443,
		path: '/kraken/users/?login='+names.join(",")+'&api_version=5',
		method: 'GET',
		headers: {
		    'Client-ID': clientID
		  }
	};

		https.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			var ret = JSON.parse(chunk);
			var users = ret.users;
			for(var i in users){
				var user = users[i];
				if(subVal == "subscribe"){
					userIDMap.set(user._id, user);
				}
				else if (subVal == "unsubscribe"){
					userIDMap.delete(user._id);
				}
				
				subscribe(subVal, user._id, pair);
			}
			if(typeof pair == "function") pair();
			save();
			console.log(chunk);

  		});
	}).end();


}

function postNotification(data){
	channel.send("!!! TWITCH NOTIFICATION: "+userIDMap.get(data.user_id).display_name+" has gone live. !!!");

}

function subscribe(subVal, userid, pair){
	var options = {
		host: "api.twitch.tv",
		port: 443,
		path: '/helix/webhooks/hub?hub.mode='+subVal+'&hub.topic=https://api.twitch.tv/helix/streams?user_id='+userid+'&hub.callback='+host+':'+port+path+'&hub.lease_seconds=172800',
		method: 'POST',
		headers: {
		    'Client-ID': clientID
		  }
	};

	https.request(options, function(response) {
		response.setEncoding('utf8');
		response.on('data', function (data) {
			console.log("Fired Subscription for "+userid);
  		});
	}).end();

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

//Saves the UserID Map.
function save() {
  var people = [];
  userIDMap.forEach( function(value,key,userIDMap) {
  	people.push(value);
  });
  var json = JSON.stringify(people);
  fs.writeFile('TwitchSubs.json', json, 'utf8', null);
}

function getSubs(){  
  //Tries to load a savedCountJson... if that doesn't exist, it will throw an error but thats fine.. it wont hurt.
  var file = fs.readFileSync('TwitchSubs.json', 'utf8');
  if(typeof file === "undefined") return [];
  return JSON.parse(file); //now it an object

}