const { iAttributes, createAttributesClass } = require("./core/attributes.js");
const { Entity, createEntityClass } = require("./core/entity.js");
const {
  iAction,
  Action,
  createActionClass,
  rollD20,
} = require("./core/action.js");
const { iONOConsole, Game } = require("./core/abstractions.js");
const {
  PhaseGraphBuilder,
  PermissionGraphBuilder,
  PhaseGraph,
  PermissionGraph,
} = require("./core/logic_builders.js");

module.exports = {
  // Attributes
  iAttributes,
  createAttributesClass,

  // Entity
  Entity,
  createEntityClass,

  // Action
  iAction,
  Action,
  createActionClass,
  rollD20,

  // Abstractions
  iONOConsole,
  Game, // Renamed from Encounter

  // Logic Builders & Graphs
  PhaseGraphBuilder,
  PermissionGraphBuilder,
  PhaseGraph,
  PermissionGraph,
};
