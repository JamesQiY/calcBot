"use strict"
const AttackCalc = require('./damageCalc.js');
const processInput = require('./processCalcInput.js');
const Info = require('./info.json');

let err = [];

function genUnit(name, health=100, terrain=0, crit=1){
  return {name: name, health: health, terrain: terrain, crit: crit}
}

function commonValidateTest(){
  let pass = true;
  let teststrings = [
    {str:"soldier100 dog100", check : true},
    {str:"soldier dog", check : true},
    {str:"soldier dog 0", check : true},
    {str:"soldier dog -1", check : true},
    {str:"soldier dog 4", check : true},
    {str:"soldier dog -3", check : false},
    {str:"soldier dog 5", check : false},
    {str:"soldier0 dog0.1 ", check : false},
    {str:"soldier dog0", check : false},
    {str:"soldierdog 0", check : false},
    {str:"soldier50 dog50 0", check : true},
    {str:"soldier dog 0 c", check : true},
    {str:"sword sword 0", check : true},
    {str:"sword dog a=1", check : true},
    {str:"sword dog a=1 d=1", check : true},
    {str:"sword dog a=0 d=-1", check : true},
    {str:"sword dog a=1 d=5", check : false},
    {str:"sword dog a=6 d=1", check : false},
    {str:"sword dog a=6 d=1 c", check : false},
    {str:"dog25 co15 d=4 a=2 c", check : true},
    {str:"dog balloon", check : false},
    {str:"building soldier", check : false},
    {str:"city soldier", check : false},
    {str:"hq soldier", check : false},
    {str:"dog dragon", check : false},
    {str:"balloon soldier", check : false},
    {str:"ballista building", check : true},
    {str:"knight hq c", check : true},
    {str:"treb balloon", check : false},
  ]
  var test;
  var str;
  for (test of teststrings){
    str = test.str.split(' ');
    if (test.check != processInput.validate(str).check){
      err.push(str);
      pass = false;
    }
  }
  return pass;
}

function basicTest(){
  let attacker = genUnit("aeronaut", 100, 0, 1.5);
  let defender = genUnit("mage", 100, 0, 1.5)

  console.log(AttackCalc.processFull(attacker, defender, true, false));
  console.log(AttackCalc.processFull(attacker, defender, true, true));
}

function runTest(){
  basicTest();
  let test1 = commonValidateTest();
  console.log(test1, err);
}

runTest();