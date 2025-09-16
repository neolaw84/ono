const { ONOConsole } = require('../../src/aid/ono_console.js');

describe('ONOConsole', () => {
    let consoleSpy;

    // Before each test, spy on console.log and disable its output
    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    // After each test, restore the original console.log
    afterEach(() => {
        consoleSpy.mockRestore();
    });

    test('should be a singleton', () => {
        const instance1 = ONOConsole.getInstance();
        const instance2 = ONOConsole.getInstance();
        expect(instance1).toBe(instance2);
    });

    test('renderOnPlayerHUD should format text correctly', () => {
        const consoleInstance = ONOConsole.getInstance();
        consoleInstance.renderOnPlayerHUD('Test HUD');
        expect(consoleSpy).toHaveBeenCalledWith('[HUD] Test HUD');
    });

    test('renderOnEnvironment should format text correctly', () => {
        const consoleInstance = ONOConsole.getInstance();
        consoleInstance.renderOnEnvironment('Test ENV');
        expect(consoleSpy).toHaveBeenCalledWith('[ENV] Test ENV');
    });

    test('flushPlayerHUD should print a clear message', () => {
        const consoleInstance = ONOConsole.getInstance();
        consoleInstance.flushPlayerHUD();
        expect(consoleSpy).toHaveBeenCalledWith('[HUD] --- CLEARED ---');
    });
    
    test('promptForInput should resolve with a default name for testing', async () => {
        const consoleInstance = ONOConsole.getInstance();
        const question = "What is your name?";
        const name = await consoleInstance.promptForInput(question);
        
        expect(consoleSpy).toHaveBeenCalledWith(`[INPUT] ${question}`);
        expect(name).toBe('Hero');
    });
});