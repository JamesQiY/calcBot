const Info = require('./info.json');

// input
// attacker, defender: objects that contain {name: str, health: int, tile: str}
// critical: t/f representing if the attack is a crit
// weather: valid inputs are sunny, rainy, and windy
// rng: auto true, used for later on, does not do anything at the moment
//
// output: an object that contains the low and high rolls of the final damage


function processAttack (attacker, defender, critical=false, weather='sunny', rng=true) {
  const rand_low = -5;
  const rand_high = 5;
  const attacker_health = attacker.health / 100;
  const defender_health = defender.health / 100;

  const power = getDamageInfo(attacker, defender);
  const weather_multi = getWeatherMultiplier(weather);
  const crit_multi = critical ? getCritMuliplier(attacker) : 1;
  const terrain = defender.terrain;
  const terrain_multi = Number.isInteger(terrain) && terrain <= 4 && terrain >= -2 ? terrain / 10 : 0;
  let damage = {low:0, high:0, median: 0};
  if (power == 0){
    return damage;
  }
  
  // used 
  let def_multi = (1 - (defender_health * terrain_multi));
  if (terrain_multi < 0) def_multi = (1 - (terrain_multi));

  
  damage.low = ((power * crit_multi * weather_multi) + rand_low);
  damage.low = damage.low * attacker_health * def_multi;
  damage.low = damage.low <= 0 ? 0: damage.low.toFixed(2);

  damage.high = ((power * crit_multi * weather_multi) + rand_high)
  damage.high = damage.high *  attacker_health * def_multi;
  damage.high = damage.high <= 0 ? 0: damage.high.toFixed(2);

  damage.median = ((power * crit_multi * weather_multi));
  damage.median = damage.median *  attacker_health * def_multi;
  damage.median = damage.median <= 0 ? 0: damage.median.toFixed(2);
  return damage;
}

function processFull (attacker, defender, att_critical=false ,def_critical=false, weather='sunny', rng=true){
  let attack = processAttack (attacker, defender, att_critical);

  let defender_copy = defender;
  let health_reset = defender_copy.health;
  let counter_low_damage = 0;
  let counter_high_damage = 0;
  let counter_median_damage = 0;
  
  let def_health_low = defender_copy.health - attack.high;
  let def_health_high = defender_copy.health - attack.low;
  let def_health_median = defender_copy.health - attack.median;
  // calc low
  if (def_health_low > 0){
    defender_copy.health = def_health_low;
    counter_low_damage = Math.max(0, processAttack(defender_copy, attacker, def_critical, weather, rng).low);
  }

  // calc high
  defender_copy.health = health_reset;
  if (def_health_high > 0){
    defender_copy.health = def_health_high;
    counter_high_damage = Math.max(0, processAttack(defender_copy, attacker, def_critical, weather, rng).high);
  }

  // calc median
  defender_copy.health = health_reset;
  if (def_health_median > 0){
    defender_copy.health = def_health_median;
    counter_median_damage = Math.max(0, processAttack(defender_copy, attacker, def_critical).median);
  }
  defender_copy.health = health_reset;
  let counter = {low : counter_low_damage, high: counter_high_damage, median: counter_median_damage};
  return {"attack" : attack, "counter": counter};
}

// returns the integer representing attacker vs defender matrix values
// input: attacker, defender: objects that contain {name: str, health: int, tile: str}
// output: damage from matrix +5 as int if input valid, else 0
function getDamageInfo(attacker, defender){
  let data = getDamageRaw(attacker,defender)
  if (data != null) return data;
  else return 0;
}

function getDamageRaw(attacker,defender){
  let defender_name = equivalent_values(defender.name);
  if (Info.matrix[attacker.name]) {
    //  if its not null and exists in list
    if (Info.matrix[attacker.name].damage[defender_name])
      return Info.matrix[attacker.name].damage[defender_name];
  }
  return null;
}

// returns an equivalent damage value in info matrix given a name
function equivalent_values(name){
  let eq = name;
  switch (name){
    case 'vine': 
      eq = "building";
      break;
    case 'gate':
      eq = 'hq';
      break;
  }
  return eq;
}

// returns the float representing the attacker's crit multiplier
// input: attacker: object that contain {name: str, health: int, tile: str}
// output: crit multiplier as float if input valid, else 1
function getCritMuliplier(attacker){
  if (Info.matrix[attacker.name]) {
    return Info.matrix[attacker.name].crit;
  }
  return 1.0;
}

function getWeatherMultiplier(weather){
  let multiplier = 1;
  if (weather.toLowerCase() == "rainy"){
    multiplier = 0.8;
  } else if (weather.toLowerCase() == "windy"){
    multiplier = 1.2;
  }
  return multiplier;
}

exports.processAttack = processAttack;
exports.processFull = processFull;
exports.getDamageRaw = getDamageRaw;