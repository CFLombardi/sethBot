const User = require("../GJUser.js");
//this will track users who have invoked this command
//for each message we will track the ID, author, timestamp, and target of the command
var messageHistory = [];

exports.run = function(msg, currentDosh) {
  var content = msg.content.split(" ");
  var timeStamp = Math.floor(msg.createdTimestamp/1000);
  //var currentTime = Math.floor(Date.now()/1000);
  var updatedDosh = false;
  var command;

  //verify correct syntax for the command
  if(content.length === 2) {
    //gather whether they are down voting or up voting
    if(content[1].endsWith("++")) {
      command = content[1].split("++");
      command[1] = "+";
    } else if (content[1].endsWith("--")) {
      command = content[1].split("--");
      command[1] = "-";
    } else {
      return false;
    }

    //user can only invoke this command on the same target once every 5 minutes
    for(var i = 0; i < messageHistory.length; i++) {
        if((msg.author.username === messageHistory[i].user) && (command[0] === messageHistory[i].target) && ((timeStamp - messageHistory[i].timeStamp) < 300000)) {
          console.log("You've already voted.  Please try again later");
          return false;
        }
    }

    //check to see if they already have dosh and update that count accordingly
    updatedDosh = checkCurrentKarma(command[0], command[1], currentDosh);

    if(!updatedDosh) {
      updatedDosh = updateDoshMap(command[0], command[1], msg, currentDosh);
    }

    if(updatedDosh) {
      messageHistory.push({
        userID: msg.author.id,
        user: msg.author.username,
        target: command[0],
        direction: command[1],
        timeStamp: timeStamp
      });
    }
    console.log(messageHistory);
  } else {
    console.log("Incorrect syntax.  Try something like '!dosh Seth++'")
  }
  
  return updatedDosh;
}

//checks "dosh map" and returns true of they exist in the map
function checkCurrentKarma(target, direction, karmaMap) {
  karmaMap.forEach(function(value, key, users) {
    //if so update their dosh
    if((target === value.name) || (target === value.nickname)) {
      (direction === "+") ? value.addDosh() : value.removeDosh();
      return true;
    }
  });

  return false;
}

function updateDoshMap(target, direction, message, karmaMap) {
  var id = message.id;
  var name = target;
  var user = new User(id, name);
  (direction === "+") ? user.addDosh() : user.removeDosh();
  karmaMap.set(id, user);
  return true;
}
