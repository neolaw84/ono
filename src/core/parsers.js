// src/core/parsers.js

/**
 * Interface for a command object. All commands must have an execute method.
 */
class iCommand {
  constructor() {
    if (this.constructor === iCommand) {
      throw new Error("Abstract class 'iCommand' cannot be instantiated directly.");
    }
  }

  /**
   * Executes the command's logic.
   * @param {import('./gameEngine').GameEngine} gameEngine - The main game engine instance.
   */
  execute(gameEngine) {
    throw new Error("Method 'execute()' must be implemented.");
  }
}

/**
 * Interface for a command parser.
 */
class iCommandParser {
  /**
   * Tries to parse the user's input text.
   * @param {string} inputText - The raw text from the player.
   * @param {import('./gameState').GameState} gameState - The current game state.
   * @returns {iCommand | null} A command object if parsing is successful, otherwise null.
   */
  parse(inputText, gameState) {
    throw new Error("Method 'parse()' must be implemented.");
  }
}

// --- System-Specific Command Classes ---

class QuitCommand extends iCommand {
  execute(gameEngine) {
    gameEngine.isRunning = false;
  }
}

class SaveCommand extends iCommand {
    constructor(fileName) {
        super();
        this.filePath = fileName || 'savegame.json'; // Default save file name
    }
    execute(gameEngine) {
        // We need a way to serialize gameState first
        const gameStateData = {
            party: gameEngine.gameState.party.map(c => c.toData()),
            npcs: gameEngine.gameState.npcs.map(c => c.toData()),
            // ... other gameState properties
        };
        gameEngine.ioConsole.save(this.filePath, gameStateData);
    }
}

// --- System Command Parser (Updated) ---

/**
 * Parses system-level commands like '#quit' and '#save' from within a larger text.
 */
class SystemCommandParser extends iCommandParser {
  parse(inputText, gameState) {
    // 1. Check for a direct, simple command first.
    const trimmedInput = inputText.trim();
    const directParts = trimmedInput.split(/\s+/);
    const directCommand = directParts[0];

    if (directCommand === 'quit') {
        return new QuitCommand();
    }
    if (directCommand === 'save') {
        return new SaveCommand(directParts[1]); // Allows "save mygame.json"
    }

    // This regex finds all words preceded by a #
    const tokens = inputText.match(/#(\w+)/g) || [];
    
    // Clean the tokens by removing the '#'
    const commands = tokens.map(token => token.substring(1).toLowerCase());

    for (const command of commands) {
        if (command === "quit") {
            return new QuitCommand();
        }
        if (command === "save") {
            // For simplicity, we are not parsing a filename from the story text.
            return new SaveCommand();
        }
    }

    return null; // No system command found
  }
}

module.exports = {
  iCommand,
  iCommandParser,
  SystemCommandParser,
};