// src/core/oneToOneAction.js

const { iAction } = require("./action");

/**
 * A generic action that involves one character (actioner) acting upon another (target).
 * Its behavior is defined by a configuration object provided at creation.
 */
class OneToOneAction extends iAction {
  constructor(config) {
    super(config);
    // Assign all properties from the validated config object.
    Object.assign(this, config);
  }

  /**
   * Executes the one-to-one action logic.
   */
  apply(actioner, target, gameState, eventManager) {
    // 1. Check if the action is valid in the current context.
    if (!this._isValid(actioner, target, eventManager)) {
      return; // _isValid method publishes failure events.
    }

    // 2. Deduct the cost from the actioner.
    for (const key of this.cost.keys()) {
      const costValue = this.cost.get(key);
      if (costValue > 0) {
        const currentValue = actioner.numAttrs.get(key);
        actioner.numAttrs.set(key, currentValue - costValue);
      }
    }

    // 3. Calculate modifier values.
    const actionerModValue = this._calculateModifier(actioner, this.actionerMod);
    const targetModValue = this._calculateModifier(target, this.targetMod);

    // 4. Roll D20s.
    const actionerRoll = this._rollD20();
    const targetRoll = this._rollD20();

    // 5. Calculate the final result value.
    const resultValue = actionerRoll + actionerModValue - (targetRoll + targetModValue);

    // 6. Determine the outcome and apply the effect.
    this._resolveOutcome(resultValue, target, eventManager);

    // 7. Publish the final resolution event.
    eventManager.publish("ACTION_RESOLVED", {
      action: this.name,
      actioner: actioner.name,
      target: target.name,
      actionerRoll,
      targetRoll,
      actionerModValue,
      targetModValue,
      resultValue,
    });
  }

  /**
   * Helper to perform all pre-action validation checks.
   * @private
   */
  _isValid(actioner, target, eventManager) {
    // Check if actioner type is allowed
    if (!this.allowedActioners.some((cls) => actioner instanceof cls)) {
      eventManager.publish("ACTION_FAILED", { reason: `${actioner.type} cannot perform ${this.name}.` });
      return false;
    }
    // Check if target type is allowed
    if (!this.allowedTargets.some((cls) => target instanceof cls)) {
      eventManager.publish("ACTION_FAILED", { reason: `${target.type} cannot be targeted by ${this.name}.` });
      return false;
    }
    // Check if all text attribute requirements are met
    if (this.required) {
      for (const key of this.required.keys()) {
        if (actioner.txtAttrs.get(key) !== this.required.get(key)) {
          eventManager.publish("ACTION_FAILED", { reason: `Actioner does not meet requirement: ${key}.` });
          return false;
        }
      }
    }
    // Check if the actioner can afford the cost
    if (this.cost) {
      for (const key of this.cost.keys()) {
        if (actioner.numAttrs.get(key) < this.cost.get(key)) {
          eventManager.publish("ACTION_FAILED", { reason: `Not enough ${key}.` });
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Helper to calculate the weighted sum of attributes.
   * @private
   */
  _calculateModifier(character, modifiers) {
    let totalMod = 0;
    if (modifiers) {
      for (const key of modifiers.keys()) {
        const weight = modifiers.get(key);
        const attrValue = character.numAttrs.get(key) || 0;
        totalMod += attrValue * weight;
      }
    }
    return totalMod;
  }

  /**
   * Rolls a 20-sided die.
   * @private
   */
  _rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Determines outcome and applies the effect to the target.
   * @private
   */
  _resolveOutcome(resultValue, target, eventManager) {
    let outcome = "FAILURE";
    let effectMultiplier = 0;

    if (resultValue > 11) {
      outcome = "CRITICAL_SUCCESS";
      effectMultiplier = 2; // Example: Criticals do double damage
    } else if (resultValue > 0) {
      outcome = "SUCCESS";
      effectMultiplier = 1;
    } else if (resultValue <= -11) {
      outcome = "CRITICAL_FAILURE";
      effectMultiplier = 0;
      // Note: A critical failure might have other effects, e.g., on the actioner.
      // This could be implemented by publishing a specific event.
    } else {
      // resultValue is between 0 and -10, which is a standard failure.
      outcome = "FAILURE";
      effectMultiplier = 0;
    }

    eventManager.publish("OUTCOME_DETERMINED", { outcome, resultValue });

    // Apply the effect if the action was any kind of success
    if (effectMultiplier > 0) {
      for (const key of this.effectMask.keys()) {
        if (this.effectMask.get(key)) { // Check if this attribute should be affected
          const currentVal = target.numAttrs.get(key);
          const effectVal = this.effectVal.get(key) * effectMultiplier;

          // For now, we only handle the 'add' effectType
          if (this.effectType === "add") {
            target.numAttrs.set(key, currentVal + effectVal);
          }
          // Other effect types ('set', 'subtract', etc.) could be added here.
        }
      }
    }
  }
}
// --- The Fluent Builder ---
class ActionBuilder {
  constructor() {
    this.config = {};
  }
  withName(name) {
    this.config.name = name;
    return this;
  }
  withType(type) {
    this.config.type = type;
    return this;
  }
  withAllowedActioners(allowedActioners) {
    this.config.allowedActioners = allowedActioners;
    return this;
  }
  withAllowedTargets(allowedTargets) {
    this.config.allowedTargets = allowedTargets;
    return this;
  }
  withRequired(required) {
    this.config.required = required;
    return this;
  }
  withCost(cost) {
    this.config.cost = cost;
    return this;
  }
  withActionerMod(actionerMod) {
    this.config.actionerMod = actionerMod;
    return this;
  }
  withTargetMod(targetMod) {
    this.config.targetMod = targetMod;
    return this;
  }
  withEffectVal(effectVal) {
    this.config.effectVal = effectVal;
    return this;
  }
  withEffectType(effectType) {
    this.config.effectType = effectType;
    return this;
  }
  withEffectMask(effectMask) {
    this.config.effectMask = effectMask;
    return this;
  }
  build() {
    const required = [
      'name', 'type', 'allowedActioners', 'allowedTargets', 'required', 'cost',
      'actionerMod', 'targetMod', 'effectVal', 'effectType', 'effectMask'
    ];
    for (const key of required) {
      if (this.config[key] === undefined) {
        throw new Error(`Cannot build OneToOneAction: Missing required property '${key}'.`);
      }
    }
    return new OneToOneAction(this.config);
  }
}

/**
 * Factory function that returns a new ActionBuilder instance.
 * @returns {ActionBuilder}
 */
function createActionBuilder() {
  return new ActionBuilder();
}

module.exports = { OneToOneAction, createActionBuilder };