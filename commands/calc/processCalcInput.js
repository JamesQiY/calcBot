const AttackCalc = require('./damageCalc.js');
const Info = require('./info.json');
const {MessageEmbed, MessageAttachment} = require("discord.js");


const calc_color = '#fff545';
const sword_image = new MessageAttachment('images/sword.png');

// array of strings to keep track of error messages to output
var err = [];

// need to process something like
// soldier100 soldier50 ta=1 td=2 c=false 
// input is an array of parameters 
function getEmbed(input) {
  const valid = validate(input);
  let result = "";
  if (!valid.check || err.length > 0) { // if the input does not pass the checks
    result = formatCalcEmbed(result, err, valid);
  } else { // if the input does pass all the checks
    let attacker = valid.unit.attacker;
    let defender = valid.unit.defender;
    let has_crit = valid.unit.crit;
    let damage_calc = AttackCalc.processAttack(attacker, defender, has_crit);
    result = formatCalcEmbed(damage_calc, err, valid, has_crit);
  }
  return {embeds: [result], files: [sword_image]};
}

function formatCalcEmbed(calc, err=[], valid={check: false}, crit=false){
  // init for embed
  const embed = new MessageEmbed()
	.setColor(calc_color)
	.setTitle("Damage Calculation")
	// .addField('Title', 'Some value here', true)
  .setThumbnail('attachment://sword.png')
	.setTimestamp()
	.setFooter('use !!manCalc for more info. Bot by jams');

  if (err.length > 0 || !valid.check){ // calc had error
    embed.setDescription("error occured");
    for(const error_message of err){
      embed.addFields({name: 'ERROR:', value: error_message});
    }
  } else {
    const unit = valid.unit;
    const attacker = unit.attacker;
    const defender = unit.defender;
    let desc = "Calculated\n";
    if (crit) desc = desc + "**Critical hit**\n";
    desc += attacker.health + " hp " + attacker.name + " vs ";
    desc += defender.health + " hp " + defender.name;
    desc += " on terrain value of " + defender.terrain;

    
    embed.setDescription(desc);
    let battle = bolded(attacker.name) + " vs " + bolded(defender.name);
    let battle_damage = "Median: " + bolded(calc.median) + "\n"; 
    battle_damage = battle_damage + calc.low + " - " + calc.high; 
    embed.addFields({name: battle, value: battle_damage});
  }
  return embed;
}

function validate(input) {
  let check = true;
  let unit = {};
  // valid command requires at least 2 parameters
  if (input.length >= 2) {

    // unit checks
    let attacker = input[0];
    let defender = input[1];
    check = check && checkUnit(attacker, "attacker");
    check = check && checkUnit(defender, "defender");

    // terrain checks
    
    // regex matches 'a=' or 'd='(option) and then integers between '-2' to '4'
    let att_terrain_regex = /^(a=)(-[1-2]|[0-4])$/gm;
    let def_terrain_regex = /^(d=)?(-[1-2]|[0-4])$/gm;
    let att_terrain = "0";
    let def_terrain = "1";

    let terrain_matches = input.filter(parameter => att_terrain_regex.test(parameter));
    if (terrain_matches.length == 1){
      att_terrain = terrain_matches[0];
    }

    terrain_matches = input.filter(parameter => def_terrain_regex.test(parameter));
    if (terrain_matches.length == 1){
      def_terrain = terrain_matches[0];
    }

    check = check && checkTerrain(def_terrain, "defender");

    // crit check
    let crit = false;
    if (input.includes('c')) crit = true;

    if (check) {
      unit.attacker = processUnit(attacker, att_terrain);
      unit.defender = processUnit(defender, def_terrain);
      unit.crit = crit;
    }
  } else {
    check = false;
    err.push("there are fewer than 3 required arguments (attacker, defender, defender terrain)");
  }
  return {check, unit: unit};
}

// input: 
// unit: is the str input from user
// valid_units: an array that contains all valid unit names
// output: null if inputs not valid, else {name: x, health: y}
function checkUnit(unit, side) {
  const valid_units = Object.keys(Info.matrix);

  if (unit.search(/\d/) > 0) {
    let unit_name = unit.substring(0, unit.search(/\d/));
    unit_name = translate(unit_name);
    if (valid_units.includes(unit_name)) {
      let unit_health = unit.substring(unit.search(/\d/), unit.length);
      if (!isNaN(unit_health)) {
        if (parseInt(unit_health) >= 1 && parseInt(unit_health) <= 100) {
          // all checks passed, return as an object
          return true;
        }
        err.push(side + " health is not between 1-100");
      } else {
        err.push(side + " health is not valid");
      }
    } else {
      err.push(side + " name is wrong or does not exist");
    }
  } else if (valid_units.includes(translate(unit))) {
    return true;
  } else {
    err.push(side + " name is wrong or does not exist");
  }
  return false;
}

function translate(input_name){
  let name = input_name;
  switch(name.toLowerCase()){
    case 'sword': name = 'soldier'; break;
    case 'treb' : name = 'trebuchet'; break;
    case 'golem' : name = 'giant'; break;
    case 'knight' : name = 'cavalry'; break;
    case 'spear' : name = 'spearman'; break;
    case 'witch' : name = 'skyrider'; break;
    case 'harp' || 'harpoon': name = 'harpoonship'; break;
    case 'merfolk': name = 'amphibian'; break;
    case 'rifle': name = 'rifleman'; break;
    case 'village': name = 'building'; break;
    case 'co' || 'com': name = 'commander'; break;
  }
  return name;
}

function processUnit(unit, terrain_string) {
  let unit_name = "";
  let unit_health = 0;
  if (unit.search(/\d/) > 0) { // if you find a number after name
    unit_name =  translate(unit.substring(0, unit.search(/\d/)));
    unit_health = unit.substring(unit.search(/\d/), unit.length);
    unit_health = parseInt(unit_health);
  } else { // if you dont find a number, health = 100
    unit_name = translate(unit);
    unit_health = 100;
  }

  let unit_terrain = parseInt(terrain_string);
  return {name: unit_name, health: unit_health, terrain: unit_terrain};
}

function checkTerrain(terrain, side) {
  let index = terrain.indexOf('=') + 1;
  terrain = terrain.substring(index);

  if (!isNaN(terrain)) {
    if (parseInt(terrain) >= -2 && parseInt(terrain) <= 4) {
      return true;
    } else {
      err.push(side + " terrain is out of range. Usage: -2 to 4");
    }
  } else {
    err.push(side + "terrain is invalid. Usage: -2 to 4");
  }
  return false;
}

function bolded(string) { return "**" + string + "**"; }

exports.getEmbed = getEmbed;