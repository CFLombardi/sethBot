const doshCommand = require("./dosh");
const leaderBoardCommand = require("./leaderboard.js")
const eyebleach = require("./eyebleach.js")

exports.commands = {
  dosh: doshCommand, 
  leaderboard: leaderBoardCommand,
  eyebleach: eyebleach
}
