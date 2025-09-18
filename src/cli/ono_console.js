/**
 * @file O&O Console (Presentation Layer)
 * @description A singleton class to handle all raw text output for the game.
 * It is a "dumb" renderer, unaware of the game's logic or state.
 * @implements {import('../core.js').iONOConsole}
 */

class ONOConsole {
  constructor() {
    if (ONOConsole.instance) {
      return ONOConsole.instance;
    }
    ONOConsole.instance = this;
  }

  static getInstance() {
    if (!ONOConsole.instance) {
      ONOConsole.instance = new ONOConsole();
    }
    return ONOConsole.instance;
  }

  /**
   * For the CLI, "buffering" an event just means printing it immediately.
   * This ensures the class conforms to the iONOConsole interface.
   * @param {string} eventName The type of event (e.g., 'action', 'battle').
   * @param {string | object} data The event details.
   */
  bufferEvent(eventName, data) {
    const message = typeof data === "object" ? JSON.stringify(data) : data;
    console.log(`[EVENT:${eventName}] ${message.trim()}`);
  }

  /**
   * Renders text to the primary player display (e.g., a HUD or main text box).
   * @param {string} text The text to display.
   */
  renderOnPlayerHUD(text) {
    console.log(`[HUD] ${text}`);
  }

  /**
   * Renders text to the secondary display (e.g., the general environment log).
   * @param {string} text The text to display.
   */
  renderOnEnvironment(text) {
    console.log(`[ENV] ${text}`);
  }

  /**
   * Prompts the user for input and returns the result synchronously.
   * @param {string} question - The question to ask the user.
   * @returns {string} The user's input.
   */
  promptForTextInput(question) {
    // In a real terminal app, this would use synchronous input methods.
    console.log(`[INPUT] ${question}`);
    return "Hero"; // Returning a default name for non-interactive execution
  }

  /**
   * Clears the player HUD.
   */
  flushPlayerHUD() {
    console.log("[HUD] --- CLEARED ---");
  }

  /**
   * Clears the environment log.
   */
  flushEnvironment() {
    console.log("[ENV] --- CLEARED ---");
  }

  /**
   * Serializes the console's state. Since the console is stateless, this is a no-op.
   * @returns {object} An empty object.
   */
  toData() {
    return {}; // Nothing to save
  }

  /**
   * Deserializes data into a console instance. Since it's a stateless singleton,
   * this just returns the existing instance.
   * @returns {ONOConsole} The singleton instance.
   */
  static fromData(data) {
    return ONOConsole.getInstance();
  }

  getRawPlayerInput(text) {
    return "HeavyStrike_0"; // Default action for non-interactive execution
  }

  parsePlayerInput(rawInput, worldInstance) {
    return rawInput;
  }
}

module.exports = { ONOConsole };
