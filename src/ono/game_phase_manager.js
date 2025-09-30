// src/ono/game_phase_manager.js

const {
  Entities,
  Actions,
  phaseGraph,
  permissionGraph,
  plotEssentials,
  authorsNote,
} = require("./rules.js");

class GamePhaseManager {
  constructor() {
    // Load static rule assets
    this.Entities = Entities;
    this.Actions = Actions;
    this.phaseGraph = phaseGraph;
    this.permissionGraph = permissionGraph;
    this.plotEssentials = plotEssentials;
    this.authorsNote = authorsNote;
  }

  manageGameFlow(world) {
    // If there's no active encounter, we need to decide what to do next.
    if (!world.currentEncounter) {
      // First, check for a definitive game-over condition.
      if (this.isPlayerDefeated(world)) {
          return { gameShouldEnd: true, reason: "\n--- You have been defeated. Game Over. ---" };
      }

      // If the game is not over, it means the player won the last encounter.
      // Buffer a message and create a new encounter.
      world.console.bufferEvent('plot', "\n--- Encounter complete! A new challenge appears! ---");
      world.startNewEncounter();
    }
    
    // Signal to the main loop that the game should continue.
    return { gameShouldEnd: false };
  }

  // --- Rule Logic Methods ---

  isPlayerDefeated(world) {
    return world.player && world.player.numAttrs.get("hp") <= 0;
  }

  areAllEnemiesDefeated(world) {
    return (
      world.currentEncounter &&
      world.currentEncounter.enemies.every((e) => e.numAttrs.get("hp") <= 0)
    );
  }

  getOrCreateEncounter(world) {
    // Rule: In the 'combat' phase, create one Orc.
    let enemies = [];
    if (world.gamePhase === "combat") {
      enemies.push(
        new this.Entities.Orc({
          name: "Grimgor",
          numAttrs: { hp: 60, strength: 15, defense: 5 },
        }),
      );
    }

    const allParticipants = [world.player, ...enemies];
    const turnOrder = allParticipants
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    return { enemies, turnOrder };
  }

  updateGamePhase(world) {
    let newPhase = this.phaseGraph.updateGamePhase(world);
    if (newPhase === "__end__") {
      const playerWon = this.areAllEnemiesDefeated(world);
      const endText = world.formatter.format("encounterEnd", { playerWon });
      world.console.bufferEvent("critical", endText);
      world.currentEncounter = null; // State change happens in World
    } else if (newPhase !== world.gamePhase) {
      const phaseText = world.formatter.format("phaseChange", {
        from: world.gamePhase,
        to: newPhase,
      });
      world.console.bufferEvent("critical", phaseText);
      world.gamePhase = newPhase; // State change happens in World
    }
  }

  isActionAllowedNow(action, actioner, actionee, world) {
    return this.permissionGraph.isActionAllowedNow(
      action,
      actioner,
      actionee,
      world.currentEncounter,
      world.gamePhase,
    );
  }

  determineEnemyAction(enemy, world) {
    if (enemy.type === "Orc") {
      const attackAction = new this.Actions.BasicAttack({
        worldInstance: world,
      });
      if (this.isActionAllowedNow(attackAction, enemy, world.player, world)) {
        return attackAction;
      }
    }
    return null;
  }

  getAllActionsAllowed(player, world) {
    if (!world.currentEncounter) return [];
    const allowedMoves = [];

    const potentialTargets = world.currentEncounter.enemies
      .map((enemy, index) => ({ entity: enemy, index }))
      .filter((target) => target.entity.numAttrs.get("hp") > 0);

    for (const [actionKey, ActionClass] of Object.entries(this.Actions)) {
      const dummyAction = { constructor: ActionClass };
      for (const target of potentialTargets) {
        if (
          this.isActionAllowedNow(dummyAction, player, target.entity, world)
        ) {
          allowedMoves.push({
            actionName: actionKey,
            targetIndex: target.index,
          });
        }
      }
    }
    return allowedMoves;
  }

  showPlayerHUD(allowedMoves, world) {
    if (allowedMoves.length > 0) {
      allowedMoves.forEach((move) => {
        const command = `#${move.actionName}_${move.targetIndex}`;
        world.console.renderOnPlayerHUD(command);
      });
    }
  }
}

module.exports = { GamePhaseManager };
