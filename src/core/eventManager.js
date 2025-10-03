// src/core/eventManager.js

/**
 * A simple, stateless event bus for handling in-game events.
 */
class EventManager {
  #listeners = {};

  /**
   * Subscribes a callback function to a specific event.
   * @param {string} eventName - The name of the event to listen for.
   * @param {Function} callback - The function to execute when the event is published.
   */
  subscribe(eventName, callback) {
    if (!this.#listeners[eventName]) {
      this.#listeners[eventName] = [];
    }
    this.#listeners[eventName].push(callback);
  }
  
  /**
   * Publishes an event, triggering all subscribed callbacks.
   * @param {string} eventName - The name of the event to publish.
   * @param {any} [data] - The data payload to pass to the subscribers' callbacks.
   */
  publish(eventName, data) {
    if (this.#listeners[eventName]) {
      this.#listeners[eventName].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }
}

module.exports = { EventManager };