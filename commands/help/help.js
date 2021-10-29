const {MessageEmbed, MessageAttachment } = require("discord.js");

const help_color = '#7fdbfa';
const man_color = '#ffba59';
const skull_image = new MessageAttachment('images/skull.png');


// generates the string for the description of help
function genDesc() {
  d = "Available commands (starting with !):\n";
  d += "**calc**: calculates wargroove unit damage given inputs\n";
  d += "**manCalc**: additional details for calc\n";
  d += "**help**: this page";
  return d;
}

// generates the string for the description of calc
function genCalc() {
  d = "given attacker name, defender name, their hp, crit, and the defender terrain, this calculates the range of damage that the attack does\n\n";
  d += "Usage: Attacker[hp] Defender[hp] [a=att_terrain] [d=][def_terrain] [c][ac] [dc]\n";
  d += "see manCalc for more information about the command";
  return d;
}

// generates the string for the description of mancalc
function genManCalc() {
  d = "";
  d += "Usage:", " Attacker[hp] Defender[hp] [a=att_terrain] [d=][def_terrain] [c][ac] [dc]\n"
  d += "Attacker[hp]:", " Attacking unit's name and an optional hp value (eg 'soldier90'). If no hp value is given, it is default 100\n"
  d += "Defender[hp]:", " Defending unit's name and an optional hp value (eg 'dog90'). If no hp value is given, it is default 100\n"
  d += "[a=att_terrain]:", " an optional argument for the attacker's terrain value.\n Terrain values: [-2 to 4].\n"
  d += "[d=][def_terrain]:", " an optional argument for the defender's terrain value.\n Terrain values: [-2 to 4].\n"
  d += "Can be used with the optional 'd=' prefix. \n"
  d += "If no terrain value is given, defender's terrain value is defaulted to 0\n"
  d += "[c][ac][dc]: optional value for indicating if the attack is a critical hit. c and ac for attacker crit, dc for defender crit\n\n"
  d += "Examples of using the command:", "\n"
  d += "!calc dog soldier   => 100hp dog vs 100hp soldier on terrain val 1. No crit.\n"
  d += "!calc dog100 soldier100 d=4   => 100hp dog vs 100hp soldier on terrain val 4. No crit.\n"
  d += "!calc dog50 soldier c  => 50hp dog vs 100hp soldier on terrain val 1. Crit.\n"
  d += "!calc dog soldier a=1 d=-2 c  => 100hp dog on terrain val 1 vs 100hp soldier on terrain val -2. Crit.\n"
  return d;
}

function addManCalc(embed) {
  embed.addField('```!calc```', genCalc())
  embed.addField("Usage:", " Attacker[hp] Defender[hp] [a=att_terrain] [d=][def_terrain] [c][ac] [dc]\n")
  embed.addField("Attacker[hp]:", " Attacking unit's name and an optional hp value (eg 'soldier90'). If no hp value is given, it is default 100\n")
  embed.addField("Defender[hp]:", " Defending unit's name and an optional hp value (eg 'dog90'). If no hp value is given, it is default 100\n")
  embed.addField("[a=att_terrain]:", " an optional argument for the attacker's terrain value.\n Terrain values: [-2 to 4].\n")
  embed.addField("[d=][def_terrain]:", " an optional argument for the defender's terrain value.\n Terrain values: [-2 to 4].\n"
    + "Can be used with the optional 'd=' prefix. \n"
    + "If no terrain value is given, defender's terrain value is defaulted to 0\n")
  embed.addField("[c][ac][dc]", "optional value for indicating if the attack is a critical hit. c and ac for attacker crit, dc for defender crit\n\n")
  embed.addField("Examples of using the command:", "\n"
    + "!calc dog soldier   => 100hp dog vs 100hp soldier on terrain val 1. No crit.\n"
    + "!calc dog100 soldier100 d=4   => 100hp dog vs 100hp soldier on terrain val 4. No crit.\n"
    + "!calc dog50 soldier c  => 50hp dog vs 100hp soldier on terrain val 1. Attacker Crit.\n"
    + "!calc dog soldier a=1 d=-2 c  => 100hp dog on terrain val 1 vs 100hp soldier on terrain val -2. Attacker Crit.\n")
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

  embed.addField('```!dice```', 'rolls a 6 sided die')
    .addField('```!coin```', 'flips a coin')
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
exports.genCalc = genCalc;
exports.genManCalc = genManCalc;