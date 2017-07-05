const User = require("../GJUser.js");
//this will track users who have invoked this command
//for each message we will track the ID, author, timestamp, and target of the command
var messageHistory = [];

exports.run = function(msg, currentDosh) {
  var command = msg.content.split(" ");
  var timeStamp = Math.floor(msg.createdTimestamp/1000);
  var currentTime = Math.floor(Date.now()/1000);
  var updatedDosh = false;

  //verify correct syntax for the command
  if(command.length === 2) {
    //determine if it's an upvote or a downvote
    if(command[1].endsWith("++")) {
      var target = command[1].split("+");

      //if there are no entries in messageHistory then update dosh
      if(messageHistory.length === 0) {
        console.log("messageHistory is blank");
        updatedDosh = checkCurrentKarma(target[0], currentDosh);

        if(!updatedDosh) {
          updatedDosh = updateDoshMap("+", msg, currentDosh);
        }
      } else {
        //check to make sure the user isn't already in the Map
        for(var i = 0; i < messageHistory.length; i++) {
            if((target[0] != messageHistory[i].target) && (msg.author.username != messageHistory[i].user) && ((currentTime - messageHistory[i].timeStamp) > 300000)) {
              updatedDosh = updateDoshMap("+", msg, currentDosh);
            }
        }

        if(!updatedDosh) {
          updatedDosh = checkCurrentKarma(target[0], currentDosh);
        }
      }
    } else if(command[1].endsWith("--")) {
      var target = command[1].split("-");
    }

    if(updatedDosh) {
      messageHistory.push({
        userID: msg.author.id,
        user: msg.author.username,
        target: target[0],
        timestamp: timeStamp
      });
      console.log("Dosh updated: "+updatedDosh);
    }
    console.log(messageHistory);
  }
  return updatedDosh;
}

//checks "dosh map" and returns true of they exist in the map
function checkCurrentKarma(target, karmaMap) {
  karmaMap.forEach(function(value, key, users) {
    //if so update their dosh
    if((target === value.name) || (target === value.nickname)) {
      value.addDosh();
      return true;
    }
  });

  return false;
}

function updateDoshMap(target, message, karmaMap) {
  var id = message.id;
  var name = message.author.username;
  var user = new User(id, name);
  (target === "+") ? user.addDosh() : user.removeDosh();
  karmaMap.set(id, user);
  return true;
}
