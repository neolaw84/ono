// src/core/abstractions.js

class iONOConsole { 
    constructor() { if (this.constructor === iONOConsole) throw new Error("Abstract class 'iONOConsole' cannot be instantiated directly."); } 
    getRawPlayerInput(text) { throw new Error("Method 'getRawPlayerInput()' must be implemented."); }
    parsePlayerInput(rawInput, worldInstance) { throw new Error("Method 'promptForRawInput(text, worldInstance)' must be implemented."); }
    renderOnPlayerHUD(text) { throw new Error("Method 'renderOnPlayerHUD()' must be implemented."); }
    flushPlayerHUD() { throw new Error("Method 'flushPlayerHUD()' must be implemented."); }
    bufferEvent(eventName, data) { throw new Error("Method 'bufferEvent()' must be implemented."); }
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
    createPlayerCharacter() { throw new Error("Method 'createPlayerCharacter()' must be implemented."); }
    toData() { throw new Error("Method 'toData()' must be implemented."); }
    static fromData(data, consoleInstance) { throw new Error("Static method 'fromData()' must be implemented."); }
}

class Encounter {
    constructor(enemies) {
        this.enemies = enemies;
        this.phase = "__start__";
        this.turnOrder = [];
        this.currentTurnIndex = 0;
    }

    toData() {
        return {
            phase: this.phase,
            currentTurnIndex: this.currentTurnIndex,
            enemies: this.enemies.map(e => e.uid),
            turnOrder: this.turnOrder.map(e => e.uid),
        };
    }

    static fromData(data, entityMap) {
        const enemies = data.enemies.map(uid => entityMap.get(uid)).filter(Boolean);
        const encounter = new Encounter(enemies);
        encounter.phase = data.phase;
        encounter.currentTurnIndex = data.currentTurnIndex;
        encounter.turnOrder = data.turnOrder.map(uid => entityMap.get(uid)).filter(Boolean);
        return encounter;
    }
}

module.exports = { iWorld, iONOConsole, Encounter };