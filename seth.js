const Discord = require("discord.js");
require("collections/shim-array");
require("collections/listen/array-changes");
const fs = require("fs");
const config = require("./config.json");
const User = require("./GJUser.js");
const seth = new Discord.Client();
require('events').EventEmitter.prototype._maxListeners = 0;
const {commands} = require("./commands");

//This controls whether only the seth channel is listened to or all channels.
//true	: Only seth channel.
//false : All channels
const developerMode = true;

//Key: Discord User ID ::: Value: Discord
const karmaMap = new Map();

//Tries to load a savedCountJson... if that doesn't exist, it will throw an error but thats fine.. it wont hurt.
fs.readFile('savedCount.json', 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
    obj = JSON.parse(data); //now it an object
    for(var i in obj.dosh)
    {
    	var id = obj.dosh[i].id;
    	var name = obj.dosh[i].name;
    	var totalCount = obj.dosh[i].totalCount;
    	var user = new User(id,name);
    	user.setCount(totalCount);
		  karmaMap.set(id, user);
    }


}});

//Key: messageid ::: Value: collection<integer> (Discord UserIDs of members who reacted to a message )
const usersWhoReacted = new Map();

//Key: messageid ::: Value: Discord UserID of the user who sent a particular message.
const messageToUser = new Map();


seth.on("message", msg => {

	var input = msg.content;
	if((msg.channel.name == "sethbotdeveloper" || !developerMode) && !msg.author.bot )
	{
		if(msg.content.toLowerCase().startsWith("!dosh"))
		{
      var needsUpdate = commands.dosh.run(msg, karmaMap, seth);
      if(needsUpdate === true) {
        save();
      }

			var mentions = msg.mentions.users;
			var outStr = "";
			if(mentions.size ==0 && needsUpdate === false)
			{
				msg.channel.send("Are you on the green bro? Gotta mention someone\nLike \"!dosh @someone\"");
			}
			mentions.forEach( function(value,key,mentions) {
				var user = karmaMap.get(key);
        var outStrUser = (user.getNickName()) ? user.getNickName() : user.name;
				if(user != undefined)
				{
					outStr += outStrUser + " has "+user.getCount()+ " dosh, Brah!\n";
				}
				else
				{
					outStr += value.username + " has no dosh.\n";
				}


			});
			if(outStr!="")
				msg.channel.send(outStr);
		}
		const collector = msg.createReactionCollector(
		 (reaction, user) => (reaction.emoji.id==config.downEmoji || reaction.emoji.id==config.upEmoji) && !user.bot,
		 { time: 43200000 }//12 hours for collection time before it dies.
     //{ time: 10000 }//10 seconds for collection time before it dies.

		);
		trackCollector(msg, collector);
	}
});

seth.on("ready", () => {
	console.log("Hur dur, my name's Seth!");
});

//do something when app is closing
process.on('exit',	end => console.log("later bro"));

//catches ctrl+c event
process.on('SIGINT', die =>{ console.log("peace");process.exit();});

seth.login(config.devToken);

//Saves the Karma Map.
function save() {
  var obj = {
     dosh: []
  };
  karmaMap.forEach( function(value,key,karmaMap) {
  obj.dosh.push(value);
  });
  var json = JSON.stringify(obj);
  fs.writeFile('savedCount.json', json, 'utf8', null);
}

//Takes in a collector and a message and sets up the tracker.
function trackCollector(msg, collector)
{
	collector.on('collect', r =>
	{
		if(r.emoji.id == config.upEmoji)
		{
			handleUp(r);
		}
		if(r.emoji.id == config.downEmoji)
		{
			handleDown(r);
		}
	});

	collector.on('end', collected =>
	{
		collected.forEach(function(value,key,collected)
		{
			messageToUser.delete(value.message.id);
			usersWhoReacted.delete(value.message.id);
		});

	});
}

//Handle when Dosh goes up
function handleUp(reaction)
{
	updateDosh(reaction,true);
}
//Handle when goes down.
function handleDown(reaction)
{
	updateDosh(reaction,false);
}

//General function to handle the physical raising and lowering of dosh.
function updateDosh(reaction,addDosh)
{
	var messageUsers = reaction.users;
	var msg = reaction.message;
	var authorID = msg.author.id;
	var authorName = msg.author.username;

	//If this is the first time we are seeing a message, add it to the maps that keep track of this stuff.
	if(!messageToUser.has(msg.id))
	{
		messageToUser.set(msg.id,authorID);
		usersWhoReacted.set(msg.id,new Array());
	}

	//For each user who ever commented, go through and make sure they have the appropriate +1 or -1
	messageUsers.forEach(function(value,key,messageUsers)
	{
		//If the user is one of these users who up/downvoted themselves, yell at them please.
		if(key == authorID)
		{
			msg.reply("Bruh, voting your own post? Get out. I SAID GET THAT SHIT OUT");
			console.log("Someone is trying to upvote their own post... jerks.");
			reaction.remove(msg.author);
			return;
		}

		//If the user already has a vote for or against, then clear it.
		var reactedUsers = usersWhoReacted.get(msg.id);
		if(reactedUsers.has(key))
		{
			console.log("this person already has a vote.. no can do");
		}
		else
		{
			reactedUsers.push(key);
			var user = karmaMap.get(authorID);
			if(user == undefined)
			{
				console.log("User Undefined... adding to list of known users");
				user = new User(authorID, authorName);
				karmaMap.set(authorID, user);
			}
			if(addDosh)
			{
				user.addDosh();
			}
			else
			{
				user.removeDosh();
			}
		}
		//Save the JSON.
		save();
	});
}
