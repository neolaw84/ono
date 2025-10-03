// src/demo_rulebook/encounter.js

const { iEncounter } = require("../core/iEncounter");

/**
 * A concrete implementation for a high-fantasy, turn-based combat encounter.
 */
class FantasyEncounter extends iEncounter {
  constructor({ participants, turnOrder }) {
    super();
    this.participants = participants;
    this.turnOrder = turnOrder;
    this.currentTurnIndex = 0;
    this.roundCount = 1;
  }

  getCurrentTurnCharacter() {
    return this.turnOrder[this.currentTurnIndex];
  }

  advanceTurn() {
    this.currentTurnIndex++;
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.roundCount++;
    }
  }

  checkEndCondition() {
    const aliveParty = this.participants.filter(p => p.type === 'Player' && p.numAttrs.get('hp') > 0);
    const aliveNpcs = this.participants.filter(p => p.type !== 'Player' && p.numAttrs.get('hp') > 0);

    if (aliveNpcs.length === 0) return 'victory';
    if (aliveParty.length === 0) return 'defeat';
    return 'ongoing';
  }
}

module.exports = { FantasyEncounter };