/**
 * @file OXO Rulebook - World Module (Logic Layer)
 * @description Contains the singleton for managing global game state for the 'oxo' rulebook.
 * @implements {import('../core.js').iWorld}
 */

const { createAttributesClass, createEntityClass, createActionClass, EncounterPhaseTransitionBuilder, ActionPermissionGraphBuilder, Encounter, Entity } = require('../core.js');

/**
 * The introductory plot text for the game.
 * @type {string}
 */
const plotEssentials = `
You are a heroic adventurer in a fantasy world filled with danger and excitement. 
Your journey begins in a small village, but soon you will face fierce orcs, cunning elves, and other mythical creatures. 
Use your strength and wits to survive and thrive in this perilous land.
`;

/**
 * Instructions for the AI on how to write.
 * @type {string}
 */
const authorsNote = `
Write in a descriptive and engaging style, focusing on the action and the environment.
`;

/**
 * Core statistical attributes for entities.
 * @type {Attributes}
 */
const CoreStats = createAttributesClass(['hp', 'mp', 'strength', 'defense']);

/**
 * Status effect attributes for entities.
 * @type {Attributes}
 */
const StatusEffects = createAttributesClass(['poisoned', 'stunned', 'burning']);

/**
 * The player character entity class.
 * @type {Entity}
 */
const Player = createEntityClass({ type: 'Player', NumAttributesClass: CoreStats, TxtAttributesClass: StatusEffects });

/**
 * The Orc entity class.
 * @type {Entity}
 */
const Orc = createEntityClass({ type: 'Orc', NumAttributesClass: CoreStats, TxtAttributesClass: StatusEffects });

/**
 * The Elf entity class.
 * @type {Entity}
 */
const Elf = createEntityClass({ type: 'Elf', NumAttributesClass: CoreStats, TxtAttributesClass: StatusEffects });

/**
 * A powerful melee attack.
 * @type {Action}
 */
const HeavyStrike = createActionClass({
    name: "Heavy Strike", type: "Attack", allowedActioners: [Player, Orc], allowedActionees: [Player, Orc, Elf],
    cost: new CoreStats({ mp: 1 }), actionerMod: new CoreStats({ strength: 0.5 }),
    actioneeMod: new CoreStats({ defense: 0.2 }), effectVal: new CoreStats({ hp: -2 }),
    effectType: "add", effectMask: new CoreStats({ hp: true }),
});

/**
 * A basic melee attack.
 * @type {Action}
 */
const BasicAttack = createActionClass({ 
    name: "Basic Attack", type: "Attack", allowedActioners: [Orc], allowedActionees: [Player],
    cost: new CoreStats({}), actionerMod: new CoreStats({ strength: 0.3 }),
    actioneeMod: new CoreStats({ defense: 0.3 }), effectVal: new CoreStats({ hp: -1 }),
    effectType: "add", effectMask: new CoreStats({ hp: true }),
});

/**
 * The phase transition graph for encounters.
 * @type {EncounterPhaseTransitionBuilder}
 */
const phaseGraph = new EncounterPhaseTransitionBuilder()
    .addPhase('combat')
    .addTransition('__start__', 'combat', () => true) 
    .addTransition('combat', '__end__', (world) => world.isPlayerDefeated() || world.areAllEnemiesDefeated()) 
    .build();

/**
 * The action permission graph for the game.
 * @type {ActionPermissionGraphBuilder}
 */
const permissionGraph = new ActionPermissionGraphBuilder()
    .addPermission(Player, Orc, 'combat', HeavyStrike)
    .addPermission(Orc, Player, 'combat', BasicAttack)
    .build();

/**
 * The main World class, implemented as a singleton.
 * @implements {iWorld}
 */
class World {
    /**
     * @param {iONOConsole} consoleInstance - The console instance for I/O.
     * @param {EventFormatter} formatterInstance - The event formatter instance.
     */
    constructor(consoleInstance, formatterInstance) {
        if (!consoleInstance) throw new Error("World requires a console instance.");
        if (!formatterInstance) throw new Error("World requires a formatter instance.");
        this.console = consoleInstance;
        this.formatter = formatterInstance; 
        this.player = null;
        this.currentEncounter = null;
        this.phaseGraph = phaseGraph;
        this.permissionGraph = permissionGraph;
        this.Entities = { Player, Orc, Elf };
        this.Actions = { HeavyStrike, BasicAttack };
    }

    /**
     * Checks if the player is defeated.
     * @returns {boolean} True if the player's HP is 0 or less.
     */
    isPlayerDefeated() { return this.player && this.player.numAttrs.get('hp') <= 0; }

    /**
     * Checks if all enemies in the current encounter are defeated.
     * @returns {boolean} True if all enemies have 0 or less HP.
     */
    areAllEnemiesDefeated() { return this.currentEncounter && this.currentEncounter.enemies.every(e => e.numAttrs.get('hp') <= 0); }
    
    /**
     * Gets the current encounter or creates a new one.
     * @param {Entity[]} enemies - The enemies in the encounter.
     * @returns {Encounter} The current or new encounter.
     */
    getOrCreateEncounter(enemies) {
        if (!this.player) throw new Error("Player must be created before an encounter can start.");
        if (!this.currentEncounter) {
            this.console.bufferEvent('plot', this.formatter.format('encounterStart'));

            this.currentEncounter = new Encounter(enemies);
            const allParticipants = [this.player, ...enemies];
            this.currentEncounter.turnOrder = allParticipants
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
            this.currentEncounter.currentTurnIndex = 0;
            
            const turnText = this.formatter.format('turnStart', { entity: this.getEntityForThisTurn() });
            this.console.bufferEvent("battle", turnText);
        }
        return this.currentEncounter;
    }
    
    /**
     * Updates the encounter phase based on the phase graph.
     */
    updateEncounterPhase() {
        if (!this.currentEncounter) return;
        const currentPhase = this.currentEncounter.phase;
        const possibleTransitions = this.phaseGraph.edges.get(currentPhase) || [];
        for (const edge of possibleTransitions) {
            if (edge.condition(this)) {
                this.currentEncounter.phase = edge.to;
                
                this.console.bufferEvent('critical', `phase changed from: ${currentPhase}, to: ${edge.to}`);
                
                if (edge.to === '__end__') {
                    const playerWon = this.areAllEnemiesDefeated();
                    const endText = this.formatter.format('encounterEnd', { playerWon });
                    this.console.bufferEvent('critical', endText);
                    this.currentEncounter = null;
                }
                return;
            }
        }
    }

    /**
     * Checks if an action is allowed in the current context.
     * @param {Action} action - The action to check.
     * @param {Entity} actioner - The entity performing the action.
     * @param {Entity} actionee - The entity receiving the action.
     * @returns {boolean} True if the action is allowed.
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

    /**
     * Checks if it is the player's turn.
     * @returns {boolean} True if it is the player's turn.
     */
    isPlayerTurn() {
        if (!this.currentEncounter) return false;
        return this.getEntityForThisTurn() === this.player;
    }

    /**
     * Determines the enemy's action for the current turn.
     * @param {Entity} enemy - The enemy entity.
     * @returns {Action|null} The action the enemy will perform, or null if no action is possible.
     */
    determineEnemyAction(enemy) {
        
        if (enemy.type === 'Orc') {
            const attackAction = new this.Actions.BasicAttack({ worldInstance: this });
            if (this.isActionAllowedNow(attackAction, enemy, this.player)) {
                return attackAction;
            }
        }
        return null; 
    }

    /**
     * Gets the player's input.
     * @returns {string} The player's chosen action.
     */
    getPlayerInput() {
        
        
        const choices = this.getAllActionsAllowed(this.player);
        const choiceNames = choices.map(a => a.actionName.replace(' ', ''));
        let playerChoice = choiceNames[0]; 
        this.console.bufferEvent("action", `Player selected '${playerChoice}'`);
        return playerChoice;
    }

    /**
     * Gets all actions allowed for the player in the current context.
     * @param {Entity} player - The player entity.
     * @returns {{actionName: string, targetIndex: number}[]} A list of allowed moves.
     */
    getAllActionsAllowed(player) {
        if (!this.currentEncounter) return [];
        const allowedMoves = [];
        
        
        const potentialTargets = this.currentEncounter.enemies
            .map((enemy, index) => ({ entity: enemy, index }))
            .filter(target => target.entity.numAttrs.get('hp') > 0);

        
        
        for (const [actionKey, ActionClass] of Object.entries(this.Actions)) {
            
            
            
            const dummyAction = { constructor: ActionClass };

            for (const target of potentialTargets) {
                if (this.isActionAllowedNow(dummyAction, player, target.entity)) {
                    allowedMoves.push({
                        actionName: actionKey, 
                        targetIndex: target.index
                    });
                }
            }
        }
        return allowedMoves;
    }

    /**
     * Shows the player HUD with available actions.
     * @param {{actionName: string, targetIndex: number}[]} allowedMoves - The list of allowed moves.
     */
    showPlayerHUD(allowedMoves) {
        if (allowedMoves.length > 0) {
            allowedMoves.forEach(move => {
                const command = `#${move.actionName}_${move.targetIndex}`;
                this.console.renderOnPlayerHUD(command);
            });
        }
    }

    /**
     * Updates the turn to the next entity in the turn order.
     */
    updateTurn() {
        if (!this.currentEncounter) return;
        const nextIndex = (this.currentEncounter.currentTurnIndex + 1) % this.currentEncounter.turnOrder.length;
        this.currentEncounter.currentTurnIndex = nextIndex;
        const nextEntity = this.getEntityForThisTurn();

        const turnText = this.formatter.format('turnStart', { entity: nextEntity });
        this.console.bufferEvent('battle', turnText);
    }

    /**
     * Gets the entity whose turn it is.
     * @returns {Entity|null} The current entity, or null if not in an encounter.
     */
    getEntityForThisTurn() {
        if (!this.currentEncounter) return null;
        return this.currentEncounter.turnOrder[this.currentEncounter.currentTurnIndex];
    }

    /**
     * Initializes the World singleton.
     * @param {iONOConsole} consoleInstance - The console instance.
     * @param {EventFormatter} formatterInstance - The event formatter instance.
     */
    static initialize(consoleInstance, formatterInstance) {
        if (!World.instance) {
            World.instance = new World(consoleInstance, formatterInstance);
            consoleInstance.plotEssentials = plotEssentials;
            consoleInstance.authorsNote = authorsNote;
        }
    }

    /**
     * Gets the World singleton instance.
     * @returns {World} The World instance.
     */
    static getInstance() {
        if (!World.instance) {
            throw new Error("World singleton has not been initialized. Call World.initialize(...) first.");
        }
        World.instance.console.plotEssentials = plotEssentials;
        World.instance.console.authorsNote = authorsNote;
        return World.instance;
    }
    
    /**
     * Creates the player character.
     * @returns {Entity} The created player character.
     */
    createPlayerCharacter() {
        const playerName = this.console.getRawPlayerInput("Hero");
        this.player = new this.Entities.Player({
            name: playerName,
            numAttrs: { hp: 100, mp: 50, strength: 20, defense: 10 },
        });

        return this.player;
    }

    /**
     * Serializes the world state to a data object.
     * @returns {object|null} The serialized world state, or null if the player doesn't exist.
     */
    toData() {
        if (!this.player) return null; 

        
        const allEntities = new Map();
        allEntities.set(this.player.uid, this.player);
        if (this.currentEncounter) {
            this.currentEncounter.enemies.forEach(enemy => allEntities.set(enemy.uid, enemy));
        }

        return {
            
            entities: Array.from(allEntities.values()).map(e => e.toData()),
            
            playerUid: this.player.uid,
            
            encounter: this.currentEncounter ? this.currentEncounter.toData() : null,
            
            nextUid: Entity.nextUid
        };
    }

    /**
     * Creates a World instance from serialized data.
     * @param {object} data - The serialized world data.
     * @param {iONOConsole} consoleInstance - The console instance.
     * @param {EventFormatter} formatterInstance - The event formatter instance.
     * @returns {World} The rehydrated World instance.
     */
    static fromData(data, consoleInstance, formatterInstance) {
        World.initialize(consoleInstance, formatterInstance);
        const world = World.getInstance();
        
        if (!data) return world;

        
        Entity.nextUid = data.nextUid || 0;

        const entityMap = new Map();
        if (data.entities) {
            for (const entityData of data.entities) {
                
                const EntityClass = world.Entities[entityData.type];
                if (EntityClass) {
                    const entity = EntityClass.fromData(entityData);
                    entityMap.set(entity.uid, entity);
                } else {
                    console.warn(`Could not find Entity class for type: ${entityData.type}`);
                }
            }
        }
        
        
        world.player = entityMap.get(data.playerUid);
        
        
        if (data.encounter) {
            world.currentEncounter = Encounter.fromData(data.encounter, entityMap);
        } else {
            world.currentEncounter = null;
        }
        
        
        return world;
    }
}

module.exports = { World, plotEssentials, authorsNote };
