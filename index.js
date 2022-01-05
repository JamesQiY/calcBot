"use strict"
const discord = require(`discord.js`);
const tmi = require(`tmi.js`);
const processCalcInput = require(`./commands/calc/processCalcInput`);
const help = require(`./commands/help/help`);
const misc = require(`./commands/misc/misc`);
require("dotenv").config();

// global vars
const debug = false;
var discord_token = process.env.BOT_TOKEN;
if (debug) {
  discord_token = process.env.BOT_TOKEN_DEBUG;
}
const command_symbol = '!';


// init
// DISCORD BOT
const bot_intents = new discord.Intents();
bot_intents.add(
  discord.Intents.FLAGS.GUILDS,
  discord.Intents.FLAGS.GUILD_MESSAGES,
  discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  discord.Intents.FLAGS.DIRECT_MESSAGES);
const discord_client = new discord.Client({ intents: bot_intents });

// TWITCH BOT
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
};
const twitch_client = new tmi.client(opts);

// listeners
discord_client.on("ready", onConnectedDiscord);
discord_client.on("messageCreate", onMessageDiscord);

twitch_client.on('message', onMessageTwitch);
twitch_client.on('connected', onConnectedTwitch);


// listener functions
function onConnectedDiscord() {
  console.log("* DISCORD bot ready: " + discord_client.user.tag);
}
/**
 * bot sends message depending on command given
 * 
 * @param {discord.Message} message 
 * @returns {void}
 */
function onMessageDiscord(message) {
  if (message.author.bot) return false;
  try {
    // check if the first word is a command
    if (message.content.substring(0, command_symbol.length) == command_symbol) {
      let argv = message.content.trim().split(' ');
      var command = argv[0].substring(command_symbol.length);
      switch (command.toLowerCase()) {
        case "calc":
          argv.shift()
          let result = processCalcInput.getInfo(argv).embedObject;
          sendMessageDiscord(message.channel, command, result);
          break;
        case "calchelp":
        case "helpcalc":
          sendMessageDiscord(message.channel, command, help.getHelpEmbed());
          break;
        case "help":
          if (argv.length == 2 && argv[1] == 'calc') {
            sendMessageDiscord(message.channel, command, help.getHelpEmbed());
          }
          break;
        case "mancalc":
          sendMessageDiscord(message.channel, command, help.getManEmbed());
          break;
        case "dice":
          sendMessageDiscord(message.channel, command, "you rolled a " + misc.rollDice());
          break;
        case "coin":
          sendMessageDiscord(message.channel, command, "you flipped a " + misc.flipCoin());
          break;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * sends the a message given the channel object, command, and the message payload
 * @param {discord.TextBasedChannels} channel 
 * @param {string} command 
 * @param {(string|discord.MessageEmbed)} payload 
 * @returns {void}
 */
function sendMessageDiscord(channel, command = "", payload) {
  try {
    channel.send(payload);
    console.log(`* Discord: Executed ${command} command`);
  } catch (error) {
    console.log(error);
  }
}

/**
 * sends a message in the twitch chat depending on the chat command
 * @param {*} target 
 * @param {*} context 
 * @param {*} msg 
 * @param {*} self 
 * @returns {void}
 */
function onMessageTwitch(target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  try {
    // Remove whitespace from chat message
    let argv = msg.trim().split(' ');
    var command = argv[0].substring(command_symbol.length);
    console.log(command)
    switch (command) {
      case "calc":
        argv.shift()
        let result = processCalcInput.getInfo(argv).str;
        twitch_client.say(target, result);
        break;
      case "dice":
        const num = misc.rollDice();
        twitch_client.say(target, `You rolled a ${num}`);
        break;
      case "coin":
        const face = misc.flipCoin();
        twitch_client.say(target, `You flipped a ${face}`);
        break;
      case "help":
        twitch_client.say(target, help.genCalc());
        break;
    }
  } catch (error) {
    console.log(error);
  }
}

function onConnectedTwitch(addr, port) {
  console.log(`* TWITCH BOT ready. Connected to ${addr}:${port}`);
}


twitch_client.connect()
  .catch(err => console.log(err, 'twitch login failed'));

discord_client.login(discord_token)
  .catch(console.log('discord login failed'));

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});