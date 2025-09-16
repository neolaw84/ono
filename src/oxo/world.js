/**
 * @file OXO Rulebook - World Module (Logic Layer)
 * @description Contains the singleton for managing global game state for the 'oxo' rulebook.
 * @implements {import('../core.js').iWorld}
 */

const { createAttributesClass, createEntityClass, createActionClass, EncounterPhaseTransitionBuilder, ActionPermissionGraphBuilder, Encounter } = require('../core.js');

// --- RULEBOOK DEFINITIONS ---

// 1. Attribute Structures
const CoreStats = createAttributesClass(['hp', 'mp', 'strength', 'defense']);
const StatusEffects = createAttributesClass(['poisoned', 'stunned', 'burning']);

// 2. Entity Classes
const Player = createEntityClass({ type: 'Player', NumAttributesClass: CoreStats, TxtAttributesClass: StatusEffects });
const Orc = createEntityClass({ type: 'Orc', NumAttributesClass: CoreStats, TxtAttributesClass: StatusEffects });
const Elf = createEntityClass({ type: 'Elf', NumAttributesClass: CoreStats, TxtAttributesClass: StatusEffects });

// 3. Action Classes
const HeavyStrike = createActionClass({
    name: "Heavy Strike", type: "Attack", allowedActioners: [Player, Orc], allowedActionees: [Player, Orc, Elf],
    cost: new CoreStats({ mp: 10 }), actionerMod: new CoreStats({ strength: 0.5 }),
    actioneeMod: new CoreStats({ defense: 0.2 }), effectVal: new CoreStats({ hp: -25 }),
    effectType: "add", effectMask: new CoreStats({ hp: true }),
});
const BasicAttack = createActionClass({ // A simple attack for Orcs
    name: "Basic Attack", type: "Attack", allowedActioners: [Orc], allowedActionees: [Player],
    cost: new CoreStats({}), actionerMod: new CoreStats({ strength: 0.3 }),
    actioneeMod: new CoreStats({ defense: 0.3 }), effectVal: new CoreStats({ hp: -10 }),
    effectType: "add", effectMask: new CoreStats({ hp: true }),
});


// --- GRAPH CONSTRUCTION (REFACTORED) ---

// 4. Phase Transition Graph - Simplified to manage states, not turns.
const phaseGraph = new EncounterPhaseTransitionBuilder()
    .addPhase('combat')
    .addTransition('__start__', 'combat', () => true) // Always start in combat
    .addTransition('combat', '__end__', (world) => world.isPlayerDefeated() || world.areAllEnemiesDefeated()) // After every action, check for victory
    .build();

// 5. Action Permission Graph - Uses the new 'combat' phase.
const permissionGraph = new ActionPermissionGraphBuilder()
    .addPermission(Player, Orc, 'combat', HeavyStrike)
    .addPermission(Orc, Player, 'combat', BasicAttack)
    .build();


// --- WORLD SINGLETON IMPLEMENTATION ---

class World {
    constructor(consoleInstance) {
        if (!consoleInstance) throw new Error("World requires a console instance.");
        this.console = consoleInstance;
        this.player = null;
        this.currentEncounter = null;
        this.phaseGraph = phaseGraph;
        this.permissionGraph = permissionGraph;
        this.Entities = { Player, Orc, Elf };
        this.Actions = { HeavyStrike, BasicAttack };
    }

    // --- State Check Helpers ---
    isPlayerDefeated() { return this.player && this.player.numAttrs.get('hp') <= 0; }
    areAllEnemiesDefeated() { return this.currentEncounter && this.currentEncounter.enemies.every(e => e.numAttrs.get('hp') <= 0); }
    
    // --- `iWorld` Methods ---

    /**
     * Gets the current encounter or creates a new one, including turn order.
     * @param {import('../core.js').Entity[]} enemies An array of enemy entities for the new encounter.
     * @returns {Encounter} The active encounter.
     */
    getOrCreateEncounter(enemies) {
        if (!this.player) throw new Error("Player must be created before an encounter can start.");
        if (!this.currentEncounter) {
            this.console.renderOnEnvironment("\n--- Encounter begins! ---");
            this.currentEncounter = new Encounter(enemies);

            // --- NEW: Turn Order Logic ---
            const allParticipants = [this.player, ...enemies];
            // Simple random shuffle to determine turn order
            this.currentEncounter.turnOrder = allParticipants
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
            
            this.currentEncounter.currentTurnIndex = 0;
            const turnOrderNames = this.currentEncounter.turnOrder.map(p => p.name).join(', ');
            this.console.renderOnEnvironment(`Turn order determined: ${turnOrderNames}`);
            this.console.renderOnEnvironment(`\n--- It's now ${this.getEntityForThisTurn().name}'s turn. ---`);
        }
        return this.currentEncounter;
    }
    
    /**
     * Advances the encounter to the next phase based on the transition graph.
     */
    updateEncounterPhase() {
        if (!this.currentEncounter) return;
        const currentPhase = this.currentEncounter.phase;
        const possibleTransitions = this.phaseGraph.edges.get(currentPhase) || [];
        for (const edge of possibleTransitions) {
            if (edge.condition(this)) {
                this.currentEncounter.phase = edge.to;
                this.console.renderOnEnvironment(`-- Phase changed: ${currentPhase} -> ${edge.to} --`);
                if (edge.to === '__end__') {
                    const playerWon = this.areAllEnemiesDefeated();
                    this.console.renderOnEnvironment(`--- Encounter ended. ${playerWon ? "Victory!" : "Defeat."} ---`);
                    this.currentEncounter = null;
                }
                return;
            }
        }
    }

    /**
     * Checks if an action is allowed by querying the permission graph.
     */
    isActionAllowedNow(action, actioner, actionee) {
        if (!this.currentEncounter || !actioner || !actionee) return false;
        const currentPhase = this.currentEncounter.phase;
        const fromKey = this.permissionGraph.getNodeKey(actioner.constructor, currentPhase);
        const toKey = this.permissionGraph.getNodeKey(actionee.constructor, currentPhase);
        const edges = this.permissionGraph.adj.get(fromKey) || [];
        const specificEdge = edges.find(e => e.to === toKey);
        return !!(specificEdge && specificEdge.actions.has(action.constructor));
    }

    // --- NEW: Turn Management Methods ---

    isPlayerTurn() {
        if (!this.currentEncounter) return false;
        return this.getEntityForThisTurn() === this.player;
    }

    updateTurn() {
        if (!this.currentEncounter) return;
        const nextIndex = (this.currentEncounter.currentTurnIndex + 1) % this.currentEncounter.turnOrder.length;
        this.currentEncounter.currentTurnIndex = nextIndex;
        const nextEntity = this.getEntityForThisTurn();
        this.console.renderOnEnvironment(`\n--- It's now ${nextEntity.name}'s turn. ---`);
    }

    getEntityForThisTurn() {
        if (!this.currentEncounter) return null;
        return this.currentEncounter.turnOrder[this.currentEncounter.currentTurnIndex];
    }

    determineEnemyAction(enemy) {
        // Simple AI: always use BasicAttack on the player if possible.
        if (enemy.type === 'Orc') {
            const attackAction = new this.Actions.BasicAttack({ worldInstance: this });
            if (this.isActionAllowedNow(attackAction, enemy, this.player)) {
                return attackAction;
            }
        }
        return null; // No valid action found
    }

    async getPlayerInput() {
        // In a real game, this would process actual user commands.
        // For this demo, we auto-select the first available action.
        const choices = this.getAllActionsAllowed(this.player);
        const choiceNames = choices.map(a => a.name.replace(' ', ''));
        this.console.renderOnEnvironment(`(Auto-selecting '${choiceNames[0]}' for demo purposes.)`);
        return choiceNames.length > 0 ? choiceNames[0] : null;
    }

    getAllActionsAllowed(player) {
        if (!this.currentEncounter) return [];
        const allowed = [];
        const potentialTargets = this.currentEncounter.enemies.filter(e => e.numAttrs.get('hp') > 0);
        for (const ActionClass of Object.values(this.Actions)) {
            const actionInstance = new ActionClass({ worldInstance: this });
            for (const target of potentialTargets) {
                 if(this.isActionAllowedNow(actionInstance, player, target)) {
                     allowed.push(actionInstance);
                     break; 
                 }
            }
        }
        return allowed;
    }

    showPlayerHUD(actionChoices) {
        this.console.flushPlayerHUD();
        this.console.renderOnPlayerHUD("Your turn! Available Actions:");
        if (actionChoices.length === 0) {
            this.console.renderOnPlayerHUD("- None");
        } else {
            actionChoices.forEach(action => {
                this.console.renderOnPlayerHUD(`- ${action.name} (Cost: ${action.cost.get('mp')} MP)`);
            });
        }
    }

    /**
     * Initializes the singleton instance of the World. This must be called before getInstance.
     * @param {import('../core.js').iONOConsole} consoleInstance
     */
    static initialize(consoleInstance) {
        if (!World.instance) {
            World.instance = new World(consoleInstance);
        }
    }

    /**
     * Gets the singleton instance. Throws an error if not initialized.
     * @returns {World}
     */
    static getInstance() {
        if (!World.instance) {
            throw new Error("World singleton has not been initialized. Call World.initialize(consoleInstance) first.");
        }
        return World.instance;
    }

    /**
     * Creates the player character based on user input.
     * @returns {Promise<Player>} A promise that resolves with the created player entity.
     */
    async createPlayerCharacter() {
        const playerName = await this.console.promptForInput("Enter your hero's name:");
        const player = new this.Entities.Player({
            name: playerName,
            numAttrs: { hp: 100, mp: 50, strength: 20, defense: 10 },
            txtAttrs: { poisoned: false, stunned: false, burning: false }
        });
        this.console.renderOnEnvironment(`A new hero is born: ${playerName}!`);
        return player;
    }


    // --- Event Interpretation & Logging Methods ---
    logActionAttempt(actioner, actionee, action) {
        this.console.renderOnEnvironment(`\n🎬 ${actioner.name} attempts '${action.name}' on ${actionee.name}.`);
    }

    logCost(entity, resourceName, cost, newValue) {
        this.console.renderOnEnvironment(`  💸 ${entity.name} pays ${cost} ${resourceName}. New value: ${newValue}`);
    }
    
    logRoll(details) {
        const { actioner, actionerRoll, actionerModValue, actionee, actioneeRoll, actioneeModValue, resultValue, outcome } = details;
        this.console.renderOnEnvironment(`  🎲 Roll: ${actioner.name} (${actionerRoll}) vs ${actionee.name} (${actioneeRoll}). Mods: ${actionerModValue.toFixed(2)} vs ${actioneeModValue.toFixed(2)}. Final Value: ${resultValue.toFixed(2)} -> ${outcome.toUpperCase()}`);
    }
    
    logEffect(entity, key, originalValue, newValue, bonusText = "") {
        this.console.renderOnEnvironment(`  ✨ Effect on ${entity.name}: ${key} changed from ${originalValue} to ${newValue}.${bonusText}`);
    }

    logNoEffect(outcome) {
        this.console.renderOnEnvironment(`  🤷 Action resulted in ${outcome}. No effect applied.`);
    }

    logPenalty(entity, reason) {
        this.console.renderOnEnvironment(`  ❗ Penalty for ${entity.name}: ${reason}`);
    }
    
    logHalt(reason) {
        this.console.renderOnEnvironment(`  🛑 HALT: ${reason}`);
    }
}

// Update createPlayerCharacter to store the player in the world instance
World.prototype.createPlayerCharacter = async function() {
    const playerName = await this.console.promptForInput("Enter your hero's name:");
    this.player = new this.Entities.Player({
        name: playerName,
        numAttrs: { hp: 100, mp: 50, strength: 20, defense: 10 },
    });
    this.console.renderOnEnvironment(`A new hero is born: ${this.player.name}!`);
    return this.player;
};

module.exports = { World };
