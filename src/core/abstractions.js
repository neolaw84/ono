// src/core/abstractions.js

class iONOConsole {
  constructor() {
    if (this.constructor === iONOConsole)
      throw new Error(
        "Abstract class 'iONOConsole' cannot be instantiated directly.",
      );
  }
  getRawPlayerInput(text) {
    throw new Error("Method 'getRawPlayerInput()' must be implemented.");
  }
  parsePlayerInput(rawInput, worldInstance) {
    throw new Error(
      "Method 'promptForRawInput(text, worldInstance)' must be implemented.",
    );
  }
  renderOnPlayerHUD(text) {
    throw new Error("Method 'renderOnPlayerHUD()' must be implemented.");
  }
  flushPlayerHUD() {
    throw new Error("Method 'flushPlayerHUD()' must be implemented.");
  }
  bufferEvent(eventName, data) {
    throw new Error("Method 'bufferEvent()' must be implemented.");
  }
  flushEnvironment() {
    throw new Error("Method 'flushEnvironment()' must be implemented.");
  }
  toData() {
    throw new Error("Method 'toData()' must be implemented.");
  }
  static fromData(data) {
    throw new Error("Static method 'fromData()' must be implemented.");
  }
}

/**
 * Represents the state of a single combat encounter.
 */
class Encounter {
  constructor(enemies) {
    this.enemies = enemies;
    // The phase is now managed by the World class.
    this.turnOrder = [];
    this.currentTurnIndex = 0;
  }

  toData() {
    return {
      currentTurnIndex: this.currentTurnIndex,
      enemies: this.enemies.map((e) => e.uid),
      turnOrder: this.turnOrder.map((e) => e.uid),
    };
  }

  static fromData(data, entityMap) {
    const enemies = data.enemies
      .map((uid) => entityMap.get(uid))
      .filter(Boolean);
    const encounter = new Encounter(enemies);
    encounter.currentTurnIndex = data.currentTurnIndex;
    encounter.turnOrder = data.turnOrder
      .map((uid) => entityMap.get(uid))
      .filter(Boolean);
    return encounter;
  }
}

module.exports = { iONOConsole, Encounter };
