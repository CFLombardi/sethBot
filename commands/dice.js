var Roll = require('roll');

exports.run = function(config, msg) {
  var roll = new Roll();
  var input = msg.content;
  var dicebag = input.split("+");
  var output;

  dicebag = assembleDice(dicebag);
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

      var temp = dicebag[i].split("d")[1]
      for(var j=0; j<temp.length; j++){
        if(isNaN(temp.charAt(j))) {
          if(type === undefined) {
            type = temp.substring(0, j);
          }
          for(var k=j+1; k <temp.length; k++) {
            if(isNaN(temp.charAt(k))) {
              modifiers.push({value: temp.substring(j+1, k), sign: temp.charAt(j)});
              break;
            }

            if(k === (temp.length - 1)){
              modifiers.push({value: temp.substring(j+1), sign: temp.charAt(j)});
            }
          }
        }
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

        if(modifiers.length > 0) {
          for(var j = 0; j < modifiers.length; j++) {
            if(modifiers[j].sign === "+") {
              result += Number(modifiers[j].value);
            } else {
              result -= Number(modifiers[j].value);
            }
          }
        }

        msg.channel.send("You rolled "+dicebag[i]+" with "+advantage+".  Here are your rolls: "+diceRolled+".  With modifiers, your result is "+result);
      } else {
        var userRoll = roll.roll(dicebag[i]);
        var diceRolled = userRoll.rolled;
        var result = userRoll.result;
        output = "You rolled "+dicebag[i]+".  ";

        if(count > 1) {
          output += "Here are your rolls: "+diceRolled+".  ";
          if(modifiers.length > 0) {
            output += "With modifiers, your result is "+result;
          } else {
            output += "Your result is "+result;
          }
        } else {
          if(modifiers.length > 0) {
            var original = result;
            for (var j = 0; j < modifiers.length; j++) {
              if(modifiers[j].sign === "+") {
                original -= Number(modifiers[j].value);
              } else {
                original += Number(modifiers[j].value);
              }
            }
            output += "Here is your roll: "+original+".  With modifiers, your result is "+result;
          } else {
            output += "Your result is: "+result;
          }
        }
        msg.channel.send(output);
      }
    } else {
      output = "Bro, "+dicebag[i]+" is NOT in the proper format.";
      msg.channel.send(output);
      return;
    }
  }
}

function assembleDice(input) {
  var result = [];
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
