const { Client, Intents, MessageEmbed, MessageAttachment } = require("discord.js");
const tmi = require('tmi.js');

const fetch = require("node-fetch");
const processCalcInput = require('./commands/calc/processCalcInput');
const help = require('./commands/help/help');
require("dotenv").config();

// global vars
const discord_token = process.env.BOT_TOKEN;
const command_symbol = '!';


// init
// DISCORD BOT
const bot_intents = new Intents();
bot_intents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  Intents.FLAGS.DIRECT_MESSAGES);
const discord_client = new Client({ intents: bot_intents });

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

// functions 
function getQuote() {
  return fetch("https://zenquotes.io/api/random")
    .then(res => {
      return res.json();
    })
    .then(data => {
      return data[0].q + "-" + data[0].a;
    })
}

// listeners
discord_client.on("ready", onConnectedDiscord);
discord_client.on("messageCreate", onMessageDiscord);

twitch_client.on('message', onMessageTwitch);
twitch_client.on('connected', onConnectedTwitch);


function onConnectedDiscord() {
  console.log("DISCORD bot ready: " + discord_client.user.tag);
}

// bot sends message depending on command given
// input: discord message object
// output: none
function onMessageDiscord(message) {
  if (message.author.bot) return false;
  try {
    // check if the first word is a command
    if (message.content.substring(0, command_symbol.length) == command_symbol) {
      let argv = message.content.trim().split(' ');
      var command = argv[0].substring(command_symbol.length);
      console.log(command);
      switch (command.toLowerCase()) {
        case "calc":
          argv.shift()
          let result = processCalcInput.getEmbed(argv);
          sendMessageDiscord(message, result);
          break;
        case "quote":
          "Quote: " + getQuote().then(quote => message.channel.send(quote));
          break;
        case "help":
          sendMessageDiscord(message, help.getHelpEmbed());
          break;
        case "mancalc":
          sendMessageDiscord(message, help.getManEmbed());
          break;
        default:
          message.channel.send("invalid command, try again.");
      }
      console.log(`* Discord: Executed ${command} command`);
    }
  } catch (error) {
    console.log(error);
  }
}

function sendMessageDiscord(message, payload) {
  try {
    message.channel.send(payload);
  } catch (error) {
    console.log(error);
  }
}

function onMessageTwitch(target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  try {
    // Remove whitespace from chat message
    let argv = msg.trim().split(' ');
    var command = argv[0].substring(command_symbol.length);
    switch (command) {
      case "calc":
        argv.shift()
        let result = processCalcInput.getString(argv);
        twitch_client.say(target, result);
        break;
      case "dice":
        const num = rollDice();
        twitch_client.say(target, `You rolled a ${num}`);
        break;
      case "help":
        twitch_client.say(target, help.genCalc());
        break;
      case "manCalc":
        twitch_client.say(target, help.genManCalc());
        break;
      default:
        twitch_client.say(target, "invalid command, try again.");
    }
  } catch (error) {
    console.log(error);
  }
}

function onConnectedTwitch(addr, port) {
  console.log(`* TWITCH BOT ready. Connected to ${addr}:${port}`);
}

function rollDice() {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}


try {
  discord_client.login(discord_token);
} catch (error) {
  console.log("discord login failed");
  console.log(error);
}
try {
  twitch_client.connect();
} catch (error) {
  console.log("twitch login failed");
  console.log(error);
}
