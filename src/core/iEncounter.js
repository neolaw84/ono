// src/core/iEncounter.js

/**
 * Interface for an encounter object. The engine interacts with this contract,
 * while the rulebook provides the concrete implementation.
 */
class iEncounter {
  constructor() {
    if (this.constructor === iEncounter) {
      throw new Error("Abstract class 'iEncounter' cannot be instantiated directly.");
    }
  }

  /** @returns {import('./character').Character} */
  getCurrentTurnCharacter() { throw new Error("Method must be implemented."); }

  advanceTurn() { throw new Error("Method must be implemented."); }

  /** @returns {'victory' | 'defeat' | 'ongoing' | string} */
  checkEndCondition() { throw new Error("Method must be implemented."); }
}

module.exports = { iEncounter };