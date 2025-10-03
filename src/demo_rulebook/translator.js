// src/demo_rulebook/translator.js

const { Rulebook } = require("./rulebook"); // Translator needs to query the Rulebook

// Helper function to create a consistent ID from an action name
function getActionId(actionName) {
    return actionName.replace(/\s+/g, '').toLowerCase();
}

class Translator {
  constructor(eventManager, ioConsole) {
    this.ioConsole = ioConsole;
    this._subscribeToEvents(eventManager);
  }

  _subscribeToEvents(eventManager) {
    eventManager.subscribe("ACTION_RESOLVED", (data) => this._handleActionResolved(data));
    eventManager.subscribe("ACTION_FAILED", (data) => this._handleActionFailed(data));
    eventManager.subscribe("GAME_STATE_UPDATED", (gameState) => this._handleGameStateUpdate(gameState));

    // --- New Event Subscriptions ---
    eventManager.subscribe("GAME_MODE_CHANGED", (data) => this._handleGameModeChanged(data));
    eventManager.subscribe("ENCOUNTER_STARTED", (data) => this._handleEncounterStarted(data));
    eventManager.subscribe("ENCOUNTER_ENDED", (data) => this._handleEncounterEnded(data));
    eventManager.subscribe("TURN_CHANGED", (data) => this._handleTurnChanged(data));
  }

  // --- New Event Handlers ---
  _handleGameModeChanged(data) {
    this.ioConsole.bufferEvent('System', null, `Game mode changed to: ${data.to}`);
  }
  _handleEncounterStarted(data) {
    this.ioConsole.bufferEvent('World', null, '--- ENCOUNTER START ---');
    this.ioConsole.bufferEvent('World', null, `Turn order: ${data.turnOrder.map(c => c.name).join(', ')}`);
  }
  _handleEncounterEnded(data) {
    this.ioConsole.bufferEvent('World', null, `--- ENCOUNTER OVER: ${data.status.toUpperCase()} ---`);
  }
  _handleTurnChanged(data) {
      if (data.character) {
          this.ioConsole.bufferEvent('System', null, `Turn: ${data.character.name}`);
      }
  }
  
  _handleActionResolved(data) {
    const { action, actioner, target, resultValue } = data;
    
    this.ioConsole.bufferEvent('World', null, `---[ ${action.toUpperCase()} ]---`);
    this.ioConsole.bufferEvent('World', null, `${actioner} uses ${action} on ${target}.`);
    
    let outcomeText = 'Failure.';
    if (resultValue > 11) outcomeText = 'CRITICAL SUCCESS!';
    else if (resultValue > 0) outcomeText = 'Success.';
    else if (resultValue <= -11) outcomeText = 'CRITICAL FAILURE!';
    
    this.ioConsole.bufferEvent('World', null, `> Outcome: ${outcomeText}`);
  }

  _handleActionFailed(data) {
    this.ioConsole.bufferEvent('World', { error: true }, `[ACTION FAILED]: ${data.reason}`);
  }
  
  _handleGameStateUpdate(gameState) {
    // --- HUD Generation (mostly unchanged) ---
    const player = gameState.party[0];
    this.ioConsole.bufferEvent('HUD', null, '---[ STATUS ]---');
    this.ioConsole.bufferEvent('HUD', null, `Mode: ${gameState.currentGameMode}`);
    // ... rest of the HUD generation ...
    this.ioConsole.bufferEvent('HUD', null, '----------------');
    
    // --- NEW: Dynamic Hint Generation ---
    this.ioConsole.bufferEvent('HUD', null, '---[ ACTIONS ]---');
    const availableActions = Rulebook.getAvailableActions(gameState);

    if (availableActions.length === 0) {
        this.ioConsole.bufferEvent('HUD', null, 'No special actions available.');
    } else {
        availableActions.forEach(({ action, targets }) => {
            const actionId = getActionId(action.name);
            targets.forEach(target => {
                const hint = `* ${action.name} on ${target.name}: #${actionId} #uid${target.uid}`;
                this.ioConsole.bufferEvent('HUD', null, hint);
            });
        });
    }
  }
}

module.exports = { Translator };