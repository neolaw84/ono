// src/cli_demo.js

const { EventManager } = require("./core/eventManager.js");
const { GameState } = require("./core/gameState.js");
const { GameEngine } = require("./core/gameEngine.js");
const { IoConsole } = require("./cli/ioConsole.js");
const { SystemCommandParser } = require("./core/parsers.js");
const { Rulebook } = require("./demo_rulebook/rulebook.js");
const { Translator } = require("./demo_rulebook/translator.js");
const { ActionParser } = require("./demo_rulebook/parser.js");

function main() {
  console.log("--- Initializing O&O Engine ---");

  const eventManager = new EventManager();
  const gameState = new GameState();
  const ioConsole = new IoConsole();
  
  // The translator works silently in the background
  new Translator(eventManager, ioConsole);

  // --- 1. Create instances of our parsers ---
  const systemParser = new SystemCommandParser();
  const actionParser = new ActionParser();

  // --- 2. Create the parser chain (order matters!) ---
  const parserChain = [systemParser, actionParser];

  // --- 3. Inject all components into the engine ---
  const engine = new GameEngine({
    rulebook: Rulebook,
    ioConsole,
    gameState,
    eventManager,
    parsers: parserChain, // Pass the chain to the engine
  });

  engine.run();
}

main();