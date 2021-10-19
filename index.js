const {Client, Intents} = require("discord.js");
const fetch = require("node-fetch");
const processCalcInput = require('./commands/calc/processCalcInput');
require("dotenv").config();

// global vars
const token = process.env.BOT_TOKEN;
const command_symbol = '!!';

// init
const bot_intents = new Intents();
bot_intents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES, 
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  Intents.FLAGS.DIRECT_MESSAGES);
const client = new Client({intents:bot_intents});

// functions 
function getQuote(){
  return fetch ("https://zenquotes.io/api/random")
    .then (res => {
      return res.json();
    })
    .then(data => {
      return data[0].q + "-" + data[0].a;
    })
}


// listeners

client.on("ready", () => {
  console.log("test hello world: " + client.user.tag);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return false; 
  
  // check if the first word is a command
  // commands begin with '!!'
  if (message.content.substring(0,2) == command_symbol){
    let argv = message.content.split(' ');
    if (argv[0].substring(2) == 'calc'){
      argv.shift()
      let result = processCalcInput.processInput(argv).result;
      let err = processCalcInput.processInput(argv).curr_err;
      for (let i = 0; i < err.length; i++){
        result = result + "\n" + err[i];
      }
      message.channel.send(result);
    }

    if (argv[0].substring(2) == 'quote'){
      "Quote: " + getQuote().then(quote => message.channel.send(quote));
    }
  }
});


client.login(token);