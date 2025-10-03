// src/core/prop.js

const { GameObject } = require("../core/gameObject");

class Prop extends GameObject {
  constructor(config) {
    super(config);
    // Props might have specific properties in the future, like 'isBreakable' or 'isLootable'.
  }
}

module.exports = { Prop };