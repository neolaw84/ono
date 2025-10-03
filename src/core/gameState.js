// src/core/gameState.js

/**
 * A container for the entire state of the game world.
 */
class GameState {
  constructor() {
    /** @type {import('./character').Character[]} */
    this.party = [];
    /** @type {import('./character').Character[]} */
    this.npcs = [];
    /** @type {import('./prop').Prop[]} */
    this.props = [];
    
    // TODO: Implement a more sophisticated map system.
    // For now, this can be a simple object mapping location names to lists of objects.
    this.map = {};
    
    // Placeholders for future engine components
    this.currentGameMode = "__start__"; // e.g., "exploration", "combat", "dialogue"
    this.currentChallenge = null;
    this.turnCount = 0;
    this.globalTime = new Date();
  }

  /**
   * A helper method to get all characters (party and NPCs) in one list.
   * @returns {import('./character').Character[]}
   */
  getAllCharacters() {
    return [...this.party, ...this.npcs];
  }
}

module.exports = { GameState };