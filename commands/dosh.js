const User = require("../GJUser.js");
const fs = require("fs");
require("collections/shim-array");
require("collections/listen/array-changes");

//this will track users who have invoked this command
//for each message we will track the userID, the target, and time invoked
var messageHistory = [];
var badChars = ["@", "+", "-", "*", "/", "\\", "\"", "\'", "$", "(", ")", "[", "]", "{", "}", ":"]

//Key: Discord User ID ::: Value: Discord
const karmaMap = new Map();

function updateKarmaMap(){
  //Tries to load a savedCountJson... if that doesn't exist, it will throw an error but thats fine.. it wont hurt.
  try{
  var file = fs.readFileSync('savedCount.json', 'utf8');
  } catch (err){
    return;
  }
  var obj = JSON.parse(file); //now it an object
  for(var i in obj.dosh)
  {
    var id = obj.dosh[i].id;
    var name = obj.dosh[i].name;
    var totalCount = obj.dosh[i].totalCount;
    var user = new User(id,name);
    user.setCount(totalCount);
    karmaMap.set(id, user);
  }
}


//Key: messageid ::: Value: collection<integer> (Discord UserIDs of members who reacted to a message )
const usersWhoReacted = new Map();

//Key: messageid ::: Value: Discord UserID of the user who sent a particular message.
const messageToUser = new Map();

exports.messageFired = function(config,msg) {
  sendToCollector(config, msg);
}


exports.run = function(config, msg) {
  if(msg.channel.type != "text") {
    return;
  }
  //lazy update of karma map.
  updateKarmaMap();
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
    var target = validateTargets(msg, content[1].trim());
    var outStr;
    if(target != false && target.length === 1) {
      karmaMap.forEach(function(value, key, dosh) {
        if(isNaN(target[0])) {
          if(value.name.toLowerCase() === target[0].toLowerCase()) {
            outStr = value.name+" has "+value.getCount()+" dosh, brah!\n";
          }
        } else {
          if(key === target[0]) {
            outStr = value.name+" has "+value.getCount()+" dosh, brah!\n";
          }
        }
      });

      if(outStr === undefined){
        if(!isNaN(target)) {
          mentions.forEach(function(value, key, mentions) {
            outStr = value.username+" has no dosh.";
          });
        } else {
          outStr = target[0]+" has no dosh.";
        }
      }
      msg.channel.send(outStr);
    } else if(target.length > 1) {
      msg.channel.send("One at a time broseph.");
    }
    return;


  }

  //You can't vote on yourself or bots
  for (var value of mentions) {
    if(value[0] === msg.author.id) {
      msg.channel.send("I respect the self love bro, but you can't vote for yourself.  Bad form!  SHAME!");

      return;
    }

    if(value[1].bot) {
      msg.channel.send("What are you thinking bro?!  Don't feed the bots.");
      return;
    }
  }

  //validate the targets the user is trying to vote for
  targets = validateTargets(msg, command);

  //check to see if the user has tried to vote for the same target within 30 minutes
  //false means that they have, true means that they have not voted.
  if(targets != false) {
    var isValid = checkHistory(msg, targets);
  } else {
    return;
  }

  if(isValid) {
    for(var i = 0; i < targets.length; i++) {
      var isTargetUN = isNaN(targets[i]);
      var user;

      if(isTargetUN) {
        user = checkMapForTarget(targets[i], karmaMap, isTargetUN);
        if(user === undefined) {
          user = new User(msg.id+i, targets[i]);
        }
      } else {
        user = checkMapForTarget(targets[i], mentions, isTargetUN);
        var tempUser = checkMapForTarget(user.id, karmaMap, isTargetUN);

        if(tempUser === undefined) {
          user = new User(user.id, user.username);
        } else {
          user = tempUser;
        }
      }

      (vote === "+") ? user.addDosh() : user.removeDosh();
      karmaMap.set(user.getID(), user);

      messageHistory.push({
        userID: msg.author.id,
        target: targets[i],
        timeStamp: msg.createdTimestamp
      });

    }//for loop targets.length
    msg.channel.send("You got it brah!");
    save();
  } //if isValid


}//this is the end of the export

function sendToCollector(config, msg){
    const collector = msg.createReactionCollector(
    (reaction, user) => (reaction.emoji.id==config.downEmoji || reaction.emoji.id==config.upEmoji) && !user.bot,
    { time: 43200000 }//12 hours for collection time before it dies.
     //{ time: 10000 }//10 seconds for collection time before it dies.

    );
    trackCollector(msg, collector,config);
}

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

  //check to see if targets are properly set
  for(var i = 0; i < theTargets.length; i++) {
    if(!theTargets[i].startsWith("@") &&
       !theTargets[i].startsWith("<@") &&
       !theTargets[i].startsWith("<@!")) {
      message.channel.send("Ah, ah, ah.  You didn't say the magic word.");
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
      message.channel.send("Sir.  Sir!  SIR!  You need to pick a valid target.");
      return false;
    }
  } //end of for targets.length

  return theTargets;

}

//Saves the Karma Map.
function save() {
  var obj = {
     dosh: []
  };
  karmaMap.forEach( function(value,key,karmaMap) {
  obj.dosh.push(value);
  });
  var json = JSON.stringify(obj);
  fs.writeFile('savedCount.json', json, 'utf8', null);
}

//Takes in a collector and a message and sets up the tracker.
function trackCollector(msg, collector,config)
{
  collector.on('collect', r =>
  {
    if(r.emoji.id == config.upEmoji)
    {
      handleUp(r);
    }
    if(r.emoji.id == config.downEmoji)
    {
      handleDown(r);
    }
  });

  collector.on('end', collected =>
  {
    collected.forEach(function(value,key,collected)
    {
      messageToUser.delete(value.message.id);
      usersWhoReacted.delete(value.message.id);
    });

  });
}

//Handle when Dosh goes up
function handleUp(reaction)
{
  updateDosh(reaction,true);
}
//Handle when goes down.
function handleDown(reaction)
{
  updateDosh(reaction,false);
}

//General function to handle the physical raising and lowering of dosh.
function updateDosh(reaction,addDosh)
{
  var messageUsers = reaction.users;
  var msg = reaction.message;
  var authorID = msg.author.id;
  var authorName = msg.author.username;

  //If this is the first time we are seeing a message, add it to the maps that keep track of this stuff.
  if(!messageToUser.has(msg.id))
  {
    messageToUser.set(msg.id,authorID);
    usersWhoReacted.set(msg.id,new Array());
  }

  //For each user who ever commented, go through and make sure they have the appropriate +1 or -1
  messageUsers.forEach(function(value,key,messageUsers)
  {
    //If the user is one of these users who up/downvoted themselves, yell at them please.
    if(key == authorID)
    {
      msg.reply("Bruh, voting your own post? Get out. I SAID GET THAT SHIT OUT");
      console.log("Someone is trying to upvote their own post... jerks.");
      reaction.remove(msg.author);
      return;
    }

    //If the user already has a vote for or against, then clear it.
    var reactedUsers = usersWhoReacted.get(msg.id);
    if(reactedUsers.has(key))
    {
      console.log("this person already has a vote.. no can do");
    }
    else
    {
      reactedUsers.push(key);
      var user = karmaMap.get(authorID);
      if(user == undefined)
      {
        console.log("User Undefined... adding to list of known users");
        user = new User(authorID, authorName);
        karmaMap.set(authorID, user);
      }
      if(addDosh)
      {
        user.addDosh();
      }
      else
      {
        user.removeDosh();
      }
    }
    //Save the JSON.
    save();
  });

}
