var Roll = require('roll');

exports.run = function(config, msg) {
  var roll = new Roll();
  var valid = roll.validate(msg.content);
  var input = msg.content;
  if(valid) {
    var dicebag = input.split("+");
    for(var i = 0; i < dicebag.length; i++) {
      console.log(dicebag[i]);
      var isDie = isNaN(dicebag[i]);
      if(isDie) {
        //check for modifiers to be added to the die
        for(var j = i+1; j < dicebag.length; j++) {
          console.log(dicebag[j]);
          if(!isNaN(dicebag[j])) {
            dicebag[i] = dicebag[i]+"+"+dicebag[j];
          } else {
            break;
          }
        }
        //all the stats have been assembled, time to cast the die
        var userRoll = roll.roll(dicebag[i]);
        var diceRolled = userRoll.rolled;

        msg.channel.send("You rolled "+dicebag[i]+" and got the following: "+diceRolled+".\nAccounting for modifiers, your total is "+userRoll.result+".");
      }
    }
    //userRoll = roll.roll(input);
  } else {
    msg.channel.send("That dice command is not in the proper format.");
    return;
  }

  //msg.channel.send("Here are the dice you rolled: ["+userRoll.rolled+"]\nAnd here is the sum of those rolls: "+userRoll.result);
}

exports.messageFired = function(config,msg) {
	//do nothing
}
