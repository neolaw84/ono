/**
 * @file OXO Rulebook - Event Formatter (Presentation Logic)
 * @description Translates structured game events into human-readable strings for the 'oxo' rulebook.
 */
class EventFormatter {
    /**
     * Takes an event name and its data payload, and returns a formatted string.
     * @param {string} eventName The name of the event to format.
     * @param {object} data The data payload for the event.
     * @returns {string} The human-readable description of the event.
     */
    format(eventName, data) {
        switch (eventName) {
            case 'actionAttempt':
                return `\n${data.actioner.name} attempts '${data.action.name}' on ${data.actionee.name}.`;
            case 'costPaid':
                return `  ${data.entity.name} pays ${data.cost} ${data.resourceName}. New value: ${data.newValue}`;
            case 'rollResult':
                const { actioner, actionerRoll, actionerModValue, actionee, actioneeRoll, actioneeModValue, resultValue, outcome } = data;
                return `  Roll: ${actioner.name} (${actionerRoll}) vs ${actionee.name} (${actioneeRoll}). Mods: ${actionerModValue.toFixed(2)} vs ${actioneeModValue.toFixed(2)}. Final Value: ${resultValue.toFixed(2)} -> ${outcome.toUpperCase()}`;
            case 'effectApplied':
                return `  Effect on ${data.entity.name}: ${data.key} changed from ${data.originalValue} to ${data.newValue}.${data.bonusText || ""}`;
            case 'noEffect':
                return `  Action resulted in ${data.outcome}. No effect applied.`;
            case 'penalty':
                return `  Penalty for ${data.entity.name}: ${data.reason}`;
            case 'halt':
                return ` HALT: ${data.reason}`;
            case 'encounterStart':
                return "\n--- Encounter begins! ---";
            case 'encounterEnd':
                return `--- Encounter ended. ${data.playerWon ? "Victory!" : "Defeat."} ---`;
            case 'turnStart':
                 return `Now is ${data.entity.name}'s turn. `;
            default:
                return '';
        }
    }
}

module.exports = { EventFormatter };