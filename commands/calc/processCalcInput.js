const AttackCalc = require('./damageCalc.js');
const Info = require('./info.json');
const { MessageEmbed, MessageAttachment } = require("discord.js");


const invalid_att_units = Info.invalid;
const valid_att_units = Object.keys(Info.matrix).filter(value => !invalid_att_units.includes(value));
const valid_def_units = Object.keys(Info.matrix);

console.log(valid_att_units, valid_def_units);

const calc_color = '#fff545';
const sword_image = new MessageAttachment('images/sword.png');

// array of strings to keep track of error messages to output
var err = [];

// need to process something like
// soldier100 soldier50 ta=1 td=2 c=false 
// input: an array of parameters as strings
// output: embed info object and string of the embed info object
function getInfo(input) {
  const valid = validate(input);
  let result = "";
  let string = "";
  if (!valid.check || err.length > 0) { // if the input does not pass the checks
    result = formatCalcEmbed(result, err, valid);
    err[0] ? string = err[0] : string = "invalid inputs. Please check again.";
    err = [];
  } else { // if the input does pass all the checks
    let attacker = valid.unit.attacker;
    let defender = valid.unit.defender;
    let has_crit = valid.unit.crit;
    let damage_calc = AttackCalc.processAttack(attacker, defender, has_crit);
    result = formatCalcEmbed(damage_calc, err, valid, has_crit);
    if (has_crit) string = string + "Critical hit! ";
    string += "Median: " + damage_calc.median + "; " + damage_calc.low + " - " + damage_calc.high + '.';
    string += "Terrain val = " + defender.terrain;
  }
  return { embedObject: { embeds: [result], files: [sword_image] }, str: string };
}

function getString(input) {
  let string = "";
  const valid = validate(input);
  if (!valid.check || err.length > 0) { // if the input does not pass the checks
    err[0] ? string = err[0] : string = "invalid inputs. Please check again.";
    err = [];
  } else { // if the input does pass all the checks
    let attacker = valid.unit.attacker;
    let defender = valid.unit.defender;
    let has_crit = valid.unit.crit;
    let damage_calc = AttackCalc.processAttack(attacker, defender, has_crit);
    if (has_crit) string = string + "Critical hit! ";
    string += "Median: " + damage_calc.median + "; " + damage_calc.low + " - " + damage_calc.high + '.';
    string += "Terrain val = " + defender.terrain;
  }
  return string;
}

function formatCalcEmbed(calc, err = [], valid = { check: false }, crit = false) {
  // init for embed
  const embed = new MessageEmbed()
    .setColor(calc_color)
    .setTitle("Damage Calculation")
    // .addField('Title', 'Some value here', true)
    .setThumbnail('attachment://sword.png')
    .setTimestamp()
    .setFooter('use !manCalc for more info. Bot by jams');

  if (err.length > 0 || !valid.check) { // calc had error
    embed.setDescription("error occured");
    for (const error_message of err) {
      embed.addFields({ name: 'ERROR:', value: error_message });
    }
    err = [];
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
    embed.addFields({ name: battle, value: battle_damage });
  }
  return embed;
}

// checks if the given input (array of str) is valid
// output: t/f
function validate(input) {
  let check = true;
  let unit = {};
  // valid command requires at least 2 parameters
  if (input.length >= 2) {

    // unit checks
    let attacker = input[0];
    let defender = input[1];
    check = check && checkUnit(attacker, true);
    check = check && checkUnit(defender, false);

    // terrain checks

    // regex matches 'a=' or 'd='(option) and then integers between '-2' to '4'
    let att_terrain_regex = /^(a=)(-[1-9]|[0-9])$/gm;
    let def_terrain_regex = /^(d=)?(-[1-9]|[0-9])$/gm;
    let att_terrain = "0";
    let def_terrain = "0";

    let terrain_matches = input.filter(parameter => att_terrain_regex.test(parameter));
    if (terrain_matches.length == 1) {
      let index = terrain_matches[0].indexOf('=') + 1;
      att_terrain = terrain_matches[0].substring(index);
      check = check && checkTerrain(att_terrain, "attacker");
    }

    terrain_matches = input.filter(parameter => def_terrain_regex.test(parameter));
    if (terrain_matches.length == 1) {
      let index = terrain_matches[0].indexOf('=') + 1;
      def_terrain = terrain_matches[0].substring(index);
      check = check && checkTerrain(def_terrain, "defender");
    }

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
  return { check, unit: unit };
}


// input: 
// unit: is the str input from user
// side: true for attacker, false for defender
// output: null if inputs not valid, else {name: x, health: y}
function checkUnit(unit_name, side = true) {
  let side_name = "";
  side ? side_name = "attacker" : side_name = "defender"

  let check = true;

  let unit_name_with_hp = unit_name.substring(0, unit_name.search(/\d/)).toLowerCase();
  unit_name_with_hp = translate(unit_name_with_hp);
  let unit_health = unit_name.substring(unit_name.search(/\d/), unit_name.length);

  // check for hp digits
  if (unit_name.search(/\d/) > 0) { // did find provided digits--------------------
    // check attacker name
    side && !checkUnitNameHelper(unit_name_with_hp, true)? check = false : check;
    // check defender name
    !side && !checkUnitNameHelper(unit_name_with_hp, false)? check = false : check;
    // check if hp is a number
    if (isNaN(unit_health)) {
      err.push(side_name + " health is not valid");
      check = false;
    }
    // check if hp is an int and between 1-100
    if (parseInt(unit_health) <= 0 || parseInt(unit_health) > 100) {
      err.push(side_name + " health is not between 1-100");
      check = false;
    }
  } else { // did not find digits ---------------------------------------------------
    // check attacker name
    side && !checkUnitNameHelper(unit_name, true) ? check = false : check;
    // check defender name
    !side && !checkUnitNameHelper(unit_name, false)? check = false : check;
  }
  return check;

  // if (unit_name.search(/\d/) > 0) {
  //   let unit_name = unit_name.substring(0, unit_name.search(/\d/)).toLowerCase();
  //   unit_name = translate(unit_name);
  //   if (valid_att_units.includes(unit_name)) {
  //     let unit_health = unit_name.substring(unit_name.search(/\d/), unit_name.length);
  //     if (!isNaN(unit_health)) {
  //       if (parseInt(unit_health) >= 1 && parseInt(unit_health) <= 100) {
  //         // all checks passed, return as an object
  //         return true;
  //       }
  //       err.push(side_name + " health is not between 1-100");
  //     } else {
  //       err.push(side_name + " health is not valid");
  //     }
  //   } else {
  //     err.push(side_name + " name is wrong or does not exist");
  //   }
  // } else if (valid_att_units.includes(translate(unit_name))) {
  //   return true;
  // } else {
  //   err.push(side_name + " name is wrong or does not exist");
  // }
  // return false;
}

// given unit name and side (true = attacker, false = defender), 
// return if unit name is valid within the valid lists

function checkUnitNameHelper(name, side) {
  let side_name = "";
  side ? side_name = "attacker" : side_name = "defender"
  let translated = translate(name);
  let check = true;
  if (side) { // attacker
    if (translated == 'hq') {
      err.push("hq can't attack silly 🤨");
      check = false;
    } else if (invalid_att_units.includes(translated)) {
      err.push(side_name + " cannot attack");
      check = false;
    } else if (!valid_att_units.includes(translated)) {
      err.push(side_name + " name is wrong or does not exist");
      check = false;
    }
  } else { // defender
    if (!valid_def_units.includes(translated)) {
      err.push(side_name + " name is wrong or does not exist");
      check = false
    }
  }
  return check;
}


// translates common unit names to keys that are used in info matrix
function translate(input_name) {
  let name = input_name.toLowerCase();
  switch (name) {
    case 'sword': name = 'soldier'; break;
    case 'treb': name = 'trebuchet'; break;
    case 'golem': name = 'giant'; break;
    case 'spear': name = 'spearman'; break;
    case 'witch': name = 'skyrider'; break;
    case 'harpy': name = 'aeronaut'; break;
    case 'sniper':
    case 'rifle': name = 'rifleman'; break;

    case 'merman':
    case 'mermen':
    case 'merfolk': name = 'amphibian'; break;
    case 'horse':
    case 'knight': name = 'cavalry'; break;

    case 'harp':
    case 'harpoon': name = 'harpoonship'; break;

    case 'village':
    case 'vill':
    case 'city': name = 'building'; break;

    case 'co':
    case 'com': name = 'commander'; break;
  }
  return name;
}


// given valid unit string input and its terrain string, return unit object
function processUnit(unit, terrain_string) {
  let unit_name = "";
  let unit_health = 0;
  if (unit.search(/\d/) > 0) { // if you find a number after name
    unit_name = translate(unit.substring(0, unit.search(/\d/)));
    unit_health = unit.substring(unit.search(/\d/), unit.length);
    unit_health = parseInt(unit_health);
  } else { // if you dont find a number, health = 100
    unit_name = translate(unit);
    unit_health = 100;
  }

  // special case for buildings. they always have 0 terrain value
  let unit_terrain = parseInt(terrain_string);
  if (unit_name == 'building' || unit_name == 'hq') {
    unit_terrain = 0;
  }

  return { name: unit_name, health: unit_health, terrain: unit_terrain };
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

exports.getInfo = getInfo;
exports.validate = validate;
exports.getString = getString;