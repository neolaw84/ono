// src/core/world.js
const { Entity } = require("./entity.js");
const { Encounter } = require("./abstractions.js");

class World {
  constructor() {
    // State properties
    this.player = null;
    this.currentEncounter = null;
    this.allEntities = new Map();
    this.gamePhase = "__start__";

    // Injected dependencies
    this.console = null;
    this.formatter = null;
    this.gamePhaseManager = null;
    this.player = null;
  }

  initialize(consoleInstance, formatterInstance, gamePhaseManager) {
    this.console = consoleInstance;
    this.formatter = formatterInstance;
    this.gamePhaseManager = gamePhaseManager;

    // Pass rule-specific text to the console
    this.console.plotEssentials = this.gamePhaseManager.plotEssentials;
    this.console.authorsNote = this.gamePhaseManager.authorsNote;
  }

  // --- State Management Methods ---

  createPlayerCharacter(config) {
    if (!this.gamePhaseManager)
      throw new Error("GamePhaseManager not initialized.");
    const PlayerClass = this.gamePhaseManager.Entities.Player;
    if (!PlayerClass)
      throw new Error("Player class not defined in rulebook entities.");

    this.player = new PlayerClass(config);
    this.allEntities.set(this.player.uid, this.player);
    return this.player;
  }

  startNewEncounter() {
    if (!this.gamePhaseManager)
      throw new Error("GamePhaseManager not initialized.");

    const { enemies, turnOrder } =
      this.gamePhaseManager.getOrCreateEncounter(this);

    enemies.forEach((enemy) => this.allEntities.set(enemy.uid, enemy));

    this.currentEncounter = new Encounter(enemies);
    this.currentEncounter.turnOrder = turnOrder;

    this.console.bufferEvent("plot", this.formatter.format("encounterStart"));
    const turnText = this.formatter.format("turnStart", {
      entity: this.getEntityForThisTurn(),
    });
    this.console.bufferEvent("battle", turnText);
  }

  updateTurn() {
    if (!this.currentEncounter) return;
    const nextIndex =
      (this.currentEncounter.currentTurnIndex + 1) %
      this.currentEncounter.turnOrder.length;
    this.currentEncounter.currentTurnIndex = nextIndex;
    const nextEntity = this.getEntityForThisTurn();

    const turnText = this.formatter.format("turnStart", { entity: nextEntity });
    this.console.bufferEvent("battle", turnText);
  }

  getEntityForThisTurn() {
    if (!this.currentEncounter) return null;
    return this.currentEncounter.turnOrder[
      this.currentEncounter.currentTurnIndex
    ];
  }

  // --- Pass-Through Methods to Logic Manager ---

  updateGamePhase() {
    this.gamePhaseManager.updateGamePhase(this);
  }
  isActionAllowedNow(action, actioner, actionee) {
    return this.gamePhaseManager.isActionAllowedNow(
      action,
      actioner,
      actionee,
      this,
    );
  }
  determineEnemyAction(enemy) {
    return this.gamePhaseManager.determineEnemyAction(enemy, this);
  }
  getAllActionsAllowed(player) {
    return this.gamePhaseManager.getAllActionsAllowed(player, this);
  }
  showPlayerHUD(actionChoices) {
    this.gamePhaseManager.showPlayerHUD(actionChoices, this);
  }

  // --- Singleton Pattern ---

  static getInstance() {
    if (!World.instance) {
      World.instance = new World();
    }
    return World.instance;
  }

  // --- Serialization ---

  toData() {
    if (!this.player) return null;
    return {
      gamePhase: this.gamePhase,
      playerUid: this.player.uid,
      encounter: this.currentEncounter ? this.currentEncounter.toData() : null,
      entities: Array.from(this.allEntities.values()).map((e) => ({
        type: e.type, // Store entity type for reconstruction
        data: e.toData(),
      })),
      nextUid: Entity.nextUid,
    };
  }

  static fromData(data, consoleInstance, formatterInstance, gamePhaseManager) {
    const world = World.getInstance();
    world.initialize(consoleInstance, formatterInstance, gamePhaseManager);

    if (!data) return world;

    Entity.nextUid = data.nextUid || 0;

    // 1. Reconstruct all entities
    if (data.entities) {
      for (const entityShell of data.entities) {
        const EntityClass = gamePhaseManager.Entities[entityShell.type];
        if (EntityClass) {
          const entity = EntityClass.fromData(entityShell.data);
          world.allEntities.set(entity.uid, entity);
        }
      }
    }

    // 2. Restore core state properties
    world.player = world.allEntities.get(data.playerUid);
    world.gamePhase = data.gamePhase;

    if (data.encounter) {
      world.currentEncounter = Encounter.fromData(
        data.encounter,
        world.allEntities,
      );
    } else {
      world.currentEncounter = null;
    }

    return world;
  }
}

module.exports = { World };
