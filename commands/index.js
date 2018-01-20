const doshCommand = require("./dosh");
const leaderBoardCommand = require("./leaderboard.js")

exports.commands = {
  dosh: doshCommand, 
  leaderboard: leaderBoardCommand
}
