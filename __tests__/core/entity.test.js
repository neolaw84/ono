// __tests__/core/entity.test.js
const { createEntityClass } = require('../../src/core/entity.js');
const { createAttributesClass } = require('../../src/core/attributes.js');

describe('createEntityClass', () => {
    const NumAttr = createAttributesClass(['hp']);
    const TxtAttr = createAttributesClass(['status']);
    const Player = createEntityClass({
        type: 'Player',
        description: 'The main hero.',
        NumAttributesClass: NumAttr,
        TxtAttributesClass: TxtAttr,
    });

    beforeEach(() => {
        // Reset UID counter for predictable UIDs
        Player.nextUid = 0;
    });

    it('should create an entity with correct type and description', () => {
        const player = new Player({ name: 'Hero' });
        expect(player.type).toBe('Player');
        expect(player.description).toBe('The main hero.');
        expect(player.name).toBe('Hero');
    });

    it('should instantiate with correct attributes', () => {
        const player = new Player({ name: 'Hero', numAttrs: { hp: 100 } });
        expect(player.numAttrs).toBeInstanceOf(NumAttr);
        expect(player.txtAttrs).toBeInstanceOf(TxtAttr);
        expect(player.numAttrs.get('hp')).toBe(100);
    });

    it('should throw an error if attribute classes are not provided', () => {
        expect(() => new Player({ name: 'Hero' }).constructor({ name: 'NoAttr' })).toThrow();
        expect(() => {
            const BadEntity = createEntityClass({ type: 'Bad' });
            new BadEntity({ name: 'Fail' });
        }).toThrow();
    });

    it('should serialize to and deserialize from data', () => {
        const player = new Player({
            name: 'Hero',
            numAttrs: { hp: 120 },
            txtAttrs: { status: 'poisoned' },
        });

        const data = player.toData();
        
        // UID can be unpredictable if tests run in parallel, so we check for its existence
        expect(data.uid).toBeDefined();
        expect(data).toMatchObject({
            name: 'Hero',
            type: 'Player',
            description: 'The main hero.',
            numAttrs: { values: { hp: 120 } },
            txtAttrs: { values: { status: "poisoned" } }, // TxtAttr defaults to 0 if not a boolean
        });

        const newPlayer = Player.fromData(data);
        expect(newPlayer.uid).toBe(data.uid);
        expect(newPlayer.name).toBe('Hero');
        expect(newPlayer.numAttrs.get('hp')).toBe(120);
    });
});