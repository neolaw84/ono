// src/core/inventory.js

class Inventory {
  #items = [];

  constructor(maxSize = 10) {
    this.maxSize = maxSize;
  }

  /**
   * Adds a game object (prop) to the inventory.
   * @param {import('../core/gameObject').GameObject} item
   * @returns {boolean} True if the item was added, false otherwise.
   */
  add(item) {
    if (this.#items.length >= this.maxSize) {
      console.warn(`Inventory is full. Cannot add ${item.name}.`);
      return false;
    }
    this.#items.push(item);
    return true;
  }

  /**
   * Removes a game object from the inventory by its UID.
   * @param {number} itemUid
   * @returns {import('../core/gameObject').GameObject | undefined} The removed item, or undefined if not found.
   */
  remove(itemUid) {
    const itemIndex = this.#items.findIndex((item) => item.uid === itemUid);
    if (itemIndex > -1) {
      return this.#items.splice(itemIndex, 1)[0];
    }
    return undefined;
  }

  /**
   * Returns a list of all items in the inventory.
   * @returns {import('../core/gameObject').GameObject[]}
   */
  list() {
    return [...this.#items];
  }

  /**
   * Finds an item by its name.
   * @param {string} itemName
   * @returns {import('../core/gameObject').GameObject | undefined}
   */
  find(itemName) {
    return this.#items.find(
      (item) => item.name.toLowerCase() === itemName.toLowerCase(),
    );
  }
}

module.exports = { Inventory };