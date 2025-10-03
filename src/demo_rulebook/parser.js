// src/demo_rulebook/parser.js

const { iCommand, iCommandParser } = require("../core/parsers");
const actions = require("./actions");

function getActionId(actionName) {
    return actionName.replace(/\s+/g, '').toLowerCase();
}

const availableActions = {};
for (const key in actions) {
    if (actions[key] && typeof actions[key].name === 'string') {
        const actionId = getActionId(actions[key].name);
        availableActions[actionId] = actions[key];
    }
}

class ActionCommand extends iCommand {
    constructor(action, actioner, target) {
        super();
        this.action = action;
        this.actioner = actioner;
        this.target = target;
    }
    execute(gameEngine) {
        this.action.apply(this.actioner, this.target, gameEngine.gameState, gameEngine.eventManager);
    }
}

class ActionParser extends iCommandParser {
    parse(inputText, gameState) {
        const tokens = inputText.match(/#(\w+)/g) || [];
        if (tokens.length === 0) return null;
        
        const args = tokens.map(token => token.substring(1));
        const actionId = args[0].toLowerCase();
        
        const action = availableActions[actionId];

        if (!action) return null;

        const actioner = gameState.party[0];
        let target = null;
        if (args.length > 1) {
            const targetArg = args[1].toLowerCase();
            const uidMatch = targetArg.match(/^uid(\d+)$/);
            if (uidMatch) {
                const targetUid = parseInt(uidMatch[1], 10);
                target = gameState.getAllCharacters().find(c => c.uid === targetUid);
            }
        }
        
        // Provoke action requires a target.
        if (actionId === 'provoke' && target) {
            return new ActionCommand(action, actioner, target);
        }
        
        // Combat actions are only valid in combat mode.
        if (gameState.currentGameMode === 'Combat' && target) {
            return new ActionCommand(action, actioner, target);
        }
        return null;
    }
}

module.exports = { ActionParser, ActionCommand };