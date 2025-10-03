// src/core/iIoConsole.js

/**
 * Abstract base class for platform-specific I/O handlers.
 * Defines a buffered interface for rendering output, receiving input, and handling persistence.
 */
class iIoConsole {
  constructor() {
    if (this.constructor === iIoConsole) {
      throw new Error("Abstract class 'iIoConsole' cannot be instantiated directly.");
    }
  }

  /**
   * Buffers an event for later display.
   * @param {'HUD' | 'World' | 'NPC' | string} type - The category of the event (e.g., HUD, World).
   * @param {object} [data] - Optional, platform-specific rich data (e.g., image URLs, sound cues).
   * @param {string} text - The core text content for the event.
   */
  bufferEvent(type, data, text) {
    throw new Error("Method 'bufferEvent(type, data, text)' must be implemented.");
  }

  /**
   * Flushes (displays) all buffered events of a specific type.
   * @param {'HUD' | 'World' | 'NPC' | 'all' | string} type - The category to flush, or 'all'.
   */
  flushEvents(type) {
    throw new Error("Method 'flushEvents(type)' must be implemented.");
  }

  /**
   * Clears all buffered events of a specific type without displaying them.
   * @param {'HUD' | 'World' | 'NPC' | 'all' | string} type - The category to clear, or 'all'.
   */
  clear(type) {
    throw new Error("Method 'clear(type)' must be implemented.");
  }
  
  /**
   * Prompts the user for input. This is an immediate, blocking operation.
   * @param {string} promptText - The text to show the user as a prompt (e.g., '> ').
   * @returns {Promise<string>} A promise that resolves with the user's input string.
   */
  getInput(promptText) {
    throw new Error("Method 'getInput(promptText)' must be implemented.");
  }

  // Save/Load methods remain the same
  async save(filePath, gameStateData) {
      throw new Error("Method 'save(filePath, gameStateData)' must be implemented.");
  }
  async load(filePath) {
      throw new Error("Method 'load(filePath)' must be implemented.");
  }
}

module.exports = { iIoConsole };