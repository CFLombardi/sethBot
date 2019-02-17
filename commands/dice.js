var Roll = require('roll');

exports.run = function(config, msg) {
  var roll = new Roll();
  var input = msg.content;
  var dicebag = input.split("+");

  dicebag = assembleDice(dicebag);
  console.log(dicebag);
  for(var i = 0; i < dicebag.length; i++) {
    var advantage = "none";

    //check for advantage
    if(dicebag[i].includes("A")) {
      advantage = "advantage";
      dicebag[i] = dicebag[i].replace("A", "");
    } else if (dicebag[i].includes("D")) {
      advantage = "disadvantage";
      dicebag[i] = dicebag[i].replace("D", "");
    }

    console.log(dicebag[i]);
    var valid = roll.validate(dicebag[i]);
    if(valid) {
      //collect some data before rolling
      var count,
          type;
      var modifiers = [];

      if(dicebag[i].match(/^\d/)) {
        count = dicebag[i].split("d")[0];
      } else {
        count = 0;
      }

      var temp = dicebag[i].split("d")[1];
      if(temp.includes("+")) {
        temp = temp.split("+");
        if(temp.length > 1) {
            type = temp[0];
            for(var j = 1; j < temp.length; j++) {
              modifiers.push({value: temp[j], sign: "+"});
            }
        }
      } else {
        type = temp;
      }

      //determine what kind of roll we are making
      if(advantage != "none") {
        var temp = (count > 0)? dicebag[i].replace(dicebag[i].charAt(0), "2"): "2"+dicebag[i];
        var userRoll = roll.roll(temp);
        var diceRolled = userRoll.rolled;
        var result;

        if(advantage === "advantage") {
          result = (diceRolled[0] > diceRolled[1])? diceRolled[0]: diceRolled[1];
        } else {
          result = (diceRolled[0] > diceRolled[1])? diceRolled[1]: diceRolled[0];
        }
        /*
        if(modifiers.length > 0) {
          for(var j = 0; j < modifiers.length; j++) {
              result += Number(modifiers[j]);
          }
        }
        */
        msg.channel.send("You rolled "+dicebag[i]+" with "+advantage+".  Here is your roll: "+diceRolled+".  With modifiers, your result is "+result);
      } else {
        var userRoll = roll.roll(dicebag[i]);
        var diceRolled = userRoll.rolled;
        var result = userRoll.result;

        if(count > 1) {
          if(modifiers.length > 0) {
            /*
            for (var j = 0; j < modifiers.length; j++) {
              result += Number(modifiers[j]);
            }
            */
            msg.channel.send("You rolled "+dicebag[i]+".  Here are your rolls: "+diceRolled+".  With modifiers, your result is "+result);
          } else {
            msg.channel.send("You rolled "+dicebag[i]+".  Here are your rolls: "+diceRolled+".  Your result is "+result);
          }
        } else {
          if(modifiers.length > 0) {
            /*
            for (var j = 0; j < modifiers.length; j++) {
              result += Number(modifiers[j]);
            }
            */
            msg.channel.send("You rolled "+dicebag[i]+".  With modifiers, your result is "+result);
          } else {
            result = userRoll.result;
            msg.channel.send("You rolled "+dicebag[i]+".  Your result is: "+result);
          }
        }
      }
    } else {
      var output = dicebag[i];
      msg.channel.send(output+" is not in the proper format.");
      return;
    }
  }
}

function assembleDice(input) {
  var result = [];
  console.log(input);
  for(var i = 0; i < input.length; i++) {
    var isDie = input[i].includes("d");
    if(isDie) {
      for(var j = i+1; j < input.length; j++) {
        if(!isNaN(input[j]) || (input[j].includes("-") && !input[j].includes("d"))) {
          input[i] = input[i]+"+"+input[j];
        } else {
          break;
        }
      }
      result.push(input[i]);
    }
  }//for loop
  return result
}

exports.messageFired = function(config,msg) {
	//do nothing
}
