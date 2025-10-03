const { createAttributesClass } = require("../core/attributes");

// Define the numeric and text attributes for this specific rulebook.
const NumAttributes = createAttributesClass(["hp", "maxHp", "mp", "maxMp", "strength", "defense"]);
const TxtAttributes = createAttributesClass(["race", "class"]);

module.exports = { NumAttributes, TxtAttributes };