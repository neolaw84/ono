/**
 * @file O&O AI Dungeon Integration
 * @description Contains the onInput, onContext, and onOutput hooks for AI Dungeon.
 */

const rulebookName = 'oxo';
const systemName = 'aid';

const { World, plotEssentials, authorsNote } = require(`./${rulebookName}/world.js`);
const { EventFormatter } = require(`./${rulebookName}/event_formatter.js`);
const { ONOConsole } = require(`./${systemName}/ono_console.js`);

/**
 * Loads the game state, initializing a new world if one doesn't exist.
 * @returns {{worldInstance: World, onoConsoleInstance: ONOConsole}} An object containing the world and console instances.
 */
function loadGame() {
    const onoConsoleInstance = ONOConsole.getInstance();
    const formatter = new EventFormatter(); 
    
    if (!state.initialized || !state.worldData) {
        World.initialize(onoConsoleInstance, formatter); 
        worldInstance = World.getInstance();
        
        
        const player = worldInstance.createPlayerCharacter();
        const orc = new worldInstance.Entities.Orc({ name: 'Grimgor', numAttrs: { hp: 60, strength: 15, defense: 5 } });
        worldInstance.getOrCreateEncounter([orc]);
        worldInstance.updateEncounterPhase();
        

        state.initialized = true;
    } else {
        
        const worldData = JSON.parse(state.worldData);
        
        worldInstance = World.fromData(worldData, onoConsoleInstance, formatter);
    }
    return { worldInstance, onoConsoleInstance };
}

/**
 * Serializes and saves the game state.
 * @param {World} worldInstance The world instance to save.
 */
function saveGame(worldInstance) {
    if (worldInstance) {
        const worldData = worldInstance.toData();
        state.worldData = JSON.stringify(worldData);
    }
}

/**
 * The main game loop, handling player and enemy turns.
 * @param {string} text The input text from the player.
 * @private
 */
function _commonLoop(text) {

    const { worldInstance, onoConsoleInstance } = loadGame();
    const player = worldInstance.player;

    if (worldInstance.isPlayerTurn()) {
        
        const rawPlayerInput = onoConsoleInstance.getRawPlayerInput(text, worldInstance);
        console.log("Raw Player Input:", rawPlayerInput);
        const playerInput = onoConsoleInstance.parsePlayerInput(rawPlayerInput, worldInstance);
        console.log("Parsed Player Input:", playerInput);
        const [actionName, targetIndexStr] = playerInput.split('_');
        const targetIndex = targetIndexStr ? parseInt(targetIndexStr, 10) : 0;

        const actionKey = Object.keys(worldInstance.Actions).find(key => key.toLowerCase() === actionName.toLowerCase());
        const ActionClass = actionKey ? worldInstance.Actions[actionKey] : undefined;
        console.log("Resolved ActionClass:", ActionClass ? ActionClass.name : 'Not Found');
        const livingEnemies = worldInstance.currentEncounter.enemies.filter(e => e.numAttrs.get('hp') > 0);
        const actionee = livingEnemies[targetIndex];

        if (ActionClass && actionee) {
            const action = new ActionClass({ worldInstance });
            action.apply(player, actionee);
        }

    } else {
        const enemy = worldInstance.getEntityForThisTurn();
        if (enemy && enemy.numAttrs.get('hp') > 0) { 
             const action = worldInstance.determineEnemyAction(enemy);
             if (action) {
                 action.apply(enemy, player);
             }
        }
    }

    if (worldInstance.currentEncounter) {
        worldInstance.updateEncounterPhase();
    }
    if (worldInstance.currentEncounter) {
        worldInstance.updateTurn();
    }
    
    onoConsoleInstance.flushEnvironment();
    
    saveGame(worldInstance);

    state.memory.context = state.context;
    state.memory.frontMemory = state.frontMemory;
    state.memory.authorsNote = state.authorsNote;
    state.message = state._message;
}

/**
 * The onInput hook for AI Dungeon.
 * @param {string} text The input text from the player.
 * @returns {{text: string}} The modified text.
 */
function onInput(text) {
    
    state.calledOnInput = state.calledOnInput ? state.calledOnInput : false;

    _commonLoop(text);

    state.calledOnInput = true;

    return { text: text };
}

/**
 * The onContext hook for AI Dungeon.
 * @param {string} text The context text.
 * @returns {{text: string}} The modified text.
 */
function onContext(text) {
    state.calledOnInput = state.calledOnInput ? state.calledOnInput : false;

    if (!state.calledOnInput)  {
        _commonLoop(text);
    }
    
    state.calledOnInput = false; 

    return { text: text }; 
}

/**
 * The onOutput hook for AI Dungeon.
 * @param {string} text The output text.
 * @returns {{text: string}} The modified text.
 */
function onOutput(text) {
    const { worldInstance, onoConsoleInstance } = loadGame();
    let newText = text;

    if (worldInstance.isPlayerTurn()) {
        const player = worldInstance.player;
        const actionChoices = worldInstance.getAllActionsAllowed(player);
        
        worldInstance.showPlayerHUD(actionChoices);
        
        const hudString = onoConsoleInstance.flushPlayerHUD();

        if (hudString) {
            newText += "\n" + hudString;
        }
    }
    saveGame(worldInstance);

    return { text: newText };
}

module.exports = { onInput, onOutput, onContext };