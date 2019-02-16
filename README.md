# SethBot
## Purpose
This discord bot is an ongoing development bot with features such as a karma system (leaderboard), twitch.tv pub/sub, and cat/dog pictures. Each of these sub systems called "commands" can be turned on or off to fit the needs (and pickiness) of the discord server. 
This bot was developed for Good Job! Gaming (http://www.goodjobgaming.com/)

## Installation
Seth bot requires node.js.
Download a release and run `npm install` to download the required packages / dependencies.
It is recommended you use a linux service manager such as [pm2](http://pm2.keymetrics.io/) or a default service manager to run Sethbot.

### Configuration
You will need to create a "config.json" file in the root directory with the following information:
````json
{
  "developerMode" : "false",
  "token" : "__DISCORD_BOT_API__",
  "devToken": "__DISCORD_BOT_API__",
  "prefix": "!",
  "catApi": "__CAT_API__",
  "upEmoji": "__CUSTOM_EMOJI_ID_NUMBER__",
  "downEmoji": "__CUSTOM_EMOJI_ID_NUMBER__",
  "twitch" : {
	  "twitch_client_id" : "__TWITCH_CLIENT_ID__",
	  "twitch_client_secret" : "__TWITCH_CLIENT_SECRET__",
	  "twitch_callback_host" : "__CALLBACK_HOST__",
	  "twitch_callback_path" : "__CALLBACK_PATH",
	  "twitch_callback_port" : 3001,
	  "permission_groups" : ["__ADMIN_PERMISSION_ID__"]
  }

}
````
The keys/api auths can be recieved at the following websites:
* __DISCORD_BOT_API__ = https://discordapp.com/developers/docs/intro
* __CAT_API__ = http://thecatapi.com/
* __CUSTOM_EMOJI_ID_NUMBER__ = your discord server emoji id (they should be different for up and down). see (https://discordia.me/developer-mode)
* __ADMIN_PERMISSION_ID__ = your discord server admin role id . see (https://discordia.me/developer-mode)
* __TWITCH_CLIENT_ID__ && __TWITCH_CLIENT_SECRET__ = https://dev.twitch.tv/
* __CALLBACK_HOST__ && __CALLBACK_PATH__ = your servers address and custom path.

## Usage
All commands are mapped in commands/index.json
The Key should correlate to which command you want the user to say. (preceding the prefix in config.json) and the value should be the associated command.

#### dosh
Dosh is added and removed in 2 ways. First via the usage of reactions, one will raise a users dosh and the other will lower it.
!dosh @user -> will tell the users total dosh.
!dosh @user... ++ -> 1...n users will recieve 1 dosh.
!dosh @user... -- -> 1...n users will lose 1 dosh.
!leaderboard -> tells the top users with the most dosh

#### eyebleach
Eyebleach grabs a random cat or dog picture and posts it in the channel. Easy as that.

#### Twitch / Live
Seth is equipped to register users and subscribe to their streams. He will then tell the users in the channel when his subscribed accounts go live.
Admin Commands:
!twitch/!live add [twitchusername] -> subscribe to a user's stream
!twitch/!live remove [twitchusername] -> stop subscribing to a user's stream
!twitch/!live listen -> broadcast to this channel when any user is live.
!twitch/!live unlisten -> stop broadcasting in this channel when a user is live

User Commands:
!twitch/!live list -> tells all users Seth with notify about.

NOTE: Only users who have a role specified in the config.json->twitch->permission_groups will be able to run those commands.

## Removal
Delete all the files under the root. There are no system entanglements.


