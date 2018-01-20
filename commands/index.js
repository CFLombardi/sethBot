const doshCommand = require("./dosh");
const leaderBoardCommand = require("./leaderboard.js")
const eyebleach = require("./eyebleach.js")
const twitch = require("./twitch.js")

exports.commands = {
  dosh: doshCommand, 
  leaderboard: leaderBoardCommand,
  eyebleach: eyebleach,
  twitch: twitch
}
