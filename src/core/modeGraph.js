// src/core/modeGraph.js

/**
 * A fluent builder for creating game mode graphs.
 */
class ModeGraphBuilder {
  constructor() {
    this.graph = {};
  }

  /**
   * Adds a mode (a node) to the graph.
   * @param {string} modeName 
   */
  addMode(modeName) {
    if (!this.graph[modeName]) {
      this.graph[modeName] = {};
    }
    return this;
  }

  /**
   * Adds a directed transition (an edge) between two modes.
   * @param {string} fromMode 
   * @param {string} toMode 
   * @param {(gameState: import('./gameState').GameState) => boolean} condition 
   */
  addTransition(fromMode, toMode, condition) {
    this.addMode(fromMode);
    this.graph[fromMode][toMode] = condition;
    return this;
  }

  /**
   * Returns a final graph object that contains both the graph data
   * and the logic to traverse it.
   */
  build() {
    const graphData = this.graph;

    return {
      // The raw graph data
      data: graphData,

      /**
       * Checks for a valid transition from the current mode based on the game state.
       * @param {string} currentMode 
       * @param {import('./gameState').GameState} gameState 
       * @returns {string | null} The name of the new mode if a transition is found, otherwise null.
       */
      checkForTransition: function(currentMode, gameState) {
        const possibleTransitions = this.data[currentMode];
        if (!possibleTransitions) {
          return null;
        }

        for (const modeName in possibleTransitions) {
          const condition = possibleTransitions[modeName];
          if (condition(gameState)) {
            return modeName; // Return the first valid transition found
          }
        }

        return null;
      }
    };
  }
}

// The separate ModeGraphProcessor class has been removed.

module.exports = { ModeGraphBuilder };