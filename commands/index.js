const doshCommand = require("./dosh");
const leaderBoardCommand = require("./leaderboard.js")
const eyebleach = require("./eyebleach.js")
const twitch = require("./twitch.js")
const dice = require("./dice.js")
const poll = require("./poll.js");

exports.commands = {
  dosh: doshCommand,
  leaderboard: leaderBoardCommand,
  eyebleach: eyebleach,
  twitch: twitch,
  live: twitch,
 // dice: dice,
  poll: poll
}
