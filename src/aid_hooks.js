/**
 * @file O&O AI Dungeon Integration
 * @description Contains the onInput, onContext, and onOutput hooks for AI Dungeon.
 */

const rulebookName = "ono";
const systemName = "aid";

// --- Imports ---
const { World } = require("./core/world.js");
const { GamePhaseManager } = require(`./${rulebookName}/game_phase_manager.js`);
const { EventFormatter, authorsNote, plotEssentials } = require(`./${rulebookName}/event_formatter.js`);
const { ONOConsole } = require(`./${systemName}/ono_console.js`);

/**
 * Loads the game state, correctly initializing all dependencies.
 * @returns {World} The configured World instance.
 */
function loadGame() {
  // Always instantiate dependencies. They are lightweight.
  const onoConsole = ONOConsole.getInstance();
  const formatter = new EventFormatter();
  const gamePhaseManager = new GamePhaseManager();

  onoConsole.plotEssentials = plotEssentials;
  onoConsole.authorsNote = authorsNote;

  let worldInstance;

  if (!state.initialized || !state.worldData) {
    // First time setup
    worldInstance = World.getInstance();
    worldInstance.initialize(onoConsole, formatter, gamePhaseManager);

    worldInstance.createPlayerCharacter({
      name: "Hero",
      numAttrs: { hp: 100 },
    });
    worldInstance.updateGamePhase(); // -> 'combat'
    worldInstance.startNewEncounter();

    state.initialized = true;
  } else {
    // Loading from a saved state
    const worldData = JSON.parse(state.worldData);
    // The fromData static method correctly re-initializes the singleton
    worldInstance = World.fromData(
      worldData,
      onoConsole,
      formatter,
      gamePhaseManager,
    );
  }
  return worldInstance;
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

function _commonLoop(text) {
  const world = loadGame();
  const player = world.player;

  if (world.getEntityForThisTurn() === player) {
    const rawInput = world.console.getRawPlayerInput(text);
    const parsedInput = world.console.parsePlayerInput(rawInput, world);
    const [actionName, targetIndexStr] = parsedInput.split("_");
    const targetIndex = parseInt(targetIndexStr, 10) || 0;

    const actionKey = Object.keys(world.gamePhaseManager.Actions).find(
      (k) => k.toLowerCase() === actionName.toLowerCase(),
    );
    const ActionClass = actionKey
      ? world.gamePhaseManager.Actions[actionKey]
      : null;
    const actionee = world.currentEncounter.enemies[targetIndex];

    if (ActionClass && actionee) {
      const action = new ActionClass({ worldInstance: world });
      action.apply(player, actionee);
    }
  } else {
    // Enemy turn
    const enemy = world.getEntityForThisTurn();
    if (enemy && enemy.numAttrs.get("hp") > 0) {
      const action = world.determineEnemyAction(enemy);
      if (action) {
        action.apply(enemy, player);
      }
    }
  }

  world.updateGamePhase();
  if (world.currentEncounter) {
    world.updateTurn();
  }

  world.console.flushEnvironment();
  saveGame(world);

  log (`state.context : ${state.context}`);
  log (`state.frontMemory : ${state.frontMemory}`);
  log (`state.authorsNote : ${state.authorsNote}`);
  log (`state._message : ${state._message}`);

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

  if (!state.calledOnInput) {
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
  const worldInstance = loadGame();
  let newText = text;
  if (worldInstance.getEntityForThisTurn() === worldInstance.player) {
    const player2 = worldInstance.player;
    const actionChoices = worldInstance.getAllActionsAllowed(player2);
    worldInstance.showPlayerHUD(actionChoices);
    const hudString = worldInstance.console.flushPlayerHUD();
    if (hudString) {
      newText += "\n" + hudString;
    }
  }
  saveGame(worldInstance);
  return { text: newText };
}

module.exports = { onInput, onOutput, onContext };

/**

// Every script needs a modifier function
const modifier = (text) => {
  ono.onInput(text);
  return { text }
}

// Don't modify this part
modifier(text)

************************************************

// Every script needs a modifier function
const modifier = (text) => {
  ono.onContext(text);
  return { text }
}

// Don't modify this part
modifier(text)

************************************************


// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Every script needs a modifier function
const modifier = (text) => {
  return ono.onOutput(text);
}

// Don't modify this part
modifier(text)

 */