const {Client, Intents, MessageEmbed, MessageAttachment} = require("discord.js");
const fetch = require("node-fetch");
const processCalcInput = require('./commands/calc/processCalcInput');
const help = require('./commands/help/help');
require("dotenv").config();

// global vars
const token = process.env.BOT_TOKEN;
const command_symbol = '!';


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

function embedBuilder(title='', desc=""){
  const embed = new MessageEmbed()
	.setColor('#ff4545')
	.setTitle(title)
	.setDescription(desc)
	// .addField('Title', 'Some value here', true)
  .setThumbnail('attachment://skull.png')
	.setTimestamp()
	.setFooter('Some footer text here');
  return embed;
}

// listeners

client.on("ready", () => {
  console.log("test hello world: " + client.user.tag);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return false; 
  
  // check if the first word is a command
  // commands begin with '!!'
  if (message.content.substring(0,command_symbol.length) == command_symbol){
    let argv = message.content.split(' ');
    var command = argv[0].substring(command_symbol.length);
    console.log("processing " + command);
    switch(command){
      case "calc":
        argv.shift()
        let result = processCalcInput.getEmbed(argv);
        message.channel.send(result);
        break;
      case "quote":
        "Quote: " + getQuote().then(quote => message.channel.send(quote));
        break;
      case "help":
        message.channel.send(help.getHelpEmbed());
        break;
      case "manCalc":
        message.channel.send(help.getManEmbed());
        break;
      default:
        message.channel.send("invalid command, try again.");
    }
  }
});


client.login(token);