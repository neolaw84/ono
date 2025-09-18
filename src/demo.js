/**
 * @file Game Entry Point
 * @description Demonstrates the new architecture with dependency injection.
 */

const rulebookName = "ono";
const systemName = "cli";

// --- Imports ---
const { World } = require("./core/world.js"); // Import the new core World
const { GamePhaseManager } = require(`./${rulebookName}/game_phase_manager.js`);
const { EventFormatter } = require(`./${rulebookName}/event_formatter.js`);
const { ONOConsole } = require(`./${systemName}/ono_console.js`);

function setupGame() {
  try {
    // 1. Instantiate all dependencies
    const onoConsole = ONOConsole.getInstance();
    const formatter = new EventFormatter();
    const gamePhaseManager = new GamePhaseManager();

    // 2. Initialize the World singleton with its dependencies
    const world = World.getInstance();
    world.initialize(onoConsole, formatter, gamePhaseManager);

    console.log(`Successfully loaded modules and initialized World.`);

    // 3. Create Player and start the game
    const player = world.createPlayerCharacter({
      name: "Hero",
      numAttrs: { hp: 100, mp: 50, strength: 20, defense: 10 },
    });

    // The world starts in '__start__'. Let's transition to the combat phase.
    world.updateGamePhase();

    // 4. Start a new encounter based on the current game phase
    world.startNewEncounter();

    // 5. Game Loop
    console.log("\n--- Starting Battle Loop ---");
    while (world.currentEncounter) {
      const currentEntity = world.getEntityForThisTurn();

      if (currentEntity === player) {
        // Player's turn
        world.showPlayerHUD(world.getAllActionsAllowed(player));

        const rawPlayerInput = onoConsole.getRawPlayerInput("whatever");
        const playerInput = onoConsole.parsePlayerInput(rawPlayerInput, world);

        const [actionName, targetIndexStr] = playerInput.split("_");
        const targetIndex = parseInt(targetIndexStr, 10);

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
        // Enemy's turn
        const action = world.determineEnemyAction(currentEntity);
        if (action) {
          action.apply(currentEntity, player);
        } else {
          onoConsole.bufferEvent("battle", `${currentEntity.name} hesitates.`);
        }
      }

      // Check for phase transitions (e.g., combat ending)
      world.updateGamePhase();

      // If encounter is still active, advance to the next turn
      if (world.currentEncounter) {
        world.updateTurn();
      }
    }

    console.log("\n--- Battle has concluded. ---");
  } catch (error) {
    console.error(`Failed to run game:`, error);
  }
}

// Start the game
setupGame();
