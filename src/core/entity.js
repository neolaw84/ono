// src/core/entity.js

class Entity {
    static nextUid = 0;

    constructor({ name, type, description, numAttrs = {}, txtAttrs = {}, NumAttributesClass, TxtAttributesClass }) {
        if (!NumAttributesClass || !TxtAttributesClass) {
            throw new Error("Entity constructor requires both 'NumAttributesClass' and 'TxtAttributesClass'.");
        }
        this.uid = Entity.nextUid++;
        this.name = name;
        this.type = type;
        this.description = description;
        this.numAttrs = new NumAttributesClass(numAttrs);
        this.txtAttrs = new TxtAttributesClass(txtAttrs);
    }
    
    toData() {
        return {
            uid: this.uid,
            name: this.name,
            type: this.type,
            description: this.description,
            numAttrs: this.numAttrs.toData(),
            txtAttrs: this.txtAttrs.toData(),
        };
    }
}

/**
 * Factory to create a specialized Entity class.
 * @param {{type: string, description?: string, NumAttributesClass: typeof import('./attributes.js').iAttributes, TxtAttributesClass: typeof import('./attributes.js').iAttributes}} config
 * @returns {typeof Entity} A class that extends Entity.
 */
function createEntityClass({ type, description, NumAttributesClass, TxtAttributesClass }) {
    if (!type || !NumAttributesClass || !TxtAttributesClass) throw new Error("createEntityClass factory requires 'type', 'NumAttributesClass', and 'TxtAttributesClass'.");
    
    const NewEntity = class extends Entity {
        constructor(instanceConfig) {
            super({
                ...instanceConfig,
                type: type,
                description: description || instanceConfig.description,
                NumAttributesClass: NumAttributesClass,
                TxtAttributesClass: TxtAttributesClass,
            });
        }
    };

    NewEntity.NumAttributesClass = NumAttributesClass;
    NewEntity.TxtAttributesClass = TxtAttributesClass;
    
    NewEntity.fromData = function(data) {
        const instance = new this({ name: data.name, description: data.description });
        instance.uid = data.uid;
        instance.numAttrs = this.NumAttributesClass.fromData(data.numAttrs);
        instance.txtAttrs = this.TxtAttributesClass.fromData(data.txtAttrs);
        return instance;
    };

    return NewEntity;
}

module.exports = { Entity, createEntityClass };