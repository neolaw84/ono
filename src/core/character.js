// src/core/character.js 

const { GameObject } = require("./gameObject");
const { Inventory } = require("./inventory");

class Character extends GameObject {
  constructor(config) {
    super(config);
    this.inventory = new Inventory();
  }
}

class StandardCharacter extends Character {
    constructor(config) {
        super(config);
    }
}

// --- The Fluent Builder ---
class CharacterBuilder {
  constructor() {
    this.config = {};
  }
  withType(type) {
    this.config.type = type;
    return this;
  }
  withNumAttributesClass(NumAttributesClass) {
    this.config.NumAttributesClass = NumAttributesClass;
    return this;
  }
  withTxtAttributesClass(TxtAttributesClass) {
    this.config.TxtAttributesClass = TxtAttributesClass;
    return this;
  }
  withName(name) {
    this.config.name = name;
    return this;
  }
  withNumAttrs(numAttrs) {
    this.config.numAttrs = numAttrs;
    return this;
  }
  withTxtAttrs(txtAttrs) {
    this.config.txtAttrs = txtAttrs;
    return this;
  }
  build() {
    // Validation: Ensure all required fields have been set.
    const required = ['type', 'NumAttributesClass', 'TxtAttributesClass', 'name', 'numAttrs', 'txtAttrs'];
    for (const key of required) {
      if (this.config[key] === undefined) {
        throw new Error(`Cannot build StandardCharacter: Missing required property '${key}'.`);
      }
    }
    // return new StandardCharacter(this.config);
    return new this.config.type(this.config);
  }
}

/**
 * Factory function that returns a new CharacterBuilder instance.
 * @returns {CharacterBuilder}
 */
function createCharacterBuilder() {
    return new CharacterBuilder();
}

module.exports = { Character, StandardCharacter, createCharacterBuilder };