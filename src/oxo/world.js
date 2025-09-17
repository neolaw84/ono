const { Encounter, Entity } = require('../core.js');
const {
    Entities,
    Actions,
    phaseGraph,
    permissionGraph,
    plotEssentials,
    authorsNote
} = require('./rules.js');

class World {
    constructor(consoleInstance, formatterInstance) {
        if (!consoleInstance) throw new Error("World requires a console instance.");
        if (!formatterInstance) throw new Error("World requires a formatter instance.");
        this.console = consoleInstance;
        this.formatter = formatterInstance; 
        this.player = null;
        this.currentEncounter = null;
        this.phaseGraph = phaseGraph;
        this.permissionGraph = permissionGraph;
        this.Entities = Entities;
        this.Actions = Actions;
    }

    isPlayerDefeated() { return this.player && this.player.numAttrs.get('hp') <= 0; }

    areAllEnemiesDefeated() { return this.currentEncounter && this.currentEncounter.enemies.every(e => e.numAttrs.get('hp') <= 0); }
    
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
    
    updateEncounterPhase() {
        let newPhase = this.phaseGraph.updateEncounterPhase(this);
        if (newPhase === '__end__') {
            const playerWon = this.areAllEnemiesDefeated();
            const endText = this.formatter.format('encounterEnd', { playerWon });
            this.console.bufferEvent('critical', endText);
            this.currentEncounter = null;
        } else if (newPhase !== this.currentEncounter.phase) {
            const phaseText = this.formatter.format('phaseChange', { from: this.currentEncounter.phase, to: newPhase });
            this.console.bufferEvent('critical', phaseText);
            this.currentEncounter.phase = newPhase;
        }
    }

    isActionAllowedNow(action, actioner, actionee) {
        return this.permissionGraph.isActionAllowedNow(action, actioner, actionee, this.currentEncounter);
    }

    isPlayerTurn() {
        if (!this.currentEncounter) return false;
        return this.getEntityForThisTurn() === this.player;
    }

    determineEnemyAction(enemy) {
        
        if (enemy.type === 'Orc') {
            const attackAction = new this.Actions.BasicAttack({ worldInstance: this });
            if (this.isActionAllowedNow(attackAction, enemy, this.player)) {
                return attackAction;
            }
        }
        return null; 
    }

    getAllActionsAllowed(player) {
        if (!this.currentEncounter) return [];
        const allowedMoves = [];
        
        const potentialTargets = this.currentEncounter.enemies;
            // .map((enemy, index) => ({ entity: enemy, index }))
            // .filter(target => target.entity.numAttrs.get('hp') > 0);

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

    showPlayerHUD(allowedMoves) {
        if (allowedMoves.length > 0) {
            allowedMoves.forEach(move => {
                const command = `#${move.actionName}_${move.targetIndex}`;
                this.console.renderOnPlayerHUD(command);
            });
        }
    }

    updateTurn() {
        if (!this.currentEncounter) return;
        const nextIndex = (this.currentEncounter.currentTurnIndex + 1) % this.currentEncounter.turnOrder.length;
        this.currentEncounter.currentTurnIndex = nextIndex;
        const nextEntity = this.getEntityForThisTurn();

        const turnText = this.formatter.format('turnStart', { entity: nextEntity });
        this.console.bufferEvent('battle', turnText);
    }

    getEntityForThisTurn() {
        if (!this.currentEncounter) return null;
        return this.currentEncounter.turnOrder[this.currentEncounter.currentTurnIndex];
    }

    static initialize(consoleInstance, formatterInstance) {
        if (!World.instance) {
            World.instance = new World(consoleInstance, formatterInstance);
            consoleInstance.plotEssentials = plotEssentials;
            consoleInstance.authorsNote = authorsNote;
        }
    }

    static getInstance() {
        if (!World.instance) {
            throw new Error("World singleton has not been initialized. Call World.initialize(...) first.");
        }
        World.instance.console.plotEssentials = plotEssentials;
        World.instance.console.authorsNote = authorsNote;
        return World.instance;
    }
    
    createPlayerCharacter() {
        const playerName = "Hero";
        this.player = new this.Entities.Player({
            name: playerName,
            numAttrs: { hp: 100, mp: 50, strength: 20, defense: 10 },
        });

        return this.player;
    }

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

module.exports = { World };
