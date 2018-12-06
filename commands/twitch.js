const http = require('http');
const https = require('https');
const fs = require("fs");
const bodyParser = require('body-parser');
var CronJob = require('cron').CronJob;
var url = require('url');
var express = require('express');
require("collections/shim-array");
require("collections/listen/array-changes");

//Key: Twitch User ID ::: Value: Discord Name
// This map contains all the users that have been successfully validated to have a twitch id and are currently being 
// subscribed to to post messages about.
const userIDMap = new Map();

/*
	channels = an array that holds all the discord channels we are sending notifications to.
	seenIDs = an array that holds all the Twitch Message IDs we recieve since sometimes they send duplicates.
	permission = an array of roles a user could have that will allow the user to run "admin" commands.

	clientID, clientSecret = these is used to tell Twitch, "Hey. I'm a bot and this is the application using this information." These credentials can be obtained at: https://dev.twitch.tv/
	host/port/path = where we tell twitch to send its notifications to.
*/
var channels, 
	seenIDs = [],
	permission,
	clientID,
	clientSecret,
	host,
	port,
	path;

//Tells if we have been inited.
//Because at this time both "!live" and "!discord" are bound to this file. I only want "init" to be run once since it will be called twice.
var inited = false;

//This is the discord bot. Its needed to lookup channels from ids.
var seth;

//Runs everytime a message is recieved.
exports.run = function(config, msg) {
	//cuts messages on whitepace.
	var command = msg.content.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
	//we can assume command[0] is useless, command[0] has the command and command [2] has information about a command..
	//COMMAND TO ADD USERS
	if(command[0].toLowerCase() == "add"){
		if(!checkPermission(msg)){
			return;
		}
		//Get the username, if its not defined, tell the user that.
		var username = command[1];
		if(typeof username == "undefined"){
			msg.channel.send("Gotta include a name. !twitch add [twitchusername]");
			return;
		}
		//Create an array and all a subscription. If its successful, tell the user.
		var name = [];
		name.push(username);
		setUpSubscription(name, "subscribe", function(){
			msg.channel.send("Successfully paired "+username+"!");
		});
	}
	//COMMAND TO REMOVE USERS
	else if(command[0].toLowerCase() == "remove"){
		if(!checkPermission(msg)){
			return;
		}
		//Get the username, if its undefined, tell the user.
		var username = command[1];
		var foundInMap = false;
		if(typeof username == "undefined"){
			msg.channel.send("Gotta include a name. !twitch add [twitchusername]");
			return;
		}
		//If we already know the user isn't in the map, we can ignore the request and yell at the user for being a moron.
	  	userIDMap.forEach( function(value,key,userIDMap) {
	  		if(value.name == username){
	  			foundInMap = true;
	  		}
	  	});
	  	if(!foundInMap){
	  		msg.channel.send(username+" wasn't being watched.");
			return;
	  	}
	  	//Try an send an unsubscribe, if its successful. notify the user.
		var name = [];
		name.push(username);
		setUpSubscription(name, "unsubscribe", function(){
			msg.channel.send("Successfully unpaired "+username+"!");
		});
	}
	//COMMAND TO REMOVE USERS
	else if(command[0].toLowerCase() == "list"){
		//anyone can run this command. All we need to go is go through the user map and pull out the names. if there are no users, tell them that.
		var values = [];
	  	userIDMap.forEach( function(value,key,userIDMap) {
	  		values.push(value.name);
	  	});
		if(values.length == 0){
			msg.channel.send("I'm not watching shit.");
			return;
		}
		msg.channel.send("I'm watching: \n"+values.join("\n"));
	}
	//COMMAND TO SEND NOTIFICATIONS TO A DISCORD CHANNEL.
	else if(command[0].toLowerCase() == "listen"){
		if(!checkPermission(msg)){
			return;
		}
		//Look at the channels array, if it doesn't include the channel id that we are looking at... add it.
		var id = msg.channel.id;
		if(!channels.includes(id)){
			channels.push(id);
			saveChannels();
			msg.channel.send("ALL SHALL HEAR ME.");
			return;
		}
		msg.channel.send("I'M SCREAMING ALREADY");

	}
	//COMMAND TO STOP SENDING NOTIFICATIONS TO A DISCORD CHANNEL.
	else if(command[0].toLowerCase() == "unlisten"){
		if(!checkPermission(msg)){
			return;
		}
		//Look at the channels array and remove the channel id if we find it.
		var id = msg.channel.id;
		var index = channels.indexOf(id);
		if(typeof index != 'undefined' && index > -1){
			channels.splice(index, 1);
			saveChannels();
			msg.channel.send("Fine. I'll just shut up.");
			return;
		}
		msg.channel.send("I'm already not talking.");
		
	}else {
		msg.channel.send("Sorry bro. I only accept \"add\", \"remove\" or \"list\"")
	}

}

//This is fired anytime a message is sent whether it says !Command or not. For twitch, we don't care.
exports.messageFired = function(config,msg) {
	//do nothing  
}

//This is fired at the start up and always run.
exports.init = function(bot, config){
	//Because at this time both "!live" and "!discord" are bound to this file. I only want "init" to be run once since it will be called twice.
	if(inited)return;
	inited = true;

	//jsons are stored in the twitch directory, This ensures that the directory is made
	var dir = './twitch';
	if (!fs.existsSync(dir)){
	    fs.mkdirSync(dir);
	}
	//This saves the bot for later use while looking up channels.
	seth = bot;
	//This pulls in all the discord channel ids of where to post the notifications.
	channels = readChannels();
	//get the Client ID and Client Secret 
	clientID = config.twitch.twitch_client_id;
	clientSecret = config.twitch.twitch_client_secret;
	//get the host, port, and path of where the POST/GET from twitch should be sent 
	host = config.twitch.twitch_callback_host;
	port = config.twitch.twitch_callback_port;
	path = config.twitch.twitch_callback_path;
	//This pulls in all the permission groups from the config that should have access to the "admin" commands.
	permission = config.twitch.permission_groups;

	//This is where we listen for GET and POST calls from Twitch.
	//It opens up the same path for GET and POST.
	//The way webhooks work, the POST endpoint is used anytime twitch wants to notify us. 
	//The GET endpoint is used when we "subscribe" to a user. It expects us to return a challenge hash to tell twitch "This is a real address and i'm willing to accept GET/POSTS"
	console.log("Twitch Webhook callback initializing...");
	var app = express();
	app.use(bodyParser.json());
	app.get(path, function(req, res) { 
		//Parse the GET request, if it contains "hub.challenge" return that so Twitch will send us messages. Otherwise just give it a 200 (OK) response code.
		var url_parts = url.parse(req.url, true);
		var challenge = url_parts.query['hub.challenge'];
		res.writeHead(200);
		if(challenge){
			res.write(challenge);
			console.log("Successful subscription pairing")
		}
		res.end();
	});

	app.post(path, function(req, res) {
		//Parse the POST request, we know its going to have JSON in the body.
		//If that JSON has a "data" element, we send the messages to the discord channels.
		//Twitch might accidently send multiple of the same request. for that reason, there is a safe guard in place to only show one notification to the users. (Array seenIDs)
		var url_parts = url.parse(req.url, true);
		var data = req.body.data;
		if(typeof data[0] == "undefined") {
			console.log("something just ended... we can ignore it.");
		}else{
			console.log("posted "+data[0]);
			if(!seenIDs.includes(data[0].id)){
				postNotification(data[0]);
				seenIDs.push(data[0].id);	
			}
		}
			
	  res.sendStatus(200);
	});
	//Turn on the GET and POST calls.
	app.listen(port);
	console.log('Listening on port '+port+'...');

	//For all the existing twitch ids we know (which are stored in TwitchSubs.json) re-up their subscriptions
	updateAll();

	//This is a cron job. 
	//This cron job says at 2:00am EST every single day to re-up subscriptions. This is important because subscriptions are disabled every 10 days so we need to keep them fresh.
	new CronJob('0 0 2 * * * ', function() {
		console.log("updating twitch");
		updateAll();
	}, null, true, 'America/New_York');
	
}

//This clears all the users we know about, gets all the subscriptions from twitch/TwitchSubs.json and then sets up new subscriptions for all of them.
function updateAll(){
	userIDMap.clear();
	seenIDs = [];
	var subs = getSubs();
	var names = [];
	for(var i in subs){
		names.push(subs[i].name);
	}
	setUpSubscription(names, "subscribe");	

}

function setUpSubscription(names, subVal, pair){
	//If there are no names to make subscriptions for, end it right here.
	if(typeof names == "undefined" || names.length == 0 ) return;

	//So we have a bunch of names, we need to translate those names into twitch ids. this first call does that.
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
			//ret now contains all of the users that successfully have twitch ids. if a names was given to us that is invalid, we dropped it on the floor.
			var users = ret.users;
			for(var i in users){
				var user = users[i];
				//if we are subscribing, add the user information to the userIDMap
				//if we are unsubscribing a user, remove that infomation.
				if(subVal == "subscribe"){
					userIDMap.set(user._id, user);
				}
				else if (subVal == "unsubscribe"){
					userIDMap.delete(user._id);
				}
				//Send the subscription webhook request
				subscribe(subVal, user._id, pair);
			}
			//At this point, let people know we found a twitch id and we successfully were able to send a subscription hook.
			if(typeof pair == "function") pair();
			//write the userIDMap to disk with all the users we had success with.
			save();

  		});
	}).end();


}

function postNotification(data){
	//for each channel that was subscribed to, send a notification about an up stream.
	for(var i in channels){
		seth.channels.get(channels[i]).send("!!! TWITCH NOTIFICATION: "+userIDMap.get(data.user_id).display_name+" has gone live. ===> https://www.twitch.tv/"+userIDMap.get(data.user_id).name+" !!!");	
	}

}

function subscribe(subVal, userid, pair){
	//Using the twitch API, send the webhook request. 
	//This will be picked up in the GET request we saw in the "init" method after twitch messages us back.
	var options = {
		host: "api.twitch.tv",
		port: 443,
		path: '/helix/webhooks/hub?hub.mode='+subVal+'&hub.topic=https://api.twitch.tv/helix/streams?user_id='+userid+'&hub.callback='+host+':'+port+path+'&hub.lease_seconds=172800&api_version=5',
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
  fs.writeFile('twitch/TwitchSubs.json', json, 'utf8', null);
}

//Saves the active channels to write to , to disk.
function saveChannels(){
  var json = JSON.stringify(channels);
  fs.writeFile('twitch/channels.json', json, 'utf8', null);
}

//Gets all of the Twitch Subs saved to disk.
function getSubs(){  
  //Tries to load a savedCountJson... if that doesn't exist, it will throw an error but thats fine.. it wont hurt.
  try{ 
  	var file = fs.readFileSync('twitch/TwitchSubs.json', 'utf8');
	}
	catch (err){
		console.log("WARNING: could not find TwitchSubs.json... you can ignore this");
		return [];
	}
  if(typeof file === "undefined") return [];
  return JSON.parse(file); //now it an object

}

//Reads all the channels saved to disk.
function readChannels(){
   //Tries to load a savedCountJson... if that doesn't exist, it will throw an error but thats fine.. it wont hurt.
   try{
  		var file = fs.readFileSync('twitch/channels.json', 'utf8');
  	}
	catch (err){
		console.log("WARNING: could not find channels.json... you can ignore this");
		return [];
	}
  if(typeof file === "undefined") return [];
  return JSON.parse(file); //now it an object
}

//This makes sure a user has the roles specified in the config to run the admin based commands.
function checkPermission(msg){
	if(typeof permission === "undefined" || (typeof permission !== "undefined" && permission.length<1)) return;
	var hasRole = false;
	for(var i in permission){
		if(msg.member.roles.has(permission[i])){
			hasRole = true;
		}
	}
	if(!hasRole){
		msg.channel.send("You do not have permission to use this command");
	}
	return hasRole;
}