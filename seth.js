const Discord = require("discord.js");

const config = require("./config.json");
const User = require("./GJUser.js");
const seth = new Discord.Client();
require('events').EventEmitter.prototype._maxListeners = 0;
const {commands} = require("./commands");

//THIS IS IMPORTANT FOR UNCAUGHT EXCEPTIONS. DO NOT REMOVE
var myEmitter = new (require('events').EventEmitter)();
// add this handler before emitting any events
process.on('uncaughtException', function (err) {
    console.log('UNCAUGHT EXCEPTION - keeping process alive:', err); // err.message is "foobar"
});


//This controls whether only the seth channel is listened to or all channels.
//true	: Only seth channel.
//false : All channels
const developerMode = config.developerMode;
var token;
if(developerMode){
	console.log("DEVELOPER MODE ONLINE");
	token = config.devToken;
}
else{
	console.log("PRODUCTION MODE ONLINE");
	token = config.token;
}

seth.on("message", msg => {
	if((msg.channel.name == "sethbotdeveloper" || !developerMode) && !msg.author.bot)
	{
		for (var property in commands){
			if (commands.hasOwnProperty(property)) {
				if(msg.content.toLowerCase().startsWith(config.prefix+property))
				{
					var input = msg.content.split(config.prefix+property);
					msg.content = input[1].trim();
			    	commands[property].run(config, msg);
				}
			}
			commands[property].messageFired(config,msg);
		}

  }
});

seth.on("ready", () => {
	console.log("Hur dur, my name's Seth!");
	for (var property in commands){
	if(typeof commands[property].init === "function"){
		commands[property].init(seth, config);
	}

}

});

//do something when app is closing
process.on('exit',	end => console.log("later bro"));

//catches ctrl+c event
process.on('SIGINT', die =>{ console.log("peace");process.exit();});

seth.login(token);
