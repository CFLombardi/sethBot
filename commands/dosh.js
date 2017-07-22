const User = require("../GJUser.js");
//this will track users who have invoked this command
//for each message we will track the ID, author, timestamp, and target of the command
var messageHistory = [];
var badChars = ["+", "-", "*", "/", "\"", "\'"]

exports.run = function(msg, currentDosh) {
  var content = msg.content.split("!dosh");
  //var timeStamp = Math.floor(msg.createdTimestamp/1000);
  var mentions = msg.mentions.users;
  var updateDosh;
  var command;
  var target;
  var vote;

  //Determine whether it's an upvote or a downvote
  if(content[1].endsWith("++")) {
    command = content[1].split("++");
    target = command[0].trim();
    vote = "+";
  } else if(content[1].endsWith("--")) {
    command = content[1].split("--");
    target = command[0].trim();
    vote = "-";
  } else {
    return "false";
  }

  //make sure the command has valid targets
  target = validateTargets(msg, target);

  if(target != false) {
    //A user can only adjust dosh on a target once per 5 minutes
    for(var i = 0; i < messageHistory.length; i++) {
      if(msg.author.id === messageHistory[i].userID) {
        if((msg.createdTimestamp - messageHistory[i].timeStamp) < 300000) {
          for(var value of mentions) {
            if(value[1].id === messageHistory[i].target) {
              msg.channel.send("Bro, you've already voted.  GET THAT SHIT OUT OF HERE!");
              return false;
            }
          }
          //There's an infinite loop that happens here
          //can't seem to figure out why
          console.log(messageHistory.length);
          console.log(messageHistory);
          for(var i = 0; i < target.length; i++) {
            if(target[i] != undefined && target[i].toLowerCase().slice(1) === messageHistory[i].target.toLowerCase()) {
              msg.channel.send("Bro, you've already voted.  GET THAT SHIT OUT OF HERE!");
              return false;
            }
          }
        }
      }
    }

    if(mentions != null) {
      mentions.forEach(function(value, key, mentions) {
        if(value.bot) {
          msg.channel.send("What are you thinking bro?!  Don't feed the bots.");
        } else {
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
        }
      });
    }

    for(var i = 0; i < target.length; i++) {
      var found;
      target[i] = target[i].slice(1);

      currentDosh.forEach(function(value, key, users) {
        //if so update their dosh
        if((target[i].toLowerCase() === value.name.toLowerCase())) {
          (vote === "+") ? value.addDosh() : value.removeDosh();
          found = true;
        }
      });

      if(found != true) {
        var name = target[i];
        var user = new User(msg.id+i, name);
        (vote === "+") ? user.addDosh() : user.removeDosh();
        currentDosh.set(msg.id+i, user);
      }
      messageHistory.push({
        userID: msg.author.id,
        target: target[i],
        timeStamp: msg.createdTimestamp
      });
    }
  } else {
    return target;
  }

  return true;
}

//Take in the input from the user and message to reply if necessary
function validateTargets(message, input) {
  var targets = input.split(" ");
  var isValid;

  if(input === "") {
    message.channel.send("Sir.  Sir!  SIR!  You need to pick a valid target");
    isValid = false;
    return isValid;
  }

  for(var char of badChars) {
    if(input.includes(char)) {
      message.channel.send("Now you're just making up letters.  Take your 'special' characters and get out! GET OUT!!");
      isValid = false;
      return isValid;
    }
  }

  for(var i = 0; i < targets.length; i++) {
    if(!targets[i].includes("@")) {
      message.channel.send("Ah, ah, ah.  You didn't say the magic word");
      isValid = false;
      return isValid;
    }
  }

  if(isValid != false) {
    var i = targets.length;
    while(i--) {
      if(targets[i].startsWith("<@")) {
        targets.splice(i, 1);
      }
    }

    if(targets.length === 0) {
      targets = true;
    }
    return targets;
  } else {
    return isValid;
  }
}
