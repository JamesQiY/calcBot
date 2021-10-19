const AttackCalc = require('./damageCalc.js');
const Info = require('./info.json');

// array of strings to keep track of error messages to output
var err = [];

// need to process something like
// soldier100 soldier50 ta=1 td=2 c=false 
// input is an array of parameters 
function processInput(input) {
  var valid = validate(input);
  let result = {};
  let curr_err = []
  if (!valid.check) { // if the input does not pass the checks
    for (let i = 0; i < err.length; i++) {
      console.log(err[i]);
    }
    result = processResults(result);
    curr_err = err;
    err = []
  } else { // if the input does pass all the checks
    let attacker = valid.output.attacker;
    let defender = valid.output.defender;
    let has_crit = valid.output.crit;
    result = AttackCalc.processAttack(attacker, defender, has_crit);
    result = processResults(result, attacker, defender);
  }
  return {result, curr_err};
}

function validate(input) {
  let check = true;
  let output = {};
  // valid command requires at least 4 parameters
  if (input.length >= 4) {

    // unit checks
    let attacker = input[0];
    let defender = input[1];
    check = check && checkUnit(attacker, "attacker");
    check = check && checkUnit(defender, "defender");

    // terrain checks
    let att_terrain = input[2];
    let def_terrain = input[3];

    check = check && checkTerrain(att_terrain, "attacker");
    check = check && checkTerrain(def_terrain, "defender");

    // crit check
    let crit = false;
    if (input.includes('c')) crit = true;

    if (check) {
      output.attacker = processUnit(attacker, att_terrain);
      output.defender = processUnit(defender, def_terrain);
      output.crit = crit;
    }
  }

  return {check, output};
}

// input: 
// unit: is the str input from user
// valid_units: an array that contains all valid unit names
// output: null if inputs not valid, else {name: x, health: y}
function checkUnit(unit, side) {
  const valid_units = Object.keys(Info.matrix);

  if (unit.search(/\d/) > 0) {
    let unit_name = unit.substring(0, unit.search(/\d/));
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
  } else if (valid_units.includes(unit)) {
    return true;
  }
  return false;
}

function processUnit(unit, terrain_string) {
  let unit_name = "";
  let unit_health = 0;
  if (unit.search(/\d/) > 0) { // if you find a number after name
    unit_name = unit.substring(0, unit.search(/\d/));
    unit_health = unit.substring(unit.search(/\d/), unit.length);
    unit_health = parseInt(unit_health);
  } else { // if you dont find a number, health = 100
    unit_name = unit;
    unit_health = 100;
  }

  let unit_terrain = parseInt(terrain_string);
  return {name: unit_name, health: unit_health, terrain: unit_terrain};
}

function checkTerrain(terrain, side) {
  if (!isNaN(terrain)) {
    if (parseInt(terrain) >= -2 && parseInt(terrain) <= 4) {
      return true;
    } else {
      err.push(side + " terrain is invalid. Usage: -2 to 4");
    }
  } else {
    err.push(side + "terrain is invalid. Usage: -2 to 4");
  }
  return false;
}

// result: valid = {low:, high:}, invalid: {}
function processResults(result, attacker={}, defender={}){
  output_string = "";
  if (Object.keys(result).length == 0){
    output_string = "The inputs had an issue, check your inputs again";
    printMan();
  } else {
    output_string = attacker.name + " will do " + result.low + " to " + result.high + " against " + defender.name + ". Median " + result.median; 
  }
  return output_string;
}

function printMan(){
  man_string = "Usage: attacker[hp] defender[hp] att_terrain def_terrain [c]\n";
  man_string = man_string + "attacker[hp]: the attacking unit's name and its hp. if no hp is given, 100 is used.";
  return man_string;
}

exports.processInput = processInput;