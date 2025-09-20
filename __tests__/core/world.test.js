// __tests__/core/world.test.js
const { World } = require('../../src/core/world.js');
const { createEntityClass } = require('../../src/core/entity.js');
const { createAttributesClass } = require('../../src/core/attributes.js');
const { Encounter } = require('../../src/core/abstractions.js');

// Mock dependencies
const mockConsole = {
    bufferEvent: jest.fn(),
    plotEssentials: '',
    authorsNote: ''
};
const mockFormatter = {
    format: jest.fn().mockReturnValue('formatted text')
};

// A mock GamePhaseManager is crucial for isolating the World's logic
const mockGamePhaseManager = {
    Entities: {},
    getOrCreateEncounter: jest.fn(),
    updateGamePhase: jest.fn(),
    determineEnemyAction: jest.fn(),
    getAllActionsAllowed: jest.fn(),
    showPlayerHUD: jest.fn(),
    isActionAllowedNow: jest.fn(),
};

describe('World Singleton', () => {

    let world;

    beforeEach(() => {
        // Reset the singleton instance before each test
        World.instance = null; 
        world = World.getInstance();
        
        // Setup mock entity classes for the GamePhaseManager
        const Attr = createAttributesClass(['hp']);
        mockGamePhaseManager.Entities.Player = createEntityClass({ type: 'Player', NumAttributesClass: Attr, TxtAttributesClass: Attr });
        mockGamePhaseManager.Entities.Orc = createEntityClass({ type: 'Orc', NumAttributesClass: Attr, TxtAttributesClass: Attr });

        // Reset mocks
        jest.clearAllMocks();
    });

    it('should be a singleton', () => {
        const world2 = World.getInstance();
        expect(world).toBe(world2);
    });

    it('should initialize with dependencies', () => {
        world.initialize(mockConsole, mockFormatter, mockGamePhaseManager);
        expect(world.console).toBe(mockConsole);
        expect(world.formatter).toBe(mockFormatter);
        expect(world.gamePhaseManager).toBe(mockGamePhaseManager);
    });

    it('should create a player character', () => {
        world.initialize(mockConsole, mockFormatter, mockGamePhaseManager);
        const player = world.createPlayerCharacter({ name: 'Hero', numAttrs: { hp: 100 } });
        
        expect(player.name).toBe('Hero');
        expect(player.type).toBe('Player');
        expect(world.player).toBe(player);
        expect(world.allEntities.get(player.uid)).toBe(player);
    });

    it('should start a new encounter', () => {
        const mockOrc = new mockGamePhaseManager.Entities.Orc({name: 'Grishnak'});
        mockGamePhaseManager.getOrCreateEncounter.mockReturnValue({
            enemies: [mockOrc],
            turnOrder: [world.player, mockOrc]
        });

        world.initialize(mockConsole, mockFormatter, mockGamePhaseManager);
        const player = world.createPlayerCharacter({name: 'Hero'});
        world.startNewEncounter();

        expect(world.currentEncounter).toBeInstanceOf(Encounter);
        expect(world.currentEncounter.enemies).toContain(mockOrc);
        expect(world.allEntities.has(mockOrc.uid)).toBe(true);
        expect(mockConsole.bufferEvent).toHaveBeenCalledWith('plot', 'formatted text');
    });

    it('should correctly serialize and deserialize its state', () => {
        world.initialize(mockConsole, mockFormatter, mockGamePhaseManager);
        const player = world.createPlayerCharacter({ name: 'Hero', numAttrs: { hp: 80 } });
        
        const mockOrc = new mockGamePhaseManager.Entities.Orc({ name: 'Grishnak', numAttrs: { hp: 50 } });
        mockGamePhaseManager.getOrCreateEncounter.mockReturnValue({
            enemies: [mockOrc],
            turnOrder: [player, mockOrc]
        });
        world.startNewEncounter();
        world.gamePhase = 'combat';

        const data = world.toData();
        
        // Reset the world to test deserialization from scratch
        World.instance = null;
        const newWorld = World.fromData(data, mockConsole, mockFormatter, mockGamePhaseManager);

        expect(newWorld.gamePhase).toBe('combat');
        expect(newWorld.player.name).toBe('Hero');
        expect(newWorld.player.numAttrs.get('hp')).toBe(80);
        expect(newWorld.currentEncounter).not.toBeNull();
        expect(newWorld.currentEncounter.enemies[0].name).toBe('Grishnak');
        expect(newWorld.currentEncounter.enemies[0].numAttrs.get('hp')).toBe(50);
        expect(newWorld.allEntities.size).toBe(2);
    });
});