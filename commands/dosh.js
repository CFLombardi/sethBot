const User = require("../GJUser.js");
//this will track users who have invoked this command
//for each message we will track the ID, author, timestamp, and target of the command
var messageHistory = [];
var badChars = ["+", "-", "*", "/", "\"", "\'", "$"]

exports.run = function(msg, currentDosh) {
  var content = msg.content.split("!dosh");
  //var timeStamp = Math.floor(msg.createdTimestamp/1000);
  var mentions = msg.mentions.users;
  var updateDosh;
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
    var found;
    for(var i = 0; i < targets.length; i++) {
      if(!isNaN(targets[i])) {
        for (var value of mentions) {
          if(value[0] === targets[i]) {
            //if target is a number we need to get the user information to add to the dosh
          }
        }
      }
      for(var value of currentDosh) {
        console.log(value);
        if(targets[i])
      }

      currentDosh.forEach(function(value, key, users) {
        //if so update their dosh
        if((targets[i].toLowerCase() === value.name.toLowerCase())) {
          (vote === "+") ? value.addDosh() : value.removeDosh();
          found = true;
        }
      });

      if(found != true) {
        var name = targets[i];
        var user = new User(msg.id+i, name);
        (vote === "+") ? user.addDosh() : user.removeDosh();
        currentDosh.set(msg.id+i, user);
      }
      messageHistory.push({
        userID: msg.author.id,
        target: targets[i],
        timeStamp: msg.createdTimestamp
      });
    }
  } else {
    return targets;
  }
  msg.channel.send("You got it brah!");
  return true;
}

//Take in the input from the user and message to reply if necessary
function validateTargets(message, input) {
  var theTargets = input.split(" ");
  var isValid;

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
