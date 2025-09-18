// src/core/attributes.js

class iAttributes {
  constructor() {
    if (this.constructor === iAttributes)
      throw new Error(
        "Abstract class 'iAttributes' cannot be instantiated directly.",
      );
  }
  get(key) {
    throw new Error("Method 'get(key)' must be implemented.");
  }
  set(key, value) {
    throw new Error("Method 'set(key, value)' must be implemented.");
  }
  keys() {
    throw new Error("Method 'keys()' must be implemented.");
  }
  toArray() {
    throw new Error("Method 'toArray()' must be implemented.");
  }
  fromArray() {
    throw new Error("Method 'fromArray()' must be implemented.");
  }
  toData() {
    throw new Error("Method 'toData()' must be implemented.");
  }
  static fromData(data) {
    throw new Error("Static method 'fromData()' must be implemented.");
  }
}

/**
 * Factory to create a specialized Attributes class.
 * @param {string[]} definedKeys - An array of strings representing the attribute keys.
 * @returns {typeof iAttributes} A class that extends iAttributes.
 */
function createAttributesClass(definedKeys) {
  const AttrClass = class extends iAttributes {
    #_keys = [];
    values = {};
    constructor(initialValues = {}) {
      super();
      this.#_keys = [...definedKeys];
      for (const key of this.#_keys) {
        this.values[key] =
          initialValues[key] ??
          (typeof initialValues[key] === "boolean" ? false : 0);
      }
    }
    toArray() {
      return this.#_keys.map((key) => this.values[key]);
    }
    fromArray(array) {
      this.#_keys.forEach((key, index) => {
        if (array[index] !== undefined) {
          this.values[key] = array[index];
        }
      });
    }
    get(key) {
      return this.values[key];
    }
    set(key, value) {
      if (this.#_keys.includes(key)) {
        this.values[key] = value;
      }
    }
    keys() {
      return [...this.#_keys];
    }
    toData() {
      return { values: this.values };
    }
  };

  AttrClass.fromData = function (data) {
    const instance = new this();
    for (const key of instance.keys()) {
      if (data.values && key in data.values) {
        instance.set(key, data.values[key]);
      }
    }
    return instance;
  };

  return AttrClass;
}

module.exports = { iAttributes, createAttributesClass };
