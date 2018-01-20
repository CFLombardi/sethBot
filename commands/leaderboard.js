const User = require("../GJUser.js");
const fs = require("fs");
require("collections/shim-array");
require("collections/listen/array-changes");

//Key: Discord User ID ::: Value: Discord
const karmaMap = new Map();

function updateKarmaMap(){
	//Tries to load a savedCountJson... if that doesn't exist, it will throw an error but thats fine.. it wont hurt.
	var file = fs.readFileSync('savedCount.json', 'utf8');
	var obj = JSON.parse(file); //now it an object
	for(var i in obj.dosh)
	{
		var id = obj.dosh[i].id;
		var name = obj.dosh[i].name;
		var totalCount = obj.dosh[i].totalCount;
		var user = new User(id,name);
		user.setCount(totalCount);
		karmaMap.set(id, user);
	}
    
}

exports.run = function(config, msg) {
	updateKarmaMap();
	var leaderboard = [];
	var maxSize = 10;
	karmaMap.forEach(function(value, key, dosh) {
		for (i = 0; i < karmaMap.size; i++) {  
			if(typeof leaderboard[i] === "undefined"){
				leaderboard.splice(i, 0, value );
				break;
			}
			if(value.totalCount > leaderboard[i].totalCount){
				leaderboard.splice(i, 0, value );
				break;
			}
			if(i+1 == karmaMap.size){
				leaderboard.push(value);
			}
				
		}
	});
	var showAbleBoard = leaderboard.slice(0,maxSize);
	var outputString = "\n";
	for (i = 0; i < showAbleBoard.length; i++) {  
		outputString += i+1+". "+showAbleBoard[i].name + " has "+showAbleBoard[i].totalCount+" dosh!\n";
	}
	msg.channel.send(outputString);

}

exports.messageFired = function(config,msg) {
	//do nothing  
}