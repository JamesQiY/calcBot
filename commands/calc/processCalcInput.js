"use strict"
const AttackCalc = require('./damageCalc.js');
const Info = require('./info.json');
const { MessageEmbed, MessageAttachment, DiscordAPIError } = require("discord.js");

// unit lists
const invalid_att_units = Info.invalid;
const valid_att_units = Object.keys(Info.matrix).filter(value => !invalid_att_units.includes(value));
const valid_def_units = Info.unitList;

const calc_color = '#fff545';
const sword_image = new MessageAttachment('images/sword.png');

// err array : array of strings of error messages
var err = [];

/**
 * processes parameters of calc command and returns embed object and string representation
 * @param {string[]} input 
 * @returns {{embedObject: MessageEmbed, str: string}}
 */
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
    let att_crit = valid.unit.att_crit;
    let def_crit = valid.unit.def_crit;
    let damage_calc = AttackCalc.processFull(attacker, defender, att_crit, def_crit);
    result = formatCalcEmbed(damage_calc, err, valid, att_crit, def_crit);
    if (att_crit) string = string + "Critical hit! ";
    string += "Median: " + damage_calc.attack.median + "; " + damage_calc.attack.low + " - " + damage_calc.attack.high + '.';
    string += "Terrain val = " + defender.terrain;
  }
  return { embedObject: { embeds: [result], files: [sword_image] }, str: string };
}

// 
// input:
// calc = object that contains median, low, high damage of the attack
// err = array of error messages
// valid = contains the unit and terrain information
// crit = if the attack is crit or not
// output:
// discord embed object;
/**
 * given the information of the input process, return the appropriate discord embed object
 * @param {Object} calc damage info object returned from {@link AttackCalc.processFull} function
 * @param {string[]} err current error array
 * @param {object} valid processed and cleaned string inputs as objects
 * @param {boolean} att_crit 
 * @param {boolean} def_crit 
 * @returns {MessageEmbed}
 */
function formatCalcEmbed(calc, err = [], valid = { check: false }, att_crit=false, def_crit=false) {
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
    desc += attacker.health + " hp " + attacker.name + " vs ";
    desc += defender.health + " hp " + defender.name + "\n";
    desc += attacker.terrain + " terrain vs "+ defender.terrain + " terrain";

    embed.setDescription(desc);

    let battle = bolded(attacker.name) + (att_crit ? " CRIT" : "") + " attack";
    let battle_damage = "";
    battle_damage += "Median: " + bolded(calc.attack.median) + "\n";
    battle_damage += calc.attack.low + " - " + calc.attack.high;
    embed.addFields({ name: battle, value: battle_damage, inline: true });

    battle = bolded(defender.name) + (def_crit ? " CRIT" : "") + " counter";
    battle_damage = "";
    battle_damage += "Median: " + bolded(calc.counter.median) + "\n";
    battle_damage += calc.counter.low + " - " + calc.counter.high;
    embed.addFields({ name: battle, value: battle_damage, inline: true  });
  }
  return embed;
}

/**
 * checks if the given input (array of str) is valid and returns cleaned inputs if all are valid
 * @param {string[]} input array of parameters
 * @returns {{boolean, object}} object contains the attacker and defender objects
 */
function validate(input) {
  let check = true;
  let att_crit = false;
  let def_crit = false;
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
    let att_terrain_regex = /^(a=)(-\d+|\d+)$/gm;
    let def_terrain_regex = /^(d=)?(-\d+|\d+)$/gm;
    let att_terrain = "0";
    let def_terrain = "0";

    let terrain_matches = input.filter(parameter => att_terrain_regex.test(parameter));
    if (terrain_matches.length == 1) {
      let index = terrain_matches[0].indexOf('=') + 1;
      att_terrain = terrain_matches[0].substring(index);
      check = check && checkTerrain(att_terrain, true);
    }

    terrain_matches = input.filter(parameter => def_terrain_regex.test(parameter));
    if (terrain_matches.length == 1) {
      let index = terrain_matches[0].indexOf('=') + 1;
      def_terrain = terrain_matches[0].substring(index);
      check = check && checkTerrain(def_terrain, false);
    }

    // crit check
    if (input.includes('c') || input.includes('ac')) att_crit = true;
    if (input.includes('dc')) def_crit = true;

    if (check) {
      unit.attacker = processUnit(attacker, att_terrain);
      unit.defender = processUnit(defender, def_terrain);
      if (AttackCalc.getDamageRaw(unit.attacker, unit.defender) == null){
        check = false;
        err.push("the attacker cannot attack the defender");
      }
      unit.att_crit = att_crit;
      unit.def_crit = def_crit;
    }
  } else {
    check = false;
    err.push("there are fewer than 2 required arguments (attacker, defender)");
  }
  return { check, unit: unit };
}

/**
 * checks if the unit given are valid
 * @param {string} unit_name 
 * @param {boolean} side true = attacker , false = defender
 * @returns {boolean}
 */
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
}


/**
 * helper of {@link checkUnit} function. Check unit is in valid unit lists
 * @param {string} name 
 * @param {boolean} side true = attacker , false = defender
 * @returns {boolean}
 */
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


/**
 * translates common names to names in damage matrix
 * @param {string} input_name 
 * @returns {string} alternate name
 */
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


/**
 * given valid unit string input and its terrain string, return unit object
 * @param {string} unit 
 * @param {string} terrain_string 
 * @returns { name: string, health: number, terrain: number}
 */
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
  if (unit_name == 'building' || unit_name == 'hq' || unit_name == 'gate') {
    unit_terrain = 0;
  }

  return { name: unit_name, health: unit_health, terrain: unit_terrain };
}

/**
 *  check if the given terrain is an int between -2 to 4
 * @param {*} terrain 
 * @param {boolean} side true = attacker , false = defender
 * @returns {boolean}
 */
function checkTerrain(terrain, side) {
  // format of valid terrain can be a single int or 'd=[terrain_value]'
  let index = terrain.indexOf('=') + 1;
  terrain = terrain.substring(index);
  let side_name = "";
  side ? side_name = "attacker" : side_name = "defender"

  if (!isNaN(terrain)) {
    if (parseInt(terrain) >= -2 && parseInt(terrain) <= 4) {
      return true;
    } else {
      err.push(side_name + " terrain is out of range. Usage: -2 to 4");
    }
  } else {
    err.push(side_name + "terrain is invalid. Usage: -2 to 4");
  }
  return false;
}

function bolded(string) { return "**" + string + "**"; }

exports.getInfo = getInfo;
exports.validate = validate;