/**
 * @file Test suite for the core Action class
 * @description This file tests all outcomes of the Action.apply method.
 * It uses jest.spyOn(Math, 'random') to mock the underlying dependency of the rollD20 function,
 * allowing for reliable and predictable testing without altering the source code.
 */

const { createActionClass } = require('../../src/core/action');
const { createEntityClass } = require('../../src/core/entity');
const { createAttributesClass } = require('../../src/core/attributes');

describe('Action Core Logic', () => {
    // Declare variables to be used across tests
    let mockWorld, AttackerClass, TargetClass, attacker, target, Attr, TestAction;
    let randomSpy;

    // Runs before each test to set up a clean environment
    beforeEach(() => {
        // Spy on Math.random to control dice roll outcomes
        randomSpy = jest.spyOn(Math, 'random');

        // Mock the world object and its methods
        mockWorld = {
            isActionAllowedNow: jest.fn().mockReturnValue(true),
            console: { bufferEvent: jest.fn() },
            formatter: { format: jest.fn((key) => `Formatted: ${key}`) },
        };

        // Define attribute and entity classes for the test
        Attr = createAttributesClass(['hp', 'mp']);
        AttackerClass = createEntityClass({ type: 'Attacker', NumAttributesClass: Attr, TxtAttributesClass: Attr });
        TargetClass = createEntityClass({ type: 'Target', NumAttributesClass: Attr, TxtAttributesClass: Attr });

        // Instantiate fresh entities for each test
        attacker = new AttackerClass({ name: 'Attacker', numAttrs: { hp: 100, mp: 50 } });
        target = new TargetClass({ name: 'Target', numAttrs: { hp: 100, mp: 50 } });

        // Create a standard action class for testing
        TestAction = createActionClass({
            name: 'Test Strike',
            type: 'attack',
            cost: new Attr({ mp: 10 }),
            actionerMod: new Attr(),
            actioneeMod: new Attr(),
            effectVal: new Attr({ hp: -20 }), // Negative value for damage
            effectType: 'add',
            effectMask: new Attr({ hp: true }),
        });
    });

    // Runs after each test to clean up mocks
    afterEach(() => {
        // Restore the original Math.random to prevent test pollution
        randomSpy.mockRestore();
    });

    it('should fail if actioner cannot afford the cost', () => {
        attacker.numAttrs.set('mp', 5); // Attacker has insufficient MP
        const action = new TestAction({ worldInstance: mockWorld });
        const result = action.apply(attacker, target);

        expect(result.outcome).toBe('cannot_afford');
        expect(mockWorld.console.bufferEvent).toHaveBeenCalledWith('info', 'Formatted: halt');
        expect(target.numAttrs.get('hp')).toBe(100); // Target is unaffected
        expect(randomSpy).not.toHaveBeenCalled(); // No dice roll should occur
    });

    it('should fail if the action is not allowed by the world state', () => {
        mockWorld.isActionAllowedNow.mockReturnValue(false); // World forbids the action
        const action = new TestAction({ worldInstance: mockWorld });
        const result = action.apply(attacker, target);

        expect(result.outcome).toBe('not_allowed');
        expect(target.numAttrs.get('hp')).toBe(100);
        expect(randomSpy).not.toHaveBeenCalled();
    });

    it('should succeed on a favorable roll, applying cost and effect', () => {
        // Arrange: Force a roll of 15 for attacker, 5 for target
        randomSpy
            .mockReturnValueOnce(0.7) // Math.floor(0.7 * 20) + 1 = 15
            .mockReturnValueOnce(0.2); // Math.floor(0.2 * 20) + 1 = 5
        
        const action = new TestAction({ worldInstance: mockWorld });
        const result = action.apply(attacker, target);

        expect(result.outcome).toBe('success');
        expect(attacker.numAttrs.get('mp')).toBe(40); // 50 - 10 cost
        expect(target.numAttrs.get('hp')).toBe(80);  // 100 - 20 damage
    });

    it('should apply double effect on a critical success', () => {
        // Arrange: Force a roll of 20 for attacker, 1 for target
        randomSpy
            .mockReturnValueOnce(0.99) // Results in a roll of 20
            .mockReturnValueOnce(0);    // Results in a roll of 1

        const action = new TestAction({ worldInstance: mockWorld });
        const result = action.apply(attacker, target);
        
        expect(result.outcome).toBe('critical success');
        expect(attacker.numAttrs.get('mp')).toBe(40);
        expect(target.numAttrs.get('hp')).toBe(60); // 100 - (20 * 2) double damage
    });
    
    it('should have no effect on target on a failure, but still pay the cost', () => {
        // Arrange: Force a roll of 5 for attacker, 15 for target
        randomSpy
            .mockReturnValueOnce(0.2) // Results in a roll of 5
            .mockReturnValueOnce(0.7); // Results in a roll of 15

        const action = new TestAction({ worldInstance: mockWorld });
        const result = action.apply(attacker, target);

        expect(result.outcome).toBe('failure');
        expect(attacker.numAttrs.get('mp')).toBe(40); // Cost is still paid
        expect(target.numAttrs.get('hp')).toBe(100);  // Target is unharmed
    });

    it('should apply cost again on a critical failure', () => {
        // Arrange: Force a roll of 1 for attacker, 20 for target
        randomSpy
            .mockReturnValueOnce(0)     // Results in a roll of 1
            .mockReturnValueOnce(0.99); // Results in a roll of 20

        const action = new TestAction({ worldInstance: mockWorld });
        const result = action.apply(attacker, target);

        expect(result.outcome).toBe('critical failure');
        expect(attacker.numAttrs.get('mp')).toBe(30); // 50 - 10 (cost) - 10 (penalty)
        expect(target.numAttrs.get('hp')).toBe(100); // Target is unharmed
        expect(randomSpy).toHaveBeenCalledTimes(2);
    });
});