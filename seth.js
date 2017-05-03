const Discord = require("discord.js");
const fs = require("fs");
const config = require("./config.json");
const developerMode = false;
const seth = new Discord.Client();
const User = require("./GJUser.js");

const map = new Map();

//TODO read in the JSON file.

//fs.readFile('myjsonfile.json', 'utf8', function readFileCallback(err, data){
//    if (err){
//        console.log(err);
//    } else {
//    obj = JSON.parse(data); //now it an object
//    obj.table.push({id: 2, square:3}); //add some data
//    json = JSON.stringify(obj); //convert it back to json
//    fs.writeFile('myjsonfile.json', json, 'utf8', null); // write it back 
//}});


seth.on("message", msg => {

	var input = msg.content;
	if(msg.channel.name == "sethbotdeveloper" && !msg.author.bot )
	{
		const collector = msg.createReactionCollector(
		 (reaction, user) => true,
		 { time: 10000 }//10 seconds for collection time before it dies.
		);
		collector.on('collect', r => 
			{
				msg.channel.sendMessage(`Collected ${r.emoji.name}`);
			});
		collector.on('end', collected => 
			{
				msg.channel.sendMessage(`Collected ${collected.size} items`);
				if(collected.size >1)
				{
					r = collected.first();
					var user = map.get(r.message.author.id);
					if(user == undefined)
					{
						console.log('user undefined');
						user = new User(r.message.author.id, r.message.author.name);
						map.set(r.message.author.id, user);
					}
					user.setCount(collected.size);
					save();

				}
			});
		//msg.channel.sendMessage("Straight fuckin' gnar");

		//msg.reply("I'm replying");
	}

	/*
	var mention = "TBZ";
	if(input.includes(mention)) {
		console.log("What up "+mention);
	}

	if(!msg.content.startsWith(config.prefix)) {
		return;
	}

	if(msg.isMentioned(seth.user)) {
		msg.channel.sendMessage("YEAH DUDE YEAH DUDE!");
	}

	if(msg.content.startsWith(config.prefix)) {
		msg.channel.sendMessage("Straight fuckin' gnar");
	}
	*/
});

seth.on("ready", () => {
	console.log("Hur dur, my name's Seth!");
});

//do something when app is closing
process.on('exit',	end => console.log("later bro"));

//catches ctrl+c event
process.on('SIGINT', die =>{ console.log("peace");process.exit();});

seth.login(config.token);

function save()
{
var obj = {
   savedEmojis: []
};
map.forEach( function(value,key,map) { 
obj.savedEmojis.push(value);
});
var json = JSON.stringify(obj);
fs.writeFile('savedCount.json', json, 'utf8', null);
}