// src/ono/rules.js
const {
  createAttributesClass,
  createEntityClass,
  createActionClass,
  PhaseGraphBuilder,
  PermissionGraphBuilder,
} = require("../core.js");

// --- Attribute Definitions ---
const CoreStats = createAttributesClass(["hp", "mp", "strength", "defense"]);
const StatusEffects = createAttributesClass(["poisoned", "stunned", "burning"]);

// --- Entity Definitions ---
const Player = createEntityClass({
  type: "Player",
  NumAttributesClass: CoreStats,
  TxtAttributesClass: StatusEffects,
});
const Orc = createEntityClass({
  type: "Orc",
  NumAttributesClass: CoreStats,
  TxtAttributesClass: StatusEffects,
});
const Elf = createEntityClass({
  type: "Elf",
  NumAttributesClass: CoreStats,
  TxtAttributesClass: StatusEffects,
});

// --- Action Definitions ---
const HeavyStrike = createActionClass({
  name: "Heavy Strike",
  type: "Attack",
  allowedActioners: [Player, Orc],
  allowedActionees: [Player, Orc, Elf],
  cost: new CoreStats({ mp: 1 }),
  actionerMod: new CoreStats({ strength: 0.5 }),
  actioneeMod: new CoreStats({ defense: 0.2 }),
  effectVal: new CoreStats({ hp: -2 }),
  effectType: "add",
  effectMask: new CoreStats({ hp: true }),
});

const BasicAttack = createActionClass({
  name: "Basic Attack",
  type: "Attack",
  allowedActioners: [Orc],
  allowedActionees: [Player],
  cost: new CoreStats({}),
  actionerMod: new CoreStats({ strength: 0.3 }),
  actioneeMod: new CoreStats({ defense: 0.3 }),
  effectVal: new CoreStats({ hp: -1 }),
  effectType: "add",
  effectMask: new CoreStats({ hp: true }),
});

// --- Graph Definitions ---
const phaseGraph = new PhaseGraphBuilder()
  .addPhase("combat")
  .addTransition("__start__", "combat", () => true)
  .addTransition(
    "combat",
    "__end__",
    (world) =>
      world.gamePhaseManager.isPlayerDefeated(world) ||
      world.gamePhaseManager.areAllEnemiesDefeated(world),
  )
  .build();

const permissionGraph = new PermissionGraphBuilder()
  .addPermission(Player, Orc, "combat", HeavyStrike)
  .addPermission(Orc, Player, "combat", BasicAttack)
  .build();

// --- Exports ---
const Entities = { Player, Orc, Elf };
const Actions = { HeavyStrike, BasicAttack };

module.exports = {
  Entities,
  Actions,
  phaseGraph,
  permissionGraph,
};
