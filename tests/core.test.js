const {
    createAttributesClass,
    createEntityClass,
    createActionClass,
    Encounter,
    EncounterPhaseTransitionBuilder,
    ActionPermissionGraphBuilder
} = require('../src/core.js');

// ---- Setup Mocks and Test Classes ----
const mockWorld = {
    isActionAllowedNow: jest.fn(),
    logActionAttempt: jest.fn(),
    logCost: jest.fn(),
    logRoll: jest.fn(),
    logEffect: jest.fn(),
    logNoEffect: jest.fn(),
    logPenalty: jest.fn(),
    logHalt: jest.fn(),
};

const CoreStats = createAttributesClass(['hp', 'mp']);
const Player = createEntityClass({ type: 'Player', NumAttributesClass: CoreStats, TxtAttributesClass: CoreStats });
const Goblin = createEntityClass({ type: 'Goblin', NumAttributesClass: CoreStats, TxtAttributesClass: CoreStats });


// ---- Test Suites ----

describe('createAttributesClass', () => {
    const Stats = createAttributesClass(['health', 'mana', 'isStunned']);

    test('should initialize with provided values', () => {
        const stats = new Stats({ health: 100, mana: 50 });
        expect(stats.get('health')).toBe(100);
        expect(stats.get('mana')).toBe(50);
    });

    test('should default undefined keys to 0', () => {
        const stats = new Stats({ health: 100 });
        expect(stats.get('mana')).toBe(0);
    });
    
    test('should convert values to and from an array', () => {
        const stats = new Stats({ health: 80, mana: 40, isStunned: true });
        const arr = stats.toArray();
        expect(arr).toEqual([80, 40, true]);

        const newStats = new Stats();
        newStats.fromArray([99, 55, false]);
        expect(newStats.get('health')).toBe(99);
        expect(newStats.get('mana')).toBe(55);
        expect(newStats.get('isStunned')).toBe(false);
    });

    test('should not set values for non-existent keys', () => {
        const stats = new Stats();
        stats.set('strength', 99); // 'strength' is not a defined key
        expect(stats.get('strength')).toBeUndefined();
    });
});


describe('createEntityClass', () => {
    test('should create an entity with correct properties', () => {
        const player = new Player({ name: 'Hero', numAttrs: { hp: 100, mp: 50 }});
        expect(player.name).toBe('Hero');
        expect(player.type).toBe('Player');
        expect(player.numAttrs.get('hp')).toBe(100);
        expect(player.numAttrs instanceof CoreStats).toBe(true);
    });
});


describe('createActionClass', () => {
    const Punch = createActionClass({
        name: "Punch", type: "Attack", cost: new CoreStats({ mp: 5 }),
        actionerMod: new CoreStats(), actioneeMod: new CoreStats(),
        effectVal: new CoreStats({ hp: -10 }), effectType: "add",
        effectMask: new CoreStats({ hp: true }),
    });

    let player, goblin, punchAction;

    beforeEach(() => {
        // Reset mocks and entities before each test
        jest.clearAllMocks();
        player = new Player({ name: 'Hero', numAttrs: { hp: 100, mp: 50 }});
        goblin = new Goblin({ name: 'Gobby', numAttrs: { hp: 30, mp: 10 }});
        punchAction = new Punch({ worldInstance: mockWorld });
    });

    test('should halt if action is not allowed', () => {
        mockWorld.isActionAllowedNow.mockReturnValue(false);
        punchAction.apply(player, goblin);
        expect(mockWorld.logHalt).toHaveBeenCalledWith(expect.stringContaining("not allowed"));
        expect(player.numAttrs.get('mp')).toBe(50); // No cost paid
    });
    
    test('should halt if actioner cannot afford cost', () => {
        mockWorld.isActionAllowedNow.mockReturnValue(true);
        player.numAttrs.set('mp', 0); // Not enough mana
        punchAction.apply(player, goblin);
        expect(mockWorld.logHalt).toHaveBeenCalledWith("Cannot afford cost.");
        expect(goblin.numAttrs.get('hp')).toBe(30); // No damage dealt
    });

    test('should apply cost and effect on success', () => {
        mockWorld.isActionAllowedNow.mockReturnValue(true);
        // Mock the roll to ensure a success by returning a high value
        jest.spyOn(global.Math, 'random').mockReturnValue(0.9); // ~19 on a D20 roll

        punchAction.apply(player, goblin);
        
        expect(player.numAttrs.get('mp')).toBe(45); // Cost was paid
        expect(goblin.numAttrs.get('hp')).toBeLessThan(30); // Damage was dealt

        jest.spyOn(global.Math, 'random').mockRestore();
    });
});


describe('Encounter', () => {
    test('should initialize with correct default state', () => {
        const enemies = [new Goblin({ name: 'Gobby' })];
        const encounter = new Encounter(enemies);
        
        expect(encounter.enemies).toEqual(enemies);
        expect(encounter.phase).toBe('__start__');
        expect(encounter.turnOrder).toEqual([]);
        expect(encounter.currentTurnIndex).toBe(0);
    });
});

describe('Graph Builders', () => {
    test('EncounterPhaseTransitionBuilder should build a valid graph', () => {
        const graph = new EncounterPhaseTransitionBuilder()
            .addPhase('combat')
            .addTransition('__start__', 'combat', () => true)
            .build();
        
        expect(graph.nodes.has('combat')).toBe(true);
        expect(graph.edges.get('__start__')[0].to).toBe('combat');
    });

    test('ActionPermissionGraphBuilder should build a valid graph', () => {
        const graph = new ActionPermissionGraphBuilder()
            .addPermission(Player, Goblin, 'combat', 'PunchAction')
            .build();
        
        const fromKey = graph.getNodeKey(Player, 'combat');
        const toKey = graph.getNodeKey(Goblin, 'combat');

        const edge = graph.adj.get(fromKey).find(e => e.to === toKey);
        expect(edge).toBeDefined();
        expect(edge.actions.has('PunchAction')).toBe(true);
    });
});