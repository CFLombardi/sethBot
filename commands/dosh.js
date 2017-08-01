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

  if(targets != false) {
    if(mentions != null) {
      var found;

      mentions.forEach(function(value, key, mentions) {
          var user = currentDosh.get(key);
          if(user === undefined) {
            user = new User(value.id, value.username);
            currentDosh.set(value.id, user);
          }
          (vote === "+") ? user.addDosh() : user.removeDosh();
          messageHistory.push({
            userID: msg.author.id,
            target: key,
            timeStamp: msg.createdTimestamp
          });
      });

      if(found === false) {
        return found;
      }
    }

    for(var i = 0; i < targets.length; i++) {
      var found;
      targets[i] = targets[i].slice(1);

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
  }

  isValid = checkHistory(message, theTargets);

  if(isValid != false) {
    var i = theTargets.length;
    while(i--) {
      if(theTargets[i].startsWith("<@")) {
        theTargets.splice(i, 1);
      }
    }

    if(theTargets.length === 0) {
      theTargets = true;
    }
    return theTargets;
  } else {
    return isValid;
  }
}

function checkHistory(msg, targets) {
  var mentions = msg.mentions.users;
  //A user can only adjust dosh on a target once per 5 minutes
  for(var i = 0; i < messageHistory.length; i++) {
    if(msg.author.id === messageHistory[i].userID && (msg.createdTimestamp - messageHistory[i].timeStamp) < 300000) {
      for(var value of targets) {
        if(value.startsWith("<@!")) {
          value = value.slice(3);
          value = value.replace(">", "");
        } else if(value.startsWith("<@")) {
          value = value.slice(2);
          value = value.replace(">", "");
        } else if (value.startsWith("@")) {
          value = value.slice(1);
        }
        console.log(value);
        console.log(typeof value);
      }


      for(var value of mentions) {
        if(value[1].id === messageHistory[i].target) {
          msg.channel.send("Bro, you've already voted.  GET THAT SHIT OUT OF HERE!");
          return false;
        }
      }

      //console.log("Checking targets");

      if(targets != null) {
        for (var value of targets) {
          if(value != undefined && value.toLowerCase().slice(1) === messageHistory[i].target.toLowerCase()) {
            msg.channel.send("Bro, you've already voted.  GET THAT SHIT OUT OF HERE!");
            return false;
          }
        }
      }
    }
  }

  return true;
}
