/**
 * @file Game Entry Point
 * @description This file demonstrates how to dynamically load a rulebook and run a turn-based encounter.
 */

const rulebookName = 'oxo';
const systemName = 'aid';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function setupGame() {
    try {
        // 1. Dynamically import modules
        const [{ World }, { ONOConsole }] = await Promise.all([
            import(`./${rulebookName}/world.js`),
            import(`./${systemName}/ono_console.js`)
        ]);

        // 2. Initialize Singletons
        const onoConsoleInstance = ONOConsole.getInstance();
        World.initialize(onoConsoleInstance);
        const worldInstance = World.getInstance();
        
        console.log(`Successfully loaded modules from rulebook '${rulebookName}' and system '${systemName}'`);

        // 3. Create Characters
        const player = await worldInstance.createPlayerCharacter();
        const orc = new worldInstance.Entities.Orc({ name: 'Grimgor', numAttrs: { hp: 60, strength: 15, defense: 5 } });

        // 4. Start Encounter
        worldInstance.getOrCreateEncounter([orc]);
        // Initial phase transition from __start__ to combat
        worldInstance.updateEncounterPhase(); 

        // 5. Run the REFACTORED Game Loop
        console.log("\n--- Starting Battle Loop ---");
        
        while (worldInstance.currentEncounter && worldInstance.currentEncounter.phase !== '__end__') {
            const currentEntity = worldInstance.getEntityForThisTurn();

            if (worldInstance.isPlayerTurn()) {
                const actionChoices = worldInstance.getAllActionsAllowed(player);
                worldInstance.showPlayerHUD(actionChoices);
                const playerInput = await worldInstance.getPlayerInput();
                
                if (playerInput) {
                    const action = new worldInstance.Actions[playerInput]({ worldInstance });
                    const actionee = worldInstance.currentEncounter.enemies.find(e => e.numAttrs.get('hp') > 0); // Target first living enemy
                    if (action && actionee) {
                       action.apply(player, actionee);
                    } else {
                       onoConsoleInstance.renderOnEnvironment(`${player.name} is confused and does nothing.`);
                    }
                } else {
                    onoConsoleInstance.renderOnEnvironment(`${player.name} has no available actions.`);
                    await delay(1000); // Pause so the player can see they have no actions
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

            // This sequence ensures we check for victory after every single action
            worldInstance.updateEncounterPhase(); // Moves from 'combat' to 'check_victory'
            
            // If the battle ended, the loop condition will fail. Otherwise, advance the turn.
            if (worldInstance.currentEncounter) {
                worldInstance.updateTurn();
            }

            await delay(1000); // Wait a second to make the log readable
        }

        console.log("\n--- Battle has concluded. ---");

    } catch (error) {
        console.error(`Failed to run game:`, error);
    }
}

// Start the game
setupGame();