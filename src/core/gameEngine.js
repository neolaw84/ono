// src/core/gameEngine.js

const { iCommand } = require("./parsers");

class GameEngine {
  constructor({ rulebook, ioConsole, gameState, eventManager, translator, parsers }) {
    this.rulebook = rulebook;
    this.ioConsole = ioConsole;
    this.gameState = gameState;
    this.eventManager = eventManager;
    this.translator = translator;
    this.parsers = parsers || [];
    this.isRunning = false;
  }

  initialize() {
    this.rulebook.initialize(this.gameState);
    this.isRunning = true;
  }

  processInput(input) {
    let command = null;
    if (typeof input === 'string') {
        for (const parser of this.parsers) {
            command = parser.parse(input, this.gameState);
            if (command) break;
        }
    } else if (input instanceof iCommand) {
        command = input;
    }

    if (command) {
        command.execute(this);
    } else if (typeof input === 'string' && input.trim() !== '') {
        this.ioConsole.bufferEvent('World', { error: true }, "I don't understand that.");
    }
    
    if (this.gameState.currentEncounter) {
        this.gameState.currentEncounter.advanceTurn();
    }
  }

  updateAI() {
      if (!this.gameState.currentEncounter) return;

      const currentTurnCharacter = this.gameState.currentEncounter.getCurrentTurnCharacter();
      if (currentTurnCharacter && currentTurnCharacter.type !== 'Player') {
          this.eventManager.publish('TURN_CHANGED', { character: currentTurnCharacter });
          const command = this.rulebook.getNpcAction(currentTurnCharacter, this.gameState);
          if (command) {
              command.execute(this);
          }
          this.gameState.currentEncounter.advanceTurn();
      }
  }

  render() {
      this.ioConsole.clearScreen();
      this.ioConsole.flushEvents('System');
      this.ioConsole.flushEvents('World');
      this.ioConsole.flushEvents('HUD');
  }

  updateWorldState() {
    this.rulebook.updateWorldState(this.gameState, this.eventManager);
    this.eventManager.publish('GAME_STATE_UPDATED', this.gameState);
  }

  async run() {
    this.initialize();
    while (this.isRunning) {
        this.updateWorldState();
        
        // --- NEW: Check for end state ---
        if (this.gameState.currentGameMode === '__end__') {
            this.isRunning = false;
            this.ioConsole.bufferEvent('System', null, 'The game has ended.');
        }

        this.render();
        if (!this.isRunning) break;

        if (this.gameState.currentEncounter) {
            const turnChar = this.gameState.currentEncounter.getCurrentTurnCharacter();
            if (turnChar.type.name === 'Player') {
                this.eventManager.publish('TURN_CHANGED', { character: turnChar });
                const input = await this.ioConsole.getInput('> ');
                this.processInput(input);
            } else {
                this.updateAI();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            const input = await this.ioConsole.getInput('> ');
            this.processInput(input);
        }
    }
    this.ioConsole.bufferEvent('World', null, 'Exiting game...');
    this.render();
    this.ioConsole.close();
  }
}

module.exports = { GameEngine };