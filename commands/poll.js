require("collections/shim-array");
require("collections/listen/array-changes");

//Regex to see everything inside quotes. Ignoring escaped quotes \"
const quoteExtractionRegex = /(["'])(\\?.)*?\1/gm;

//Set of emojis to use (A-> V). This excludes more than V because you only have 20 reactions on a message
const a_z = [{text:"🇦",id:"🇦"},
{text:"🇧",id:"🇧"},
{text:"🇨",id:"🇨"},
{text:"🇩",id:"🇩"},
{text:"🇪",id:"🇪"},
{text:"🇫",id:"🇫"},
{text:"🇬",id:"🇬"},
{text:"🇭",id:"🇭"},
{text:"🇮",id:"🇮"},
{text:"🇯",id:"🇯"},
{text:"🇰",id:"🇰"},
{text:"🇱",id:"🇱"},
{text:"🇲",id:"🇲"},
{text:"🇳",id:"🇳"},
{text:"🇴",id:"🇴"},
{text:"🇵",id:"🇵"},
{text:"🇶",id:"🇶"},
{text:"🇷",id:"🇷"},
{text:"🇸",id:"🇸"},
{text:"🇹",id:"🇹"},
{text:"🇺",id:"🇺"},
{text:"🇻",id:"🇻"}]

//Pull From Config
const DEFAULT_TIME = 120;
const DEFAULT_EMOJI_SET = a_z;

//Valid arguments 
const validArgs = ["pin","hidden", "multiple", "time=[0-9]+"]


exports.run = function(config, msg) {
	//First, get the content and get everything in the quotes.
	var content = msg.content;
	var quotes = content.match(quoteExtractionRegex);

	//Make sure we have enough quoted items. 
	//0 we dont have question or answers
	//1 we only have a question
	//2 we have a question with one answer (kinda weak)
	//3+ is good
	//more than 20 we have a problem because we can't have that many emojis. 
	if (quotes == null || typeof quotes == 'undefined' ||quotes.length == 0){
		msg.channel.send("nice poll no poll, no questions OR answers...");
		return;
	}
	if(quotes.length == 1){
		msg.channel.send("You only gave a question!");
		return;
	}
	if(quotes.length == 2){
		msg.channel.send("pretty weak poll... you need more answers...");
		return;
	}
	if(quotes.length >20){
		msg.channel.send("come on. COME ON. I can't keep track of that many things!");
		return;
	}

	//strip out the quotes from the actual content of the message. These leaves us with JUST arguments after. 
	//Push the quotes onto a new array getting rid of the first and last quote and changing escaped quotes to the real deal
	var strippedQuotes = [];
	quotes.forEach(function (quote){
		content = content.replace(quote, ''); // remove the quote from the sentence. 
		strippedQuotes.push(quote.substring(1,quote.length-1).replace("\\\"", "\"")); // remove the escaped quotes for the real thing. 

	});
	//From here we should just be left with arguments. Strip that whitespace and start looking at them.
	content = content.trim();
	var args = content.match(/\S+/g);
	if(args==null) args = [];
	//Lowercase it because sometimes users are dumb. 
	for(var i in args){
		args[i]=args[i].toLowerCase();
	}

	//Now we are going to look at these args (if we have any) We have 2 goals:
	//1. Remove the duplicates
	//2. Bail out if we see an arg that we don't recognize. it might be a screwed up quote?
	if(args.length!=0){
		//remove duplicates from the array
		args = args.filter(function(item, pos, self) {
		    return self.indexOf(item) == pos;
		})

		//filter out all the "good" ones, leaving us with only bad args.
		invalidArgs = args.filter(arg => { 
			for(var i in validArgs){
				if(arg.match(validArgs[i])){
					return false;
				}
			}
			return true;
		})

		//if we have a bad arg, we are done here. Go home.
		if(invalidArgs.length != 0){
			msg.channel.send("Sorry broski, I dont know what these mean: "+invalidArgs);
			return;
		}
	}

	//If we have a time arg, parse it and get the time. It matched a regex for a number so i'm not worried about it being a string on the right side
	//of the '='
	var time = DEFAULT_TIME;
	for (var i in args){
		var value = args[i];
		if(value.match("time=[0-9]+")){
			time = value.split("=")[1];
			break;
		}
	}

	//If its of a week, get out of here. Noone should have polls that long. This time was completely arbituary. 
	if(time > 10080){
		msg.channel.send("That's just too long. I dont want to think about something for that long :(");
		return;
	}


	var emojiSet = DEFAULT_EMOJI_SET;

	//Build the poll object. This object will self manage itself with timers and internal functions.
	var newPoll = buildPollObject(strippedQuotes[0],time);
	//Take the args and add them to the poll object
	newPoll.hidden = args.includes("hidden");
	newPoll.multiple = args.includes("multiple");
	newPoll.pin = args.includes('pin');
	//For every other quote, 1...n, make "answer" objects. 
	for(var i=1; i<=strippedQuotes.length-1; i++){
		newPoll.answers.set(emojiSet[i-1].id,buildAnswerObject(strippedQuotes[i],emojiSet[i-1]));
	}

	//now that we have the poll, have seth write out a message, activate the self managing poll and be on our way.
	msg.channel.send(newPoll.displayText()).then(message => {
		newPoll.message = message;
		newPoll.activate();
	});

}

function buildPollObject(poll, time){
	//Make an object with default values.
	var newPoll = {};
	newPoll.question = poll;
	newPoll.endDate = new Date(new Date().getTime() + (time*60000));
	newPoll.answers = new Map();
	newPoll.multiple = false;
	newPoll.hidden = false;
	newPoll.pin = false;

	//This will handle getting the morphing poll message in its entirety.
	newPoll.displayText = function(){
		var totalVotes = 0
		this.answers.forEach(function(answer){
			totalVotes+=answer.voters.size;
		});
		var output = "**"+this.question+"** ::: "+this.remainingTimeText()+" ::: "+"Total: "+totalVotes+"\n";
		var that = this;
		this.answers.forEach(function(answer){
			output += answer.displayText(that.hidden,totalVotes)+"\n";
		});
		return output;
	}
	//Helper method to get exactly how long we have left in the poll. Returns Date Object.
	newPoll.remainingTime = function(){
		return this.endDate - new Date();
	}
	//Helper method that formats the endtime in a readable format.
	newPoll.remainingTimeText = function(){
		var delta = this.endDate - new Date();
		if(delta<=0){
			return "poll closed";
		}
		delta = delta/1000;
		//First check hours
		var hours = Math.floor(delta / 3600) % 24;
		//if(hours!=0) return hours+" hours remaining";
		//Then check mins.
		var minutes = Math.floor(delta / 60) % 60;
		//if(minutes!=0) return minutes+" minutes remaining";
		//Then check seconds
		if(hours!=0 || minutes!=0){
			return n(hours)+":"+n(minutes);
		}
		var seconds = Math.floor(delta % 60);
		return seconds+" seconds remaining";      

	}
	//The guts of the poll. 
	newPoll.activate = function(){
		//first, we want to keep track of the poll object.
		var that = this;
		//If its a pinned message, handle that first.
		if(this.pin){
			this.message.pin();
		}
		//Now we have to listen to every single reaction that comes in. I'm filtering to make sure whoever gives a reaction isn't a bot. 
		this.collector = this.message.createReactionCollector((reaction, user) => !user.bot);
		//On each new reaction that comes in, update the poll object
		this.collector.on('collect', r => {
			r.fetchUsers().then( collection => {
				updatePoll(that,r,collection.values());
			});
		});
		//We need the inital reactions. This will make seth "react" to the message it just had with EACH of the emojis we are going to need.
		//Its async because discord can be dumb and there was a race condition, so i'm pacing the calls to discord per second so they align in an hour A -> B -> C etc. 
		var asyncCount=0;
		this.answers.forEach( function (answer){
			reactAsync(that.message,answer,asyncCount);
			asyncCount=asyncCount+1000;		
		})
		//This timer checks and updates the message every 5 seconds to update the clock and the voters. After time expires, it calls "deactivate" to tear down the message.
		this.timer = setInterval(function(){
			if(that.remainingTime() <0){
				that.deactivate();
			}
			that.refresh();
		},5000);
	}
	//Called after a poll
	newPoll.deactivate = function(){
		//Stop checking if the poll is over every 5 seconds, clear out all reactions, and stop listening for reactions.
		clearInterval(this.timer);
		this.message.clearReactions();
		this.collector.stop();
	}
	//Helper Method to actually edit the poll message.
	newPoll.refresh = function(){
		this.message.edit(this.displayText());
	}
	//This takes a user id and makes sure that the voter is only in ONE answer (unless "multiple" is an arg)
	newPoll.removeFromOtherAnswers = function(id){
		if(!this.multiple){
			for(let answer of this.answers.values()){
				answer.voters.delete(id);
			}
		}
	}
	return newPoll;
}

function buildAnswerObject(answer,key){
	//builds the base object.
	var newAnswer = {};
	newAnswer.text = answer;
	newAnswer.key = key;
	//Writes out each answer, called by the poll. (each poll is in charge of writing itself out.)
	newAnswer.displayText = function(hidden,totalVotes){
		var votes = Math.floor(this.voters.size/totalVotes*100);
		votes = (isNaN(votes)) ? 0 : votes;
		var displayText = this.key.text + ": " +this.text+" -> "+votes+"%";
		if(this.voters.size!=0){
			displayText = displayText+"\n";
			if(!hidden){
				for(let user of this.voters.values()){
					displayText = displayText+" <@"+user.id+"> ";
				}
			}
			else{
				displayText = displayText+"Votes: "+this.voters.size;
			}
		}
		return displayText;
	}		
	newAnswer.voters = new Map();
	return newAnswer;
}

//In charge of getting a new reaction and updating the Poll and Answer objects accordingly.
function updatePoll(poll,reaction,users){
	//First make this easier to work with. Push out any reactions with bots. (since there always be one)
	var santizedUsers = [];
	for(let user of users){
		if(user.bot) continue;
		santizedUsers.push(user);
	}
	//if there are no users, throw up your hands and give up.
	if(santizedUsers.length == 0) return;
	santizedUsers.forEach(function(user){
		//first remove the reaction
		reaction.remove(user);
		//get the emoji id and make sure it relates the poll.
		var id = (reaction._emoji.id!=null) ? reaction._emoji.id : reaction._emoji.name;
		var answer = poll.answers.get(id);
		//if it doesnt, get out of here. 
		if(answer==null || typeof answer == 'undefined') return;
		if(answer.voters.has(user.id)){
			answer.voters.delete(user.id);
		}
		else{
			poll.removeFromOtherAnswers(user.id);
			answer.voters.set(user.id,user);
		}
		poll.refresh();
	})
}


//Helper method for waiting around to react asynchronously 
async function reactAsync(message, answer, after){
	await wait(after);
	message.react(answer.key.id);	
}
function wait(after){
	return new Promise(resolve =>{
		setTimeout(() => {
			resolve();
		},after)
	})
}

//a little helper to make sure the time always has 2 digits. 
function n(n){
    return n > 9 ? "" + n: "0" + n;
}

exports.messageFired = function(config,msg) {
	//do nothing  
}