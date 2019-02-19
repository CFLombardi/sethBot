var Roll = require('roll');

exports.run = function(config, msg) {
  var roll = new Roll();
  var input = msg.content;
  var dicebag;
  var output;

  dicebag = assembleDice(input);

  console.log(dicebag);

  if(dicebag === false) {
    output = "Bro, "+input+" is not in the correct format.  Clean that shit up!";
    msg.channel.send(output);
  }

  for(var i = 0; i < dicebag.length; i++) {
    var text = dicebag[i].text;
    var valid = roll.validate(text);
    if(valid) {
      var type = dicebag[i].type;
      var advantage = dicebag[i].advantage;
      var count = dicebag[i].count;
      var modifiers = (dicebag[i].mods.length > 0)? dicebag[i].mods: null;
      //determine what kind of roll we are making
      if(advantage != "none") {
        var temp = (modifiers != null)? "2d"+type+dicebag[i].modString: "2d"+type;
        var userRoll = roll.roll(temp);
        var diceRolled = userRoll.rolled;
        var result;

        if(advantage === "advantage") {
          result = (diceRolled[0] > diceRolled[1])? diceRolled[0]: diceRolled[1];
        } else {
          result = (diceRolled[0] > diceRolled[1])? diceRolled[1]: diceRolled[0];
        }

        if(modifiers != null) {
          for(var j = 0; j < modifiers.length; j++) {
            if(modifiers[j].sign === "+") {
              result += Number(modifiers[j].value);
            } else if (modifiers[j].sign === "-") {
              result -= Number(modifiers[j].value);
            } else if (modifiers[j].sign === "/") {
              result = result/Number(modifiers[j].value);
            } else if (modifiers[j].sign === "*") {
              result = result*Number(modifiers[j].value);
            }
          }
        }

        msg.channel.send("You rolled "+text+" with "+advantage+".  Here are your rolls: "+diceRolled+".  With modifiers, your result is "+result);
      } else {
        var userRoll = roll.roll(dicebag[i].text);
        var diceRolled = userRoll.rolled;
        var result = userRoll.result;
        output = "You rolled "+text+".  ";

        if(count > 1) {
          output += "Here are your rolls: "+diceRolled+".  ";
          if(modifiers != null) {
            output += "With modifiers, your total is "+result;
          } else {
            output += "Your total is "+result;
          }
        } else {
          if(modifiers != null) {
            var original = result;
            for (var j = 0; j < modifiers.length; j++) {
              if(modifiers[j].sign === "+") {
                original -= Number(modifiers[j].value);
              } else if(modifiers[j].sign === "-") {
                original += Number(modifiers[j].value);
              } else if(modifiers[j].sign === "/") {
                original = original*Number(modifiers[j].value);
              } else if(modifiers[j].sign === "*") {
                original = original/Number(modifiers[j].value);
              }
            }
            output += "Here is your roll: "+original+".  With modifiers, your total is "+result;
          } else {
            output += "Your total is: "+result;
          }
        }
        msg.channel.send(output);
      }
    } else {
      output = "Bro, "+text+" is NOT in the proper format.";
      msg.channel.send(output);
      return;
    }
  }
}

function assembleDice(request) {
  var result = [];
  var dice = request.split("&");

  for(var i = 0; i < dice.length; i++) {
    var count,
        type;
    var modifiers = [];
    var advantage = "none";
    var temp = dice[i].split("d");
    if(temp[0] === "") {
      count = 1;
    } else if (!(isNaN(temp[0]))) {
      count = temp[0];
    } else {
      result = false;
      return result;
    }

    if(!isNaN(temp[1])) {
      type = temp[1];
    } else {
      for(var j = 0; j < temp[1].length; j++) {
        if(isNaN(temp[1].charAt(j))) {
          if(type === undefined) {
            type = temp[1].substring(0, j);
            if(temp[1].charAt(j) === "A") {
              advantage = "advantage";
              temp[1] = temp[1].slice(0, j)+temp[1].slice(j+1);
              dice[i] = temp[0]+"d"+temp[1];
            } else if(temp[1].charAt(j) === "D") {
              advantage = "disadvantage";
              temp[1] = temp[1].slice(0, j)+temp[1].slice(j+1);
              dice[i] = temp[0]+"d"+temp[1];
            }
          }

          for(var k = j+1; k < temp[1].length; k++) {
            if(isNaN(temp[1].charAt(k))) {
              modifiers.push({value: temp[1].substring(j+1, k), sign: temp[1].charAt(j)});
              break;
            } else if(k === (temp[1].length -1)) {
              modifiers.push({value: temp[1].substring(j+1), sign: temp[1].charAt(j)});
            }
          }
        }
      }
    }

    var modString = "";
    for(var k = 0; k < modifiers.length; k++){
      modString += ""+modifiers[k].sign+modifiers[k].value;
    }

    result.push({text: dice[i], count: count, type: type, mods: modifiers, advantage: advantage, modString: modString});
  }//for loop
  return result
}

exports.messageFired = function(config,msg) {
	//do nothing
}
