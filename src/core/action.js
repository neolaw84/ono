// src/core/action.js

class iAction {
  constructor() {
    if (this.constructor === iAction)
      throw new Error(
        "Abstract class 'iAction' cannot be instantiated directly.",
      );
  }
  apply() {
    throw new Error("Method 'apply()' must be implemented.");
  }
  toData() {
    throw new Error("Method 'toData()' must be implemented.");
  }
  static fromData(data, context) {
    throw new Error("Static method 'fromData()' must be implemented.");
  }
}

const rollD20 = () => Math.floor(Math.random() * 20) + 1;

class Action extends iAction {
  constructor({
    name,
    type,
    description,
    cost,
    actionerMod,
    actioneeMod,
    effectVal,
    effectType,
    effectMask,
    worldInstance,
  }) {
    super();
    this.name = name;
    this.type = type;
    this.description = description;
    this.cost = cost;
    this.actionerMod = actionerMod;
    this.actioneeMod = actioneeMod;
    this.effectVal = effectVal;
    this.effectType = effectType;
    this.effectMask = effectMask;

    if (!worldInstance) {
      throw new Error("Action constructor requires 'worldInstance'.");
    }
    this.world = worldInstance;
  }

  _canAfford(actioner) {
    return this.cost
      .keys()
      .every((key) => actioner.numAttrs.get(key) >= this.cost.get(key));
  }

  apply(actioner, actionee) {
    const attemptText = this.world.formatter.format("actionAttempt", {
      actioner,
      actionee,
      action: this,
    });
    this.world.console.bufferEvent("action", attemptText);

    if (!this.world.isActionAllowedNow(this, actioner, actionee)) {
      const haltText = this.world.formatter.format("halt", {
        reason: `Action '${this.name}' is not allowed right now.`,
      });
      this.world.console.bufferEvent("info", haltText);
      return { outcome: "not_allowed" };
    }
    if (!this._canAfford(actioner)) {
      const haltText = this.world.formatter.format("halt", {
        reason: "Cannot afford cost.",
      });
      this.world.console.bufferEvent("info", haltText);
      return { outcome: "cannot_afford" };
    }

    for (const key of this.cost.keys()) {
      const costValue = this.cost.get(key);
      if (costValue > 0) {
        const newValue = actioner.numAttrs.get(key) - costValue;
        actioner.numAttrs.set(key, newValue);
        const costText = this.world.formatter.format("costPaid", {
          entity: actioner,
          resourceName: key,
          cost: costValue,
          newValue,
        });
        this.world.console.bufferEvent("battle", costText);
      }
    }

    const actionerModValue = this.actionerMod
      .keys()
      .reduce(
        (s, k) => s + this.actionerMod.get(k) * actioner.numAttrs.get(k),
        0,
      );
    const actioneeModValue = this.actioneeMod
      .keys()
      .reduce(
        (s, k) => s + this.actioneeMod.get(k) * actionee.numAttrs.get(k),
        0,
      );
    const actionerRoll = rollD20();
    const actioneeRoll = rollD20();
    const resultValue =
      actionerRoll + actionerModValue - (actioneeRoll + actioneeModValue);
    let outcome;
    if (resultValue < -12) outcome = "critical failure";
    else if (resultValue < 0) outcome = "failure";
    else if (resultValue < 11) outcome = "success";
    else if (resultValue >= 11) outcome = "critical success";

    const rollText = this.world.formatter.format("rollResult", {
      actioner,
      actionerRoll,
      actionerModValue,
      actionee,
      actioneeRoll,
      actioneeModValue,
      resultValue,
      outcome,
    });
    this.world.console.bufferEvent("info", rollText);

    if (outcome === "success" || outcome === "critical success") {
      for (const key of this.effectMask.keys()) {
        if (this.effectMask.get(key)) {
          const originalValue = actionee.numAttrs.get(key);
          let newValue = originalValue;
          if (this.effectType === "set") {
            newValue = this.effectVal.get(key);
          } else if (this.effectType === "add") {
            let effectAmount = this.effectVal.get(key);
            if (outcome === "critical success") {
              effectAmount *= 2;
            }
            newValue = originalValue + effectAmount;
          }
          actionee.numAttrs.set(key, newValue);

          const effectText = this.world.formatter.format("effectApplied", {
            entity: actionee,
            key,
            originalValue,
            newValue,
            bonusText:
              outcome === "critical success" ? " (Critical Bonus!)" : "",
          });
          this.world.console.bufferEvent("battle", effectText);
        }
      }
    } else if (outcome === "critical failure") {
      const penaltyText = this.world.formatter.format("penalty", {
        entity: actioner,
        reason: "pays cost again due to critical failure.",
      });
      this.world.console.bufferEvent("battle", penaltyText);

      for (const key of this.cost.keys()) {
        if (this.cost.get(key) > 0) {
          const costAgain = this.cost.get(key);
          const newValue = Math.max(0, actioner.numAttrs.get(key) - costAgain);
          actioner.numAttrs.set(key, newValue);
          const costText = this.world.formatter.format("costPaid", {
            entity: actioner,
            resourceName: key,
            cost: costAgain,
            newValue,
          });
          this.world.console.bufferEvent("battle", costText);
        }
      }
    } else {
      const noEffectText = this.world.formatter.format("noEffect", { outcome });
      this.world.console.bufferEvent("battle", noEffectText);
    }

    return { outcome, resultValue };
  }

  toData() {
    return {
      name: this.name,
      type: this.type,
      description: this.description,
      cost: this.cost.toData(),
      actionerMod: this.actionerMod.toData(),
      actioneeMod: this.actioneeMod.toData(),
      effectVal: this.effectVal.toData(),
      effectType: this.effectType,
      effectMask: this.effectMask.toData(),
    };
  }
}

/**
 * Factory to create a specialized Action class.
 * @param {object} config - The action configuration.
 * @returns {typeof Action} A class that extends Action.
 */
function createActionClass(config) {
  const NewAction = class extends Action {
    constructor({ worldInstance }) {
      super({ ...config, worldInstance });
    }
  };

  NewAction.config = config;

  NewAction.fromData = function (data, { worldInstance }) {
    const newConfig = {
      ...data,
      cost: config.cost.constructor.fromData(data.cost),
      actionerMod: config.actionerMod.constructor.fromData(data.actionerMod),
      actioneeMod: config.actioneeMod.constructor.fromData(data.actioneeMod),
      effectVal: config.effectVal.constructor.fromData(data.effectVal),
      effectMask: config.effectMask.constructor.fromData(data.effectMask),
    };
    return new NewAction({ ...newConfig, worldInstance });
  };

  return NewAction;
}

module.exports = { iAction, Action, createActionClass, rollD20 };
