const User = require("../GJUser.js");
//this will track users who have invoked this command
//for each message we will track the userID, the target, and time invoked
var messageHistory = [];
var badChars = ["@", "+", "-", "*", "/", "\\", "\"", "\'", "$", "(", ")", "[", "]", "{", "}"]

exports.run = function(msg, currentDosh) {
  var content = msg.content.split("!dosh");
  var mentions = msg.mentions.users;
  var command;
  var targets;
  var vote;

  //Determine whether it's an upvote or a downvote
  if(content[1].endsWith("++")) {
    content = content[1].split("++");
    command = content[0].trim();
    vote = "+";
  } else if(content[1].endsWith("--")) {
    content = content[1].split("--");
    command = content[0].trim();
    vote = "-";
  } else {
    return "false";
  }

  //You can't vote on yourself or bots
  for (var value of mentions) {
    if(value[0] === msg.author.id) {
      msg.channel.send("I respect the self love bro, but you can't vote for yourself.  Bad form!  SHAME!");
      return false;
    }

    if(value[1].bot) {
      msg.channel.send("What are you thinking bro?!  Don't feed the bots.");
      return false;
    }
  }

  //validate the targets the user is trying to vote for
  targets = validateTargets(msg, command);

  if(targets != false) {

    for(var i = 0; i < targets.length; i++) {
      var isTargetUN = isNaN(targets[i]);
      var user;

      user = checkMapForTarget(targets[i], mentions, isTargetUN);

      if(user === undefined) {
        user = checkMapForTarget(targets[i], currentDosh, isTargetUN);
        if(user === undefined) {
          user = new User(msg.id+i, targets[i]);
        }
      } else {
        user = checkMapForTarget(user.id, currentDosh, false);
        //user = new User(user.id, user.username);
      }

      (vote === "+") ? user.addDosh() : user.removeDosh();
      currentDosh.set(user.getID(), user);

      messageHistory.push({
        userID: msg.author.id,
        target: targets[i],
        timeStamp: msg.createdTimestamp
      });

    }//for loop targets.length
    msg.channel.send("You got it brah!");
    return true;
  } //if targets != false

}//this is the end of the export

//A user can only adjust dosh on a target once per 30 minutes.
//Returns true if they haven't voted for the target yet
function checkHistory(msg, targets) {
  for(var i = 0; i < messageHistory.length; i++) {
    if(msg.author.id === messageHistory[i].userID) {
      if((msg.createdTimestamp - messageHistory[i].timeStamp) < 1800000) { //1800000 is 30 minutes
        for(var value of targets) {
          if(isNaN(value)) {
            value = value.toLowerCase();
            messageHistory[i].target = messageHistory[i].target.toLowerCase();
          }

          if(value === messageHistory[i].target) {
            msg.channel.send("Bro, you've already voted.  GET THAT SHIT OUT OF HERE!");
            return false;
          }
        }
      } else {
        messageHistory.splice(i);
      }
    }
  }
  return true;
}

//check the map for a specific target and return that target from the map
function checkMapForTarget(target, collection, targetType) {
  for(var value of collection) {
    if(targetType) {
      if(target.toLowerCase() === value[1].name.toLowerCase()) {
        return value[1];
      }
    } else {
      if(target === value[0]) {
        return value[1]
      }
    }
  }
  return undefined;
}

//Take in the input from the user and message to reply if necessary
function validateTargets(message, input) {
  var theTargets = input.split(" ");
  var isValid;

  //check to see if targets are properly set
  for(var i = 0; i < theTargets.length; i++) {
    if(!theTargets[i].startsWith("@") &&
       !theTargets[i].startsWith("<@") &&
       !theTargets[i].startsWith("<@!")) {
      message.channel.send("Ah, ah, ah.  You didn't say the magic word");
      return false;
    }

    //strip the identifying characters
    if(theTargets[i].startsWith("<@!")) {
      theTargets[i] = theTargets[i].slice(3);
      theTargets[i] = theTargets[i].replace(">", "");
    } else if(theTargets[i].startsWith("<@")) {
      theTargets[i] = theTargets[i].slice(2);
      theTargets[i] = theTargets[i].replace(">", "");
    } else if(theTargets[i].startsWith("@")) {
      theTargets[i] = theTargets[i].slice(1);
    }

    //if any entry has special characters
    for(var char of badChars) {
      if(theTargets[i].includes(char)) {
        message.channel.send("Now you're just making up letters.  Take your 'special' characters and get out! GET OUT!!");
        return false;
      }
    }

    //check to see if there are multiples of the same target
    for(var j=0; j<theTargets.length; j++) {
      if(i != j && theTargets[i] === theTargets[j]) {
        message.channel.send("A little too greedy there Oliver.  One at a time please.");
        return false;
      }
    }

    //if the target is blank
    if(theTargets[i] === "") {
      message.channel.send("Sir.  Sir!  SIR!  You need to pick a valid target");
      return false;
    }
  } //end of for targets.length

  //check to see if the user has tried to vote for the same target within 30 minutes
  //false means that they have, true means that they have not voted.
  isValid = checkHistory(message, theTargets);

  if(isValid) {
    return theTargets;
  } else {
    return isValid;
  }
}
