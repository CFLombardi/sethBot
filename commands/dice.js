var Roll = require('roll');

exports.run = function(config, msg) {
  var roll = new Roll();
  var valid = roll.validate(msg.content);

  if(valid) {
    userRoll = roll.roll(msg.content);
  } else {
    msg.channel.send("That dice command is not in the proper format.");
    return;
  }
  
  msg.channel.send("Here are the dice you rolled: ["+userRoll.rolled+"]\nAnd here is the sum of those rolls: "+userRoll.result);
}

exports.messageFired = function(config,msg) {
	//do nothing
}
