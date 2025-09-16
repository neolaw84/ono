/**
 * @file O&O RPG System Core
 * @description Contains the core Entity and Action classes, factories, and system interfaces.
 */

// #region Interfaces
class iAttributes { 
    constructor() { 
        if (this.constructor === iAttributes) throw new Error("Abstract class 'iAttributes' cannot be instantiated directly."); 
    } 
    toArray() { 
        throw new Error("Method 'toArray()' must be implemented."); 
    } 
    fromArray() { 
        throw new Error("Method 'fromArray()' must be implemented."); 
    } 
}
class iAction { constructor() { if (this.constructor === iAction) throw new Error("Abstract class 'iAction' cannot be instantiated directly."); } apply() { throw new Error("Method 'apply()' must be implemented."); } }
class iONOConsole { constructor() { if (this.constructor === iONOConsole) throw new Error("Abstract class 'iONOConsole' cannot be instantiated directly."); } renderOnEnvironment() { throw new Error("Method 'renderOnEnvironment()' must be implemented."); } promptForInput() { throw new Error("Method 'promptForInput()' must be implemented."); } }
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
    async getPlayerInput() { throw new Error("Method 'getPlayerInput()' must be implemented."); }
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

// #region Core Classes

/**
 * Represents the state of a single combat encounter.
 */
class Encounter {
    /**
     * @param {Entity[]} enemies An array of enemy entities.
     */
    constructor(enemies) {
        this.enemies = enemies;
        this.phase = "__start__";
        /** @type {Entity[]} An ordered array of all participants for turn tracking. */
        this.turnOrder = [];
        /** @type {number} The index in turnOrder of the current entity. */
        this.currentTurnIndex = 0;
    }
}

/**
 * Factory to create a specialized Attributes class.
 * @param {string[]} definedKeys - An array of strings representing the attribute keys.
 * @returns {typeof iAttributes} A class that extends iAttributes.
 */
function createAttributesClass(definedKeys) {
    return class extends iAttributes {
        #_keys = [];
        values = {};
        constructor(initialValues = {}) {
            super();
            this.#_keys = [...definedKeys];
            for (const key of this.#_keys) {
                // For boolean-like attributes, default to false instead of 0
                this.values[key] = initialValues[key] ?? (typeof initialValues[key] === 'boolean' ? false : 0);
            }
        }
        toArray() { return this.#_keys.map(key => this.values[key]); }
        fromArray(array) {
            this.#_keys.forEach((key, index) => {
                if (array[index] !== undefined) {
                    this.values[key] = array[index];
                }
            });
        }
        get(key) { return this.values[key]; }
        set(key, value) { if (this.#_keys.includes(key)) { this.values[key] = value; } }
        keys() { return [...this.#_keys]; }
    };
}

const rollD20 = () => Math.floor(Math.random() * 20) + 1;
class Entity {
    constructor({ name, type, description, numAttrs = {}, txtAttrs = {}, NumAttributesClass, TxtAttributesClass }) {
        if (!NumAttributesClass || !TxtAttributesClass) {
            throw new Error("Entity constructor requires both 'NumAttributesClass' and 'TxtAttributesClass'.");
        }
        this.name = name;
        this.type = type;
        this.description = description;
        this.numAttrs = new NumAttributesClass(numAttrs);
        this.txtAttrs = new TxtAttributesClass(txtAttrs);
    }
}
/**
 * Factory to create a specialized Entity class.
 * @param {{type: string, description?: string, NumAttributesClass: typeof iAttributes, TxtAttributesClass: typeof iAttributes}} config
 * @returns {typeof Entity} A class that extends Entity.
 */
function createEntityClass({ type, description, NumAttributesClass, TxtAttributesClass }) {
    if (!type || !NumAttributesClass || !TxtAttributesClass) throw new Error("createEntityClass factory requires 'type', 'NumAttributesClass', and 'TxtAttributesClass'.");
    return class extends Entity {
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
}

class Action extends iAction {
    constructor({
        name, type, description,
        // allowedActioners and allowedActionees are no longer needed here
        cost, actionerMod, actioneeMod, effectVal, effectType, effectMask,
        worldInstance
    }) {
        super();
        this.name = name; this.type = type; this.description = description;
        // These properties are kept for informational purposes but not used for checks in apply()
        // this.allowedActioners = allowedActioners; 
        // this.allowedActionees = allowedActionees;
        this.cost = cost; this.actionerMod = actionerMod; this.actioneeMod = actioneeMod;
        this.effectVal = effectVal; this.effectType = effectType; this.effectMask = effectMask;
        
        if (!worldInstance) {
            throw new Error("Action constructor requires 'worldInstance'.");
        }
        this.world = worldInstance; 
    }

    _canAfford(actioner) {
        return this.cost.keys().every(key => actioner.numAttrs.get(key) >= this.cost.get(key));
    }

    apply(actioner, actionee) {
        this.world.logActionAttempt(actioner, actionee, this);

        // --- UPDATED CHECKS ---
        // 1. A single, powerful check using the new graph-based method.
        //    It verifies the phase, actioner type, and actionee type all at once.
        if (!this.world.isActionAllowedNow(this, actioner, actionee)) {
            this.world.logHalt(`Action '${this.name}' is not allowed right now.`);
            return { outcome: "not_allowed" };
        }

        // 2. The affordability check remains.
        if (!this._canAfford(actioner)) {
            this.world.logHalt("Cannot afford cost.");
            return { outcome: "cannot_afford" };
        }
        // --- END OF UPDATED CHECKS ---

        // 1. Pay cost
        for (const key of this.cost.keys()) {
            const costValue = this.cost.get(key);
            if (costValue > 0) {
                const newValue = actioner.numAttrs.get(key) - costValue;
                actioner.numAttrs.set(key, newValue);
                this.world.logCost(actioner, key, costValue, newValue);
            }
        }

        const actionerModValue = this.actionerMod.keys().reduce((s, k) => s + (this.actionerMod.get(k) * actioner.numAttrs.get(k)), 0);
        const actioneeModValue = this.actioneeMod.keys().reduce((s, k) => s + (this.actioneeMod.get(k) * actionee.numAttrs.get(k)), 0);
        const actionerRoll = rollD20(); const actioneeRoll = rollD20();
        const resultValue = (actionerRoll + actionerModValue) - (actioneeRoll + actioneeModValue);
        let outcome;
        if (resultValue < -12) outcome = "critical failure"; else if (resultValue < 0) outcome = "failure"; else if (resultValue < 11) outcome = "success"; else if (resultValue >= 11) outcome = "critical success";
        this.world.logRoll({ actioner, actionerRoll, actionerModValue, actionee, actioneeRoll, actioneeModValue, resultValue, outcome });

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
                    this.world.logEffect(actionee, key, originalValue, newValue, outcome === "critical success" ? " (Critical Bonus!)" : "");
                }
            }
        } else if (outcome === "critical failure") {
            this.world.logPenalty(actioner, "pays cost again due to critical failure.");
            for (const key of this.cost.keys()) {
                if (this.cost.get(key) > 0) {
                    const newValue = Math.max(0, actioner.numAttrs.get(key) - this.cost.get(key));
                    actioner.numAttrs.set(key, newValue); this.world.logCost(actioner, key, this.cost.get(key), newValue);
                }
            }
        } else { this.world.logNoEffect(outcome); }
        
        return { outcome, resultValue };
    }
}

/**
 * Factory to create a specialized Action class.
 * @param {{name: string, type: string, description: string, allowedActioners: (typeof Entity)[], allowedActionees: (typeof Entity)[], cost: iAttributes, actionerMod: iAttributes, actioneeMod: iAttributes, effectVal: iAttributes, effectType: string, effectMask: iAttributes}} config
 * @returns {typeof Action} A class that extends Action.
 */
function createActionClass(config) {
    return class extends Action {
        constructor({ worldInstance }) {
            super({ ...config, worldInstance });
        }
    };
}


module.exports = { 
    iAttributes, iWorld, iONOConsole, iAction, 
    Entity, Action, Encounter,
    createAttributesClass, createEntityClass, createActionClass,
    EncounterPhaseTransitionBuilder, ActionPermissionGraphBuilder
};