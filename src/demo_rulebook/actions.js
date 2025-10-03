// src/demo_rulebook/actions.js

const { OneToOneAction, createActionBuilder } = require("../core/oneToOneAction");
const { Player, Orc, CoreStats, TxtStats } = require("./characters"); // Import from the new character file

const heavyStrikeAction = createActionBuilder()
    .withName("Heavy Strike")
    .withType("Attack")
    .withAllowedActioners([Player])
    .withAllowedTargets([Orc])
    .withRequired(new TxtStats({}))
    .withCost(new CoreStats({ mp: 1 }))
    .withActionerMod(new CoreStats({ str: 0.5 }))
    .withTargetMod(new CoreStats({}))
    .withEffectVal(new CoreStats({ hp: -10 }))
    .withEffectType("add")
    .withEffectMask(new CoreStats({ hp: true }))
    .build();

const clubSmashAction = createActionBuilder()
    .withName("Club Smash")
    .withType("Attack")
    .withAllowedActioners([Orc])
    .withAllowedTargets([Player])
    .withRequired(new TxtStats({}))
    .withCost(new CoreStats({}))
    .withActionerMod(new CoreStats({ str: 0.4 }))
    .withTargetMod(new CoreStats({}))
    .withEffectVal(new CoreStats({ hp: -8 }))
    .withEffectType("add")
    .withEffectMask(new CoreStats({ hp: true }))
    .build();

// This isn't a OneToOneAction because it's simpler. It just changes a text attribute.
class ProvokeAction {
    get name() { return "Provoke"; }
    apply(actioner, target, gameState, eventManager) {
        if (target.txtAttrs.get('attitude') !== 'hostile') {
            target.txtAttrs.set('attitude', 'hostile');
            eventManager.publish('ACTION_RESOLVED', {
                action: this.name,
                actioner: actioner.name,
                target: target.name,
                resultValue: 1 // A nominal success value
            });
        }
    }
}
const provokeAction = new ProvokeAction();

module.exports = {
    heavyStrikeAction,
    clubSmashAction,
    provokeAction
};