const User = require("../GJUser.js");
//this will track users who have invoked this command
//for each message we will track the userID, the target, and time invoked
var messageHistory = [];
var badChars = ["+", "-", "*", "/", "\"", "\'", "$"]

exports.run = function(msg, currentDosh) {
  var content = msg.content.split("!dosh");
  var mentions = msg.mentions.users;
  var command;
  var targets;
  var vote;

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

  //validate the targets the user is trying to vote for
  targets = validateTargets(msg, command);

  console.log(targets);

  if(targets != false) {

    for(var i = 0; i < targets.length; i++) {
      var isTargetUN = isNaN(targets[i]);
      var user;

      user = checkDoshForTarget(targets[i], mentions, isTargetUN);

      if(user === undefined) {
        user = checkDoshForTarget(targets[i], currentDosh, isTargetUN);
        if(user === undefined) {
          user = new User(msg.id+i, targets[i]);
        }
      } else {
        user = new User(user.id, user.username);
      }

      (vote === "+") ? user.addDosh() : user.removeDosh();
      currentDosh.set(user.getID(), user);

      console.log("target "+targets[i]+" added to history for user "+msg.author.username+" at "+msg.createdTimestamp);

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

function checkDoshForTarget(target, karmaMap, targetType) {
  for(var value of karmaMap) {
    if(targetType) {
      if(target.toLowerCase() === value[1].name.toLowerCase()) {
        return value[1];
      }
    } else {
      if(target === value[0]) {
        return value[1]
      }
    }
    console.log("Done checking "+target);
  }
  return undefined;
}

//Take in the input from the user and message to reply if necessary
function validateTargets(message, input) {
  var theTargets = input.split(" ");
  var isValid;

  //console.log(input);

  if(input === "") {
    message.channel.send("Sir.  Sir!  SIR!  You need to pick a valid target");
    return false;
  }

  for(var char of badChars) {
    if(input.includes(char)) {
      message.channel.send("Now you're just making up letters.  Take your 'special' characters and get out! GET OUT!!");
      return false;
    }
  }

  for(var i = 0; i < theTargets.length; i++) {
    if(!theTargets[i].startsWith("@") &&
       !theTargets[i].startsWith("<@") &&
       !theTargets[i].startsWith("<@!")) {
      message.channel.send("Ah, ah, ah.  You didn't say the magic word");
      return false;
    }

    if(theTargets[i] === "@") {
      message.channel.send("Look at this guy trying to pull a fast one.  I thought we were bros, bro...");
      return false;
    }

    if(theTargets[i].startsWith("<@!")) {
      theTargets[i] = theTargets[i].slice(3);
      theTargets[i] = theTargets[i].replace(">", "");
    } else if(theTargets[i].startsWith("<@")) {
      theTargets[i] = theTargets[i].slice(2);
      theTargets[i] = theTargets[i].replace(">", "");
    } else if(theTargets[i].startsWith("@")) {
      theTargets[i] = theTargets[i].slice(1);
    }
  }

  isValid = checkHistory(message, theTargets);

  if(isValid) {
    return theTargets;
  } else {
    return isValid;
  }
}

//A user can only adjust dosh on a target once per 30 minutes.  Returns true if they haven't voted for the target yet
function checkHistory(msg, targets) {
  for(var i = 0; i < messageHistory.length; i++) {
    if(msg.author.id === messageHistory[i].userID && (msg.createdTimestamp - messageHistory[i].timeStamp) < 1800000) {
      for(var value of targets) {
        if(isNaN(value)) {
          value = value.toLowerCase();
        }

        if(value === messageHistory[i].target) {
          msg.channel.send("Bro, you've already voted.  GET THAT SHIT OUT OF HERE!");
          return false;
        }
      }
    }
  }

  return true;
}
