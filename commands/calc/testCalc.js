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
  console.log(AttackCalc.processAttack(attacker, defender, false));
  console.log(AttackCalc.processAttack({}, defender, false));
  console.log(AttackCalc.processAttack({}, {}, false));

  let teststrings = [
    "soldier100 dog100",
    "soldier dog",
    "soldier dog 0",
    "soldier dog -1",
    "soldier dog -3",
    "soldier dog 4",
    "soldier dog 5",
    "soldier0 dog0.1 ",
    "soldier dog0",
    "soldierdog 0",
    "soldier50 dog50 0",
    "soldier dog 0 c",
    "sword sword 0",
    "sword dog a=1",
    "sword dog a=1 d=1",
    "sword dog a=6 d=1",
    "sword dog a=1 d=5",
    "sword dog a=0 d=-1",
    "sword dog a=6 d=1 c",
    "dog25 co15 d=4 a=2 c",
    "dog soldier"
  ]

  for (test of teststrings){
    const string = test;
    test = test.split(' ');
    console.log(string, processInput.validate(test));
  }
}

runTest();