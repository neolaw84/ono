// src/demo_rulebook/character.js

const { createAttributesClass } = require("../core/attributes");
const { StandardCharacter } = require("../core/character");

// 1. Define the attribute sets for this rulebook
const CoreStats = createAttributesClass(['hp', 'maxHp', 'mp', 'maxMp', 'agi', 'str']);
const TxtStats = createAttributesClass(['class', 'attitude']);

// 2. Define the character archetypes for this rulebook
const Player = class extends StandardCharacter {};
const Orc = class extends StandardCharacter {};

// 3. Export everything so other files can use them
module.exports = {
    CoreStats,
    TxtStats,
    Player,
    Orc
};