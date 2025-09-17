/**
 * @file Game Entry Point
 * @description This file demonstrates how to dynamically load a rulebook and run a turn-based encounter.
 */

const rulebookName = 'oxo';
const systemName = 'cli';

function setupGame() {
    try {
        // 1. Synchronously load modules
        const { World } = require(`./${rulebookName}/world.js`);
        const { EventFormatter } = require(`./${rulebookName}/event_formatter.js`);
        const { ONOConsole } = require(`./${systemName}/ono_console.js`);

        // 2. Initialize Singletons and Formatter
        const onoConsoleInstance = ONOConsole.getInstance();
        const formatter = new EventFormatter();
        World.initialize(onoConsoleInstance, formatter); // Inject formatter
        const worldInstance = World.getInstance();
        
        console.log(`Successfully loaded modules from rulebook '${rulebookName}' and system '${systemName}'`);

        // 3. Create Characters
        const player = worldInstance.createPlayerCharacter();
        const orc = new worldInstance.Entities.Orc({ name: 'Grimgor', numAttrs: { hp: 60, strength: 15, defense: 5 } });

        // 4. Start Encounter
        worldInstance.getOrCreateEncounter([orc]);
        // Initial phase transition from __start__ to combat
        worldInstance.updateEncounterPhase(); 

        // 5. Run the REFACTORED Game Loop
        console.log("\n--- Starting Battle Loop ---");
        
        let hudShown = false;

        while (worldInstance.currentEncounter && worldInstance.currentEncounter.phase !== '__end__') {
            const currentEntity = worldInstance.getEntityForThisTurn();

            if (worldInstance.isPlayerTurn()) {
                if (!hudShown) {
                    worldInstance.showPlayerHUD(worldInstance.getAllActionsAllowed(player));
                    hudShown = true;
                }
                const rawPlayerInput = onoConsoleInstance.getRawPlayerInput("whatever");
                const playerInput = onoConsoleInstance.parsePlayerInput(rawPlayerInput, worldInstance); 
                
                if (playerInput) {
                    const [actionName, targetIndexStr] = playerInput.split('_');
                    const targetIndex = targetIndexStr ? parseInt(targetIndexStr, 10) : 0;

                    const allActionKeys = Object.keys(worldInstance.Actions);
                    
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
                    onoConsoleInstance.renderOnEnvironment(`${player.name} has no available actions.`);
                }
                
            } else { // Enemy's turn
                const enemy = currentEntity;
                const action = worldInstance.determineEnemyAction(enemy);
                if (action) {
                    action.apply(enemy, player);
                } else {
                    onoConsoleInstance.renderOnEnvironment(`${enemy.name} hesitates.`);
                }
            }

            worldInstance.updateEncounterPhase(); 
            
            if (worldInstance.currentEncounter) {
                worldInstance.updateTurn();
                if (worldInstance.isPlayerTurn()) {
                    const actionChoices = worldInstance.getAllActionsAllowed(player);
                    worldInstance.showPlayerHUD(actionChoices);
                    hudShown = true;
                }
            }

        }

        console.log("\n--- Battle has concluded. ---");

    } catch (error) {
        console.error(`Failed to run game:`, error);
    }
}

// Start the game
setupGame();