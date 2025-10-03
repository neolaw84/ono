// src/core/action.js

/**
 * Abstract base class for all actions.
 * It defines the interface that all concrete action classes must implement.
 */
class iAction {
  constructor(config) {
    if (this.constructor === iAction) {
      throw new Error("Abstract class 'iAction' cannot be instantiated directly.");
    }
    this.name = config.name || "Unnamed Action";
    this.type = config.type || "Generic";
  }

  /**
   * Executes the action's logic.
   * This method must be implemented by all subclasses.
   * @param {import('./character').Character} actioner - The character performing the action.
   * @param {import('./character').Character} target - The character being targeted.
   * @param {any} gameState - The current state of the game.
   * @param {import('./eventManager').EventManager} eventManager - The system for publishing events.
   */
  apply(actioner, target, gameState, eventManager) {
    throw new Error("Method 'apply()' must be implemented.");
  }
}

module.exports = { iAction };