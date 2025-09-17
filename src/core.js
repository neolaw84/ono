/**
 * @file O&O RPG System Core
 * @description Contains the core Entity and Action classes, factories, and system interfaces.
 */

// #region Interfaces
class iAttributes { 
    constructor() { 
        if (this.constructor === iAttributes) throw new Error("Abstract class 'iAttributes' cannot be instantiated directly."); 
    } 
    /**
     * Gets the value of a specific attribute.
     * @param {string} key The name of the attribute.
     */
    get(key) { throw new Error("Method 'get(key)' must be implemented."); }
    /**
     * Sets the value of a specific attribute.
     * @param {string} key The name of the attribute.
     * @param {*} value The new value.
     */
    set(key, value) { throw new Error("Method 'set(key, value)' must be implemented."); }
    /**
     * Returns an array of all attribute keys.
     * @returns {string[]}
     */
    keys() { throw new Error("Method 'keys()' must be implemented."); }
    toArray() { throw new Error("Method 'toArray()' must be implemented."); } 
    fromArray() { throw new Error("Method 'fromArray()' must be implemented."); } 
    /**
     * Serializes the attribute's state to a plain object.
     * @returns {object} A serializable object.
     */
    toData() { throw new Error("Method 'toData()' must be implemented."); }
    /**
     * Deserializes data into a new class instance.
     * @param {object} data The plain object to deserialize.
     * @returns {iAttributes} A new instance of the class.
     */
    static fromData(data) { throw new Error("Static method 'fromData()' must be implemented."); }
}

class iAction { 
    constructor() { if (this.constructor === iAction) throw new Error("Abstract class 'iAction' cannot be instantiated directly."); } 
    apply() { throw new Error("Method 'apply()' must be implemented."); } 
    toData() { throw new Error("Method 'toData()' must be implemented."); }
    static fromData(data, context) { throw new Error("Static method 'fromData()' must be implemented."); }
}

class iONOConsole { 
    constructor() { if (this.constructor === iONOConsole) throw new Error("Abstract class 'iONOConsole' cannot be instantiated directly."); } 
    // This method is now removed from the interface
    // renderOnEnvironment() { throw new Error("Method 'renderOnEnvironment()' must be implemented."); } 
    getRawPlayerInput(text) { throw new Error("Method 'getRawPlayerInput()' must be implemented."); }
    parsePlayerInput(rawInput, worldInstance) { throw new Error("Method 'promptForRawInput(text, worldInstance)' must be implemented."); }
    /**
     * Buffers a structured game event for later processing.
     * @param {string} eventName The name of the event (e.g., 'roll', 'effect').
     * @param {object} data The data associated with the event.
     */
    /**
     * Renders text to the primary player display (e.g., a HUD).
     * @param {string} text The text to display.
     */
    renderOnPlayerHUD(text) { throw new Error("Method 'renderOnPlayerHUD()' must be implemented."); }
    /**
     * Takes all buffered HUD text and displays it.
     */
    flushPlayerHUD() { throw new Error("Method 'flushPlayerHUD()' must be implemented."); }
    /**
     * Buffers a structured game event for later processing.
     * @param {string} eventName The name of the event (e.g., 'roll', 'effect').
     * @param {object | string} data The data associated with the event.
     */
    bufferEvent(eventName, data) { throw new Error("Method 'bufferEvent()' must be implemented."); }
    /**
     * Flushes all buffered events to the environment/main display.
     */
    flushEnvironment() { throw new Error("Method 'flushEnvironment()' must be implemented."); }
    toData() { throw new Error("Method 'toData()' must be implemented."); }
    static fromData(data) { throw new Error("Static method 'fromData()' must be implemented."); }
}

class iWorld { 
    constructor() { if (this.constructor === iWorld) throw new Error("Abstract class 'iWorld' cannot be instantiated directly."); }
    getOrCreateEncounter(enemies) { throw new Error("Method 'getOrCreateEncounter()' must be implemented."); }
    updateEncounterPhase() { throw new Error("Method 'updateEncounterPhase()' must be implemented."); }
    isActionAllowedNow(action, actioner, actionee) { throw new Error("Method 'isActionAllowedNow()' must be implemented."); }
    isPlayerDefeated() { throw new Error("Method 'isPlayerDefeated()' must be implemented."); }
    areAllEnemiesDefeated() { throw new Error("Method 'areAllEnemiesDefeated()' must be implemented."); }
    isPlayerTurn() { throw new Error("Method 'isPlayerTurn()' must be implemented."); }
    updateTurn() { throw new Error("Method 'updateTurn()' must be implemented."); }
    getEntityForThisTurn() { throw new Error("Method 'getEntityForThisTurn()' must be implemented."); }
    determineEnemyAction(enemy) { throw new Error("Method 'determineEnemyAction()' must be implemented."); }
    getAllActionsAllowed(player) { throw new Error("Method 'getAllActionsAllowed()' must be implemented."); }
    showPlayerHUD(actionChoices) { throw new Error("Method 'showPlayerHUD()' must be implemented."); }
    getPlayerInput(text) { throw new Error("Method 'getPlayerInput(text)' must be implemented."); }
    /**
     * Creates and returns the primary player entity for the game.
     * @returns {Entity} The created player character.
     */
    createPlayerCharacter() { throw new Error("Method 'createPlayerCharacter()' must be implemented."); }
    toData() { throw new Error("Method 'toData()' must be implemented."); }
    static fromData(data, consoleInstance) { throw new Error("Static method 'fromData()' must be implemented."); }
}
// #endregion Interfaces

// #region Graph Builders

/**
 * A builder for creating a directed graph to manage encounter phase transitions.
 * Uses a fluent API for easy construction.
 */
class EncounterPhaseTransitionBuilder {
    constructor() {
        this.nodes = new Set(['__start__', '__end__']);
        this.edges = new Map();
    }

    /**
     * Adds a new phase (node) to the graph.
     * @param {string} phase The name of the phase.
     * @returns {EncounterPhaseTransitionBuilder} The builder instance for chaining.
     */
    addPhase(phase) {
        this.nodes.add(phase);
        return this;
    }

    /**
     * Adds a transition (directed edge) between two phases.
     * @param {string} from The starting phase.
     * @param {string} to The destination phase.
     * @param {(world: iWorld) => boolean} condition A function that returns true if the transition is valid.
     * @returns {EncounterPhaseTransitionBuilder} The builder instance for chaining.
     */
    addTransition(from, to, condition) {
        if (!this.nodes.has(from) || !this.nodes.has(to)) {
            throw new Error(`Both phases "${from}" and "${to}" must be added before creating a transition.`);
        }
        if (!this.edges.has(from)) {
            this.edges.set(from, []);
        }
        this.edges.get(from).push({ to, condition });
        return this;
    }

    /**
     * Finalizes and returns the graph structure.
     * @returns {{nodes: Set<string>, edges: Map<string, {to: string, condition: (world: iWorld) => boolean}[]>}}
     */
    build() {
        return {
            nodes: this.nodes,
            edges: this.edges,
        };
    }
}


/**
 * A builder for creating a directed graph to manage action permissions.
 * The graph determines which actions are allowed based on entity types and the current encounter phase.
 */
class ActionPermissionGraphBuilder {
    constructor() {
        // Adjacency list: Map<sourceNodeKey, Array<{to: targetNodeKey, actions: Set<typeof iAction>}>>
        this.adj = new Map();
    }

    /**
     * Creates a unique key for a node from an entity class and a phase name.
     * @private
     */
    _getNodeKey(EntityClass, phase) {
        return `${EntityClass.name}::${phase}`;
    }

    /**
     * Adds a permission for an action.
     * @param {typeof Entity} FromEntityClass The class of the entity performing the action.
     * @param {typeof Entity} ToEntityClass The class of the entity being targeted.
     * @param {string} inPhase The encounter phase in which this action is allowed.
     * @param {typeof iAction} allowedActionClass The action class that is permitted.
     * @returns {ActionPermissionGraphBuilder} The builder instance for chaining.
     */
    addPermission(FromEntityClass, ToEntityClass, inPhase, allowedActionClass) {
        const fromKey = this._getNodeKey(FromEntityClass, inPhase);
        const toKey = this._getNodeKey(ToEntityClass, inPhase);

        if (!this.adj.has(fromKey)) {
            this.adj.set(fromKey, []);
        }

        const edges = this.adj.get(fromKey);
        let edge = edges.find(e => e.to === toKey);

        if (!edge) {
            edge = { to: toKey, actions: new Set() };
            edges.push(edge);
        }

        edge.actions.add(allowedActionClass);
        return this;
    }
    
    /**
     * Finalizes and returns the graph structure.
     * @returns {{ adj: Map<string, {to: string, actions: Set<typeof iAction>}[]>, getNodeKey: (EntityClass: typeof Entity, phase: string) => string }}
     */
    build() {
        return {
            adj: this.adj,
            getNodeKey: this._getNodeKey
        };
    }
}

// #endregion Graph Builders

/**
 * Represents the state of a single combat encounter.
 */
class Encounter {
    constructor(enemies) {
        this.enemies = enemies;
        this.phase = "__start__";
        this.turnOrder = [];
        this.currentTurnIndex = 0;
    }

    /**
     * Serializes the encounter's state. References entities by their unique ID.
     * @returns {object} A serializable object.
     */
    toData() {
        return {
            phase: this.phase,
            currentTurnIndex: this.currentTurnIndex,
            enemies: this.enemies.map(e => e.uid),
            turnOrder: this.turnOrder.map(e => e.uid),
        };
    }

    /**
     * Deserializes data to create a new Encounter instance.
     * @param {object} data The plain object to deserialize.
     * @param {Map<number, Entity>} entityMap A map of UIDs to fully constructed Entity instances.
     * @returns {Encounter} A new instance of the Encounter.
     */
    static fromData(data, entityMap) {
        const enemies = data.enemies.map(uid => entityMap.get(uid)).filter(Boolean); // Filter out any undefineds
        const encounter = new Encounter(enemies);
        encounter.phase = data.phase;
        encounter.currentTurnIndex = data.currentTurnIndex;
        encounter.turnOrder = data.turnOrder.map(uid => entityMap.get(uid)).filter(Boolean);
        return encounter;
    }
}

/**
 * Factory to create a specialized Attributes class.
 * @param {string[]} definedKeys - An array of strings representing the attribute keys.
 * @returns {typeof iAttributes} A class that extends iAttributes.
 */
function createAttributesClass(definedKeys) {
    const AttrClass = class extends iAttributes {
        #_keys = [];
        values = {};
        constructor(initialValues = {}) {
            super();
            this.#_keys = [...definedKeys];
            for (const key of this.#_keys) {
                this.values[key] = initialValues[key] ?? (typeof initialValues[key] === 'boolean' ? false : 0);
            }
        }
        toArray() { return this.#_keys.map(key => this.values[key]); }
        fromArray(array) {
            this.#_keys.forEach((key, index) => {
                if (array[index] !== undefined) { this.values[key] = array[index]; }
            });
        }
        get(key) { return this.values[key]; }
        set(key, value) { if (this.#_keys.includes(key)) { this.values[key] = value; } }
        keys() { return [...this.#_keys]; }
        toData() { return { values: this.values }; }
    };
    
    /**
     * @param {object} data The plain object containing 'values'.
     * @returns {iAttributes} A new instance of this specific Attributes class.
     */
    AttrClass.fromData = function(data) {
        const instance = new this();
        // Only restore keys that are defined for this class
        for (const key of instance.keys()) {
            if (data.values && key in data.values) {
                instance.set(key, data.values[key]);
            }
        }
        return instance;
    };

    return AttrClass;
}

const rollD20 = () => Math.floor(Math.random() * 20) + 1;


class Entity {
    // Static counter to ensure unique IDs within a game session.
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
    
    /**
     * Serializes the entity's state to a plain object.
     * @returns {object} A serializable object.
     */
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
 * @param {{type: string, description?: string, NumAttributesClass: typeof iAttributes, TxtAttributesClass: typeof iAttributes}} config
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

    // Attach the attribute classes for deserialization purposes
    NewEntity.NumAttributesClass = NumAttributesClass;
    NewEntity.TxtAttributesClass = TxtAttributesClass;
    
    /**
     * Deserializes data to create a new instance of this specific Entity class.
     * @param {object} data The plain object to deserialize.
     * @returns {Entity} A new instance.
     */
    NewEntity.fromData = function(data) {
        // Create instance without initial attributes to avoid overhead
        const instance = new this({ name: data.name, description: data.description });
        // Restore state and overwrite the default attributes with deserialized ones
        instance.uid = data.uid;
        instance.numAttrs = this.NumAttributesClass.fromData(data.numAttrs);
        instance.txtAttrs = this.TxtAttributesClass.fromData(data.txtAttrs);
        return instance;
    };

    return NewEntity;
}

class Action extends iAction {
    constructor({
        name, type, description, cost, actionerMod, actioneeMod, 
        effectVal, effectType, effectMask, worldInstance
    }) {
        super();
        this.name = name; this.type = type; this.description = description;
        this.cost = cost; this.actionerMod = actionerMod; this.actioneeMod = actioneeMod;
        this.effectVal = effectVal; this.effectType = effectType; this.effectMask = effectMask;
        
        if (!worldInstance) { throw new Error("Action constructor requires 'worldInstance'."); }
        this.world = worldInstance; 
    }

    _canAfford(actioner) {
        return this.cost.keys().every(key => actioner.numAttrs.get(key) >= this.cost.get(key));
    }

    apply(actioner, actionee) {
        const attemptText = this.world.formatter.format('actionAttempt', { actioner, actionee, action: this });
        this.world.console.bufferEvent("action", attemptText);

        if (!this.world.isActionAllowedNow(this, actioner, actionee)) {
            const haltText = this.world.formatter.format('halt', { reason: `Action '${this.name}' is not allowed right now.` });
            this.world.console.bufferEvent("info", haltText);
            return { outcome: "not_allowed" };
        }
        if (!this._canAfford(actioner)) {
            const haltText = this.world.formatter.format('halt', { reason: "Cannot afford cost." });
            this.world.console.bufferEvent("info", haltText);
            return { outcome: "cannot_afford" };
        }

        for (const key of this.cost.keys()) {
            const costValue = this.cost.get(key);
            if (costValue > 0) {
                const newValue = actioner.numAttrs.get(key) - costValue;
                actioner.numAttrs.set(key, newValue);
                const costText = this.world.formatter.format('costPaid', { entity: actioner, resourceName: key, cost: costValue, newValue });
                this.world.console.bufferEvent("battle", costText);
            }
        }

        const actionerModValue = this.actionerMod.keys().reduce((s, k) => s + (this.actionerMod.get(k) * actioner.numAttrs.get(k)), 0);
        const actioneeModValue = this.actioneeMod.keys().reduce((s, k) => s + (this.actioneeMod.get(k) * actionee.numAttrs.get(k)), 0);
        const actionerRoll = rollD20(); const actioneeRoll = rollD20();
        const resultValue = (actionerRoll + actionerModValue) - (actioneeRoll + actioneeModValue);
        let outcome;
        if (resultValue < -12) outcome = "critical failure"; else if (resultValue < 0) outcome = "failure"; else if (resultValue < 11) outcome = "success"; else if (resultValue >= 11) outcome = "critical success";
        
        const rollText = this.world.formatter.format('rollResult', { actioner, actionerRoll, actionerModValue, actionee, actioneeRoll, actioneeModValue, resultValue, outcome });
        this.world.console.bufferEvent("info", rollText);

        if (outcome === "success" || outcome === "critical success") {
            for (const key of this.effectMask.keys()) {
                if (this.effectMask.get(key)) {
                    const originalValue = actionee.numAttrs.get(key); let newValue = originalValue;
                    if (this.effectType === "set") { newValue = this.effectVal.get(key); }
                    else if (this.effectType === "add") {
                        let effectAmount = this.effectVal.get(key);
                        if (outcome === "critical success") { effectAmount *= 2; }
                        newValue = originalValue + effectAmount;
                    }
                    actionee.numAttrs.set(key, newValue);
                    
                    const effectText = this.world.formatter.format('effectApplied', { entity: actionee, key, originalValue, newValue, bonusText: outcome === "critical success" ? " (Critical Bonus!)" : "" });
                    this.world.console.bufferEvent("battle", effectText);
                }
            }
        } else if (outcome === "critical failure") {
            const penaltyText = this.world.formatter.format('penalty', { entity: actioner, reason: "pays cost again due to critical failure." });
            this.world.console.bufferEvent("battle", penaltyText);
            
            for (const key of this.cost.keys()) {
                if (this.cost.get(key) > 0) {
                    const costAgain = this.cost.get(key)
                    const newValue = Math.max(0, actioner.numAttrs.get(key) - costAgain);
                    actioner.numAttrs.set(key, newValue); 
                    const costText = this.world.formatter.format('costPaid', { entity: actioner, resourceName: key, cost: costAgain, newValue });
                    this.world.console.bufferEvent("battle", costText);
                }
            }
        } else {
            const noEffectText = this.world.formatter.format('noEffect', { outcome });
            this.world.console.bufferEvent("battle", noEffectText);
        }
        
        return { outcome, resultValue };
    }

    /**
     * Serializes the action's configuration. Excludes the circular 'world' reference.
     * @returns {object} A serializable object.
     */
    toData() {
        return {
            name: this.name, type: this.type, description: this.description,
            cost: this.cost.toData(),
            actionerMod: this.actionerMod.toData(),
            actioneeMod: this.actioneeMod.toData(),
            effectVal: this.effectVal.toData(),
            effectType: this.effectType,
            effectMask: this.effectMask.toData(),
        };
    }
}

/**
 * Factory to create a specialized Action class.
 * @param {object} config - The action configuration.
 * @returns {typeof Action} A class that extends Action.
 */
function createActionClass(config) {
    const NewAction = class extends Action {
        constructor({ worldInstance }) {
            super({ ...config, worldInstance });
        }
    };
    
    /**
     * Statically attach the config for easy access without instantiation. This is
     * crucial for avoiding serialization errors in environments like AI Dungeon,
     * as it allows us to read action properties (like name) without creating
     * a full, non-serializable instance.
     */
    NewAction.config = config;
    /**
     * Deserializes data to create a new Action instance.
     * Note: Actions are typically stateless definitions. It's often easier to 
     * re-instantiate them from the rulebook (`new world.Actions.ActionName(...)`).
     * This method is provided for completeness.
     * @param {object} data The plain object to deserialize.
     * @param {{worldInstance: iWorld}} context Requires the world instance.
     * @returns {Action} A new instance of this Action class.
     */
    NewAction.fromData = function(data, { worldInstance }) {
        // Re-create the config for the constructor by deserializing attribute data
        const newConfig = {
            ...data,
            cost: config.cost.constructor.fromData(data.cost),
            actionerMod: config.actionerMod.constructor.fromData(data.actionerMod),
            actioneeMod: config.actioneeMod.constructor.fromData(data.actioneeMod),
            effectVal: config.effectVal.constructor.fromData(data.effectVal),
            effectMask: config.effectMask.constructor.fromData(data.effectMask),
        };
        return new NewAction({ ...newConfig, worldInstance });
    };

    return NewAction;
}

module.exports = { 
    iAttributes, iWorld, iONOConsole, iAction, 
    Entity, Action, Encounter,
    createAttributesClass, createEntityClass, createActionClass,
    EncounterPhaseTransitionBuilder, ActionPermissionGraphBuilder
};