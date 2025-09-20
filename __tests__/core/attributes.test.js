// __tests__/core/attributes.test.js
const { createAttributesClass } = require('../../src/core/attributes.js');

describe('createAttributesClass', () => {
    const NumAttr = createAttributesClass(['hp', 'mp', 'strength']);

    it('should create a class with defined keys', () => {
        const attrs = new NumAttr();
        expect(attrs.keys()).toEqual(['hp', 'mp', 'strength']);
    });

    it('should initialize with default values (0 for numbers)', () => {
        const attrs = new NumAttr();
        expect(attrs.get('hp')).toBe(0);
        expect(attrs.get('mp')).toBe(0);
        expect(attrs.get('strength')).toBe(0);
    });

    it('should initialize with provided values', () => {
        const attrs = new NumAttr({ hp: 100, strength: 15 });
        expect(attrs.get('hp')).toBe(100);
        expect(attrs.get('mp')).toBe(0); // Default value
        expect(attrs.get('strength')).toBe(15);
    });

    it('should get and set values correctly', () => {
        const attrs = new NumAttr();
        attrs.set('hp', 50);
        expect(attrs.get('hp')).toBe(50);
    });

    it('should ignore setting values for undefined keys', () => {
        const attrs = new NumAttr();
        attrs.set('defense', 10); // 'defense' is not a defined key
        expect(attrs.get('defense')).toBeUndefined();
        expect(attrs.values.defense).toBeUndefined();
    });

    it('should convert to and from an array', () => {
        const attrs = new NumAttr({ hp: 100, mp: 50, strength: 10 });
        const array = attrs.toArray();
        expect(array).toEqual([100, 50, 10]);

        const newAttrs = new NumAttr();
        newAttrs.fromArray([80, 40, 5]);
        expect(newAttrs.get('hp')).toBe(80);
        expect(newAttrs.get('mp')).toBe(40);
        expect(newAttrs.get('strength')).toBe(5);
    });

    it('should serialize to and from data object', () => {
        const attrs = new NumAttr({ hp: 100 });
        const data = attrs.toData();
        expect(data).toEqual({ values: { hp: 100, mp: 0, strength: 0 } });

        const newAttrs = NumAttr.fromData(data);
        expect(newAttrs.get('hp')).toBe(100);
        expect(newAttrs.get('mp')).toBe(0);
    });
});