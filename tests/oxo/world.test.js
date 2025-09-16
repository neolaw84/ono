const { World } = require('../../src/oxo/world.js');

// Mock the console to avoid actual console output and allow for spying
const mockConsole = {
    renderOnPlayerHUD: jest.fn(),
    renderOnEnvironment: jest.fn(),
    promptForInput: jest.fn().mockResolvedValue('TestHero'),
    flushPlayerHUD: jest.fn(),
    flushEnvironment: jest.fn(),
};

describe('World (OXO Rulebook)', () => {
    let worldInstance;
    let player;
    let orc;

    // Before each test, create a fresh instance of the world
    beforeEach(async () => {
        // Reset the singleton instance for isolation between tests
        World.instance = null; 
        World.initialize(mockConsole);
        worldInstance = World.getInstance();
        player = await worldInstance.createPlayerCharacter();
        orc = new worldInstance.Entities.Orc({ name: 'Grimgor', numAttrs: { hp: 60 } });
        // Clear mocks from previous tests
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('getInstance should return the same instance', () => {
            const instance2 = World.getInstance();
            expect(worldInstance).toBe(instance2);
        });

        test('should throw error if getInstance is called before initialize', () => {
            World.instance = null; // Force reset
            expect(() => World.getInstance()).toThrow('World singleton has not been initialized.');
        });
    });

    describe('Encounter and Turn Management', () => {
        test('getOrCreateEncounter should set up turn order', () => {
            worldInstance.getOrCreateEncounter([orc]);
            const encounter = worldInstance.currentEncounter;

            expect(encounter).toBeDefined();
            expect(encounter.turnOrder.length).toBe(2);
            expect(encounter.turnOrder).toContain(player);
            expect(encounter.turnOrder).toContain(orc);
            expect(encounter.currentTurnIndex).toBe(0);
            expect(mockConsole.renderOnEnvironment).toHaveBeenCalledWith(expect.stringContaining('Turn order determined:'));
        });

        test('updateTurn should advance to the next entity', () => {
            worldInstance.getOrCreateEncounter([orc]);
            
            const firstEntity = worldInstance.getEntityForThisTurn();
            worldInstance.updateTurn();
            const secondEntity = worldInstance.getEntityForThisTurn();

            expect(firstEntity).not.toBe(secondEntity);
        });
        
        test('updateTurn should loop back to the first entity', () => {
            worldInstance.getOrCreateEncounter([orc]);
            const firstEntity = worldInstance.getEntityForThisTurn();
            worldInstance.updateTurn(); // -> 2nd entity
            worldInstance.updateTurn(); // -> loop back to 1st
            const thirdTurnEntity = worldInstance.getEntityForThisTurn();

            expect(thirdTurnEntity).toBe(firstEntity);
        });
        
        test('isPlayerTurn should return correct boolean', () => {
            worldInstance.getOrCreateEncounter([orc]);
            // Force player to be first in the turn order for a predictable test
            worldInstance.currentEncounter.turnOrder = [player, orc];
            worldInstance.currentEncounter.currentTurnIndex = 0;
            
            expect(worldInstance.isPlayerTurn()).toBe(true);
            
            worldInstance.updateTurn();
            expect(worldInstance.isPlayerTurn()).toBe(false);
        });
    });
    
    describe('Phase Management', () => {
        test('updateEncounterPhase should move from __start__ to combat', () => {
            worldInstance.getOrCreateEncounter([orc]);
            // The encounter starts in '__start__'
            expect(worldInstance.currentEncounter.phase).toBe('__start__');
            worldInstance.updateEncounterPhase();
            expect(worldInstance.currentEncounter.phase).toBe('combat');
        });

        test('updateEncounterPhase should end encounter when all enemies are defeated', () => {
            worldInstance.getOrCreateEncounter([orc]);
            worldInstance.updateEncounterPhase(); // -> combat
            
            orc.numAttrs.set('hp', 0); // Defeat the orc
            
            worldInstance.updateEncounterPhase(); // -> check_victory
            worldInstance.updateEncounterPhase(); // -> __end__
            
            expect(worldInstance.currentEncounter).toBeNull();
            expect(mockConsole.renderOnEnvironment).toHaveBeenCalledWith(expect.stringContaining('Victory!'));
        });
    });
});