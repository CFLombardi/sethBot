const quoteExtractionRegex = /(["'])(\\?.)*?\1/gm;

const a_z = "regional_indicator_"


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

	var strippedQuotes = [];
	quotes.forEach(function (quote){
		content = content.replace(quote, '');
		strippedQuotes.push(quote.substring(1,quote.length-1).replace("\\\"", ""));

	});
	console.log(strippedQuotes);
	content = content.trim();
	msg.channel.send(":regional_indicator_a:")
	.then(message => {
		console.log(message.reactions);
		var collector = message.createReactionCollector(
	    (reaction, user) => true, { time: 10000 }//10 seconds for collection time before it dies.

	    );
	    message.react('🇿');
		collector.on('collect', r =>
		{
			console.log(r.emoji);
		});  
	})

}



exports.messageFired = function(config,msg) {
	//do nothing  
}