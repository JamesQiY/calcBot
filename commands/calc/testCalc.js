const AttackCalc = require('./damageCalc.js');
const processInput = require('./processCalcInput.js');
const Info = require('./info.json');

function runTest(){
  let attacker = {
    name: "soldier",
    health: 100,
    terrain: 0,
    crit: 1.5
  }
  let defender = {
    name: "dog",
    health: 100,
    terrain: 4,
    crit: 1.5
  }
  let crit = false;

  // test 1
  console.log(AttackCalc.processAttack(attacker, defender, true));

  // // test 2
  // let teststring1 = "soldier75 dog60 1 4 c".split(' ');
  // console.log(process.processInput(teststring1));
  
  // test 3
  // let teststring2 = "soldier dog 1 4 c".split(' ');
  // console.log(process.processInput(teststring2));

  let teststring3 = "dog soldier 3".split(' ');
  console.log(processInput.processInput(teststring3));
  
}

runTest();