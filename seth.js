const Discord = require("discord.js");
const seth = new Discord.Client();
const config = require("./config.json");


seth.on("message", msg => {
	var input = msg.content;
	var mention = "TBZ";
	if(input.includes(mention)) {
		console.log("What up "+mention);
	}

	if(!msg.content.startsWith(config.prefix)) {
		return;
	}

	if(msg.isMentioned(CFLombardi)) {
		msg.channel.sendMessage("YEAH DUDE YEAH DUDE!");
	}

	if(msg.content.startsWith(config.prefix)) {
		msg.channel.sendMessage("Straight fuckin' gnar");
	}
});

seth.on("ready", () => {
	console.log("Hur dur, my name's Seth!");
});

seth.login(config.token);
