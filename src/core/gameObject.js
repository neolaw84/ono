// src/core/gameObject.js

class GameObject {
  static nextUid = 0;

  constructor({
    name,
    type,
    description,
    numAttrs = {},
    txtAttrs = {},
    NumAttributesClass,
    TxtAttributesClass,
  }) {
    if (!NumAttributesClass || !TxtAttributesClass) {
      throw new Error(
        "GameObject constructor requires both 'NumAttributesClass' and 'TxtAttributesClass'.",
      );
    }
    this.uid = GameObject.nextUid++;
    this.name = name;
    this.type = type;
    this.description = description;
    this.numAttrs = new NumAttributesClass(numAttrs);
    this.txtAttrs = new TxtAttributesClass(txtAttrs);
  }

  toData() {
    return {
      uid: this.uid,
      name: this.name,
      type: this.type,
      description: this.description,
      numAttrs: this.numAttrs.toData(),
      txtAttrs: this.txtAttrs.toData(),
    };
  }
}

/**
 * Factory to create a specialized GameObject class (e.g., Character, Prop).
 * @param {{type: string, description?: string, NumAttributesClass: typeof import('./attributes.js').iAttributes, TxtAttributesClass: typeof import('./attributes.js').iAttributes}} config
 * @returns {typeof GameObject} A class that extends GameObject.
 */
function createGameObjectClass({
  type,
  description,
  NumAttributesClass,
  TxtAttributesClass,
}) {
  if (!type || !NumAttributesClass || !TxtAttributesClass)
    throw new Error(
      "createGameObjectClass factory requires 'type', 'NumAttributesClass', and 'TxtAttributesClass'.",
    );

  const NewGameObject = class extends GameObject {
    constructor(instanceConfig) {
      super({
        ...instanceConfig,
        type: type,
        description: description || instanceConfig.description,
        NumAttributesClass: NumAttributesClass,
        TxtAttributesClass: TxtAttributesClass,
      });
    }
  };

  NewGameObject.NumAttributesClass = NumAttributesClass;
  NewGameObject.TxtAttributesClass = TxtAttributesClass;

  NewGameObject.fromData = function (data) {
    const instance = new this({
      name: data.name,
      description: data.description,
    });
    instance.uid = data.uid;
    instance.numAttrs = this.NumAttributesClass.fromData(data.numAttrs);
    instance.txtAttrs = this.TxtAttributesClass.fromData(data.txtAttrs);
    return instance;
  };

  return NewGameObject;
}

module.exports = { GameObject, createGameObjectClass };