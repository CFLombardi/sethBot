require("collections/shim-array");
require("collections/listen/array-changes");

const quoteExtractionRegex = /(["'])(\\?.)*?\1/gm;

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
const DEFAULT_TIME = 5;


exports.run = function(config, msg) {
	var content = msg.content;
	var quotes = content.match(quoteExtractionRegex);

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

	var strippedQuotes = [];
	quotes.forEach(function (quote){
		content = content.replace(quote, ''); // remove the quote from the sentence. 
		strippedQuotes.push(quote.substring(1,quote.length-1).replace("\\\"", "\"")); // remove the escaped quotes for the real thing. 

	});
	content = content.trim();

	//Build the poll object. 
	var newPoll = buildPollObject(strippedQuotes[0],DEFAULT_TIME);
	for(var i=1; i<=strippedQuotes.length-1; i++){
		newPoll.answers.set(a_z[i-1].id,buildAnswerObject(strippedQuotes[i],a_z[i-1]));
	}

	msg.channel.send(newPoll.displayText()).then(message => {
		newPoll.message = message;
		newPoll.activate();
	});


	// msg.channel.send(":regional_indicator_a:")
	// .then(message => {
	// 	console.log(message.reactions);
	// 	var collector = message.createReactionCollector(
	//     (reaction, user) => true, { time: 10000 }//10 seconds for collection time before it dies.

	//     );
	//     message.react('🇿');
	// 	collector.on('collect', r =>
	// 	{
	// 		console.log(r.emoji);
	// 	});  
	// })

}

function buildPollObject(poll, time){
	var newPoll = {};
	newPoll.question = poll;
	newPoll.endDate = new Date(new Date().getTime() + (time*60000));
	newPoll.answers = new Map();
	newPoll.displayText = function(){
		var output = this.question+" ::: "+this.remainingTimeText()+"\n";
		this.answers.forEach(function(answer){
			output += answer.displayText()+"\n";
		});
		return output;
	}
	newPoll.remainingTime = function(){
		return this.endDate - new Date();
	}
	newPoll.remainingTimeText = function(){
		var delta = this.endDate - new Date();
		if(delta<=0){
			return "poll closed";
		}
		delta = delta/1000;
		//First check hours
		var hours = Math.floor(delta / 3600) % 24;
		if(hours!=0) return hours+"hours remaining";
		//Then check mins.
		var minutes = Math.floor(delta / 60) % 60;
		if(minutes!=0) return minutes+" minutes remaining";
		//Then check seconds
		var seconds = Math.floor(delta % 60);
		return seconds+" seconds remaining";      

	}
	newPoll.activate = function(){
		var that = this;
		this.collector = this.message.createReactionCollector((reaction, user) => !user.bot);
		this.collector.on('collect', r => {
			console.log(r._emoji);
		});
		var asyncCount=0;
		this.answers.forEach( function (answer){
			reactAsync(that.message,answer,asyncCount);
			asyncCount=asyncCount+1000;		
		})
		this.timer = setInterval(function(){
			if(that.remainingTime() <0){
				that.deactivate();
			}
			that.message.edit(that.displayText());
		},5000);
	}
	newPoll.deactivate = function(){
		clearInterval(this.timer);
		this.collector.stop();
	}
	return newPoll;
}

function buildAnswerObject(answer,key){
	var newAnswer = {};
	newAnswer.text = answer;
	newAnswer.key = key;
	newAnswer.displayText = function(){
		return this.key.text + ": " +this.text;
	}		
	return newAnswer;
}

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



exports.messageFired = function(config,msg) {
	//do nothing  
}