"use strict"

function rollDice() {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

function flipCoin() {
  let face = "heads";
  Math.floor(Math.random() * 2) + 1 == 1 ? face = "tails" : face;
  return face;
}

exports.rollDice = rollDice;
exports.flipCoin = flipCoin;