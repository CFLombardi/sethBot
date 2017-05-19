//this will track users who have invoked this command
//for each message we will track the ID, author, timestamp, and target of the command
var messageHistory = new Map();

exports.run = function(msg, currentDosh) {
  var currentTime = Math.floor(Date.now()/1000);
  //check if the user has tried to invoke this command within a certain time frame
  //if they have, then ignore it until time expires on the first time they invoked the command
  console.log("This is the 'currentTime': "+currentTime);
  messageHistory.set(msg.id, msg);
  console.log(messageHistory);
  messageHistory.forEach(function(value, key, message) {
      console.log("hi");
    if((value.author.id != msg.author.id) /*|| ((value.createdTimestamp - currentTime) < 180000))*/) {
      console.log(msg);
    }
  //check how the command was invoked with "--" or "++"
  });
}
