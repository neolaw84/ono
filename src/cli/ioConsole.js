// src/cli/ioConsole.js

const { iIoConsole } = require("../core/iIoConsole");
const readline = require('readline');
const fs = require('fs').promises;

/**
 * A concrete implementation of iIoConsole for a command-line interface.
 */
class IoConsole extends iIoConsole {
  #rl;
  #buffers;

  constructor() {
    super();
    this.#rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.#buffers = {}; // A dictionary to hold arrays of buffered events
  }

  bufferEvent(type, data, text) {
    if (!this.#buffers[type]) {
      this.#buffers[type] = [];
    }
    // The CLI implementation ignores the `data` object and just formats the text.
    const formattedText = `[${type}] ${text}`;
    this.#buffers[type].push(formattedText);
  }

  flushEvents(type) {
    const typesToFlush = type === 'all' ? Object.keys(this.#buffers) : [type];
    
    for (const t of typesToFlush) {
      if (this.#buffers[t]) {
        this.#buffers[t].forEach(line => console.log(line));
        this.#buffers[t] = []; // Clear the buffer after flushing
      }
    }
  }

  clear(type) {
    if (type === 'all') {
      this.#buffers = {};
    } else if (this.#buffers[type]) {
      this.#buffers[type] = [];
    }
  }
  
  // This is a direct screen-clearing command, separate from the buffers.
  clearScreen() {
      //console.clear();
  }

  getInput(promptText = '> ') {
    return new Promise((resolve) => {
      this.#rl.question(promptText, (input) => {
        resolve(input);
      });
    });
  }

  /**
   * Saves the game state to a JSON file.
   * @param {string} filePath
   * @param {object} gameStateData
   */
  async save(filePath, gameStateData) {
    try {
      const dataString = JSON.stringify(gameStateData, null, 2);
      await fs.writeFile(filePath, dataString, 'utf8');
      this.bufferEvent('System', null, `Game saved to ${filePath}`);
    } catch (error) {
      console.error(`[System] Error saving game: ${error.message}`);
    }
  }

  /**
   * Loads the game state from a JSON file.
   * @param {string} filePath
   * @returns {Promise<object|null>}
   */
  async load(filePath) {
    try {
      const dataString = await fs.readFile(filePath, 'utf8');
      this.bufferEvent('System', null, `Game loaded from ${filePath}`);
      return JSON.parse(dataString);
    } catch (error) {
      console.error(`[System] Error loading game: ${error.message}`);
      return null;
    }
  }
  
  close() {
      this.#rl.close();
  }
}

module.exports = { IoConsole };