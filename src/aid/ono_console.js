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

    /**
     * The static method that controls access to the singleton instance.
     * @returns {ONOConsole} The single instance of the ONOConsole class.
     */
    static getInstance() {
        if (!ONOConsole.instance) {
            ONOConsole.instance = new ONOConsole();
        }
        return ONOConsole.instance;
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
     * Prompts the user for input and returns the result.
     * @param {string} question - The question to ask the user.
     * @returns {Promise<string>} A promise that resolves with the user's input.
     */
    promptForInput(question) {
        // In a real terminal app, this would use process.stdin and readline.
        // For this example, we'll log the question and return a default name.
        console.log(`[INPUT] ${question}`);
        return Promise.resolve('Hero'); // Returning a default name for non-interactive execution
    }
    
    /**
     * Clears the player HUD.
     */
    flushPlayerHUD() {
        console.log('[HUD] --- CLEARED ---');
    }

    /**
     * Clears the environment log.
     */
    flushEnvironment() {
        console.log('[ENV] --- CLEARED ---');
    }
}

module.exports = { ONOConsole };