const { Client, Intents, MessageEmbed, MessageAttachment } = require("discord.js");

const help_color = '#7fdbfa';
const man_color = '#ffba59';
const skull_image = new MessageAttachment('images/skull.png');

function genDesc() {
  d = "Available commands (starting with !):\n";
  d += "**quote**: gives a random quote\n";
  d += "**calc**: calculates wargroove unit damage given inputs\n";
  d += "**manCalc**: additional details for calc\n";
  d += "**help**: this page";
  console.log(typeof d);
  return d;
}

function genCalc() {
  d = "given attacker name, defender name, their hp, crit, and the defender terrain, this calculates the range of damage that the attack does\n\n";
  d += "Usage: Attacker[hp] Defender[hp] [a=att_terrain] [d=][def_terrain] [c]\n";
  d += "see manCalc for more information about the command";
  return d;
}

function addManCalc(embed) {
  embed.addField('```!calc```', genCalc())
  embed.addField("Usage:", " Attacker[hp] Defender[hp] [a=att_terrain] [d=][def_terrain] [c]\n")
  embed.addField("Attacker[hp]:", " Attacking unit's name and an optional hp value (eg 'soldier90'). If no hp value is given, it is default 100\n")
  embed.addField("Defender[hp]:", " Defending unit's name and an optional hp value (eg 'dog90'). If no hp value is given, it is default 100\n")
  embed.addField("[a=att_terrain]:", " an optional argument for the attacker's terrain value.\n Terrain values: [-2 to 4]. Unused for now, but used for future implementations. Example: a=1\n")
  embed.addField("[d=][def_terrain]:", " an optional argument for the defender's terrain value.\n Terrain values: [-2 to 4].\n"
    + "Can be used with the optional 'd=' prefix. \n"
    + "If no terrain value is given, defender's terrain value is defaulted to 1\n"
    + "[c]: optional value for indicating if the attack is a critical hit.\n\n")
  embed.addField("Examples of using the command:", "\n"
    + "!calc dog soldier   => 100hp dog vs 100hp soldier on terrain val 1. No crit.\n"
    + "!calc dog100 soldier100 d=4   => 100hp dog vs 100hp soldier on terrain val 4. No crit.\n"
    + "!calc dog50 soldier c  => 50hp dog vs 100hp soldier on terrain val 1. Crit.\n"
    + "!calc dog soldier a=1 d=-2 c  => 100hp dog on terrain val 1 vs 100hp soldier on terrain val -2. Crit.\n")
  return embed;
}


function getHelpEmbed() {
  const description = genDesc();
  const embed = new MessageEmbed()
    .setColor(help_color)
    .setTitle("help")
    .setDescription(description)
    .setThumbnail('attachment://skull.png')
    .setTimestamp()
    .setFooter('bot made by jams#4819');

  embed.addField('```!quote```', 'gives a random quote from a random quoter (duh)')
    .addField('```!calc```', genCalc())
    .addField('```!manCalc```', "gives the manual page of the !calc command");
  return { embeds: [embed], files: [skull_image] };
}

function getManEmbed() {
  const embed = new MessageEmbed()
    .setColor(man_color)
    .setTitle("!Calc Command manual page")
    .setDescription("Details of the command")
    .setThumbnail('attachment://skull.png')
    .setTimestamp()
    .setFooter('bot made by jams#4819');
  addManCalc(embed);
  return { embeds: [embed], files: [skull_image] };
}

exports.getHelpEmbed = getHelpEmbed;
exports.getManEmbed = getManEmbed;