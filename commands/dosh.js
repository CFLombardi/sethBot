const User = require("../GJUser.js");
//this will track users who have invoked this command
//for each message we will track the ID, author, timestamp, and target of the command
var messageHistory = [];

exports.run = function(msg, currentDosh, bot) {
  var content = msg.content.split(" ");
  var timeStamp = Math.floor(msg.createdTimestamp/1000);
  var mentions = msg.mentions.users;
  //var currentTime = Math.floor(Date.now()/1000);
  var updatedDosh = false;
  var command;

  //console.log(mentions);
  //console.log(bot.fetchUser(mentions.id));

  //verify correct syntax for the command
  if(content.length === 2) {
    //gather whether they are down voting or up voting
    if(content[1].endsWith("++") && (content[1].split("+").length - 1) === 2) {
      command = content[1].split("++");
      command[1] = "+";
    } else if (content[1].endsWith("--") && (content[1].split("-").length - 1) === 2) {
      command = content[1].split("--");
      command[1] = "-";
    } else {
      msg.channel.send("BREH!  Do you even syntax?!  Try something like '!dosh Seth++'");
      return "false";
    }

    //user can only invoke this command on the same target once every 5 minutes
    for(var i = 0; i < messageHistory.length; i++) {
        if(
           (msg.author.username === messageHistory[i].user) &&
           (command[0].toLowerCase() === messageHistory[i].target.toLowerCase()) &&
           ((timeStamp - messageHistory[i].timeStamp) < 300000)
          ) {
            msg.channel.send("Bro, you've already voted.  GET THAT SHIT OUT OF HERE!");
            return "false";
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
        timeStamp: timeStamp
      });
    }
  } else {
    msg.channel.send("You better check some websites because that's just not right.  Try something like '!dosh Seth++'")
    updatedDosh = "false";
  }

  return updatedDosh;
}

//checks "dosh map" and returns true if they exist in the map
function checkCurrentKarma(target, direction, karmaMap) {
  var found;
  karmaMap.forEach(function(value, key, users) {
    //if so update their dosh
    if((target.toLowerCase() === value.name.toLowerCase())) {
      (direction === "+") ? value.addDosh() : value.removeDosh();
      found = true;
    }
  });
  return found;
}

function updateDoshMap(target, direction, message, karmaMap) {
  if(target != "") {
    var id = message.id;
    var name = target;
    var user = new User(id, name);
    (direction === "+") ? user.addDosh() : user.removeDosh();
    /*
    if(message.member.nickname != null) {
      console.log("Logging the "+message.member.nickname);
      user.setNickName(message.member.nickname);
    }
    */
    karmaMap.set(id, user);
    return true;
  } else {
    message.channel.send("That's not a valid target bro.");
  }
}
