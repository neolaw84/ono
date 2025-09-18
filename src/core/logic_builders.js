// src/core/logic_builders.js

/**
 * A directed graph that manages game phase transitions.
 */
class PhaseGraph {
  constructor(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
  }

  updateGamePhase(worldInstance) {
    const currentPhase = worldInstance.gamePhase;
    const possibleTransitions = this.edges.get(currentPhase) || [];
    for (const edge of possibleTransitions) {
      if (edge.condition(worldInstance)) {
        return edge.to;
      }
    }
    return currentPhase;
  }

  toData() {
    return {};
  } // Not needed, rules are static
  static fromData(data) {
    return this;
  } // Not needed, rules are static
}

/**
 * A builder for creating a PhaseGraph.
 */
class PhaseGraphBuilder {
  constructor() {
    this.nodes = new Set(["__start__", "__end__"]);
    this.edges = new Map();
  }

  addPhase(phase) {
    this.nodes.add(phase);
    return this;
  }

  addTransition(from, to, condition) {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error(
        `Both phases "${from}" and "${to}" must be added before creating a transition.`,
      );
    }
    if (!this.edges.has(from)) {
      this.edges.set(from, []);
    }
    this.edges.get(from).push({ to, condition });
    return this;
  }

  build() {
    return new PhaseGraph(this.nodes, this.edges);
  }
}

/**
 * A directed graph that manages action permissions.
 */
class PermissionGraph {
  constructor(adj, getNodeKeyFn) {
    this.adj = adj;
    this.getNodeKey = getNodeKeyFn;
  }

  isActionAllowedNow(action, actioner, actionee, currentEncounter, gamePhase) {
    if (!currentEncounter || !actioner || !actionee) return false;
    const fromKey = this.getNodeKey(actioner.constructor, gamePhase);
    const toKey = this.getNodeKey(actionee.constructor, gamePhase);
    const edges = this.adj.get(fromKey) || [];
    const specificEdge = edges.find((e) => e.to === toKey);
    return !!(specificEdge && specificEdge.actions.has(action.constructor));
  }

  toData() {
    return {};
  } // Not needed, rules are static
  static fromData(data) {
    return this;
  } // Not needed, rules are static
}

/**
 * A builder for creating a PermissionGraph.
 */
class PermissionGraphBuilder {
  constructor() {
    this.adj = new Map();
  }

  _getNodeKey(EntityClass, phase) {
    return `${EntityClass.name}::${phase}`;
  }

  addPermission(
    FromEntityClass,
    ToEntityClass,
    inGamePhase,
    allowedActionClass,
  ) {
    const fromKey = this._getNodeKey(FromEntityClass, inGamePhase);
    const toKey = this._getNodeKey(ToEntityClass, inGamePhase);

    if (!this.adj.has(fromKey)) {
      this.adj.set(fromKey, []);
    }

    const edges = this.adj.get(fromKey);
    let edge = edges.find((e) => e.to === toKey);

    if (!edge) {
      edge = { to: toKey, actions: new Set() };
      edges.push(edge);
    }

    edge.actions.add(allowedActionClass);
    return this;
  }

  build() {
    return new PermissionGraph(this.adj, this._getNodeKey.bind(this));
  }
}

module.exports = {
  PhaseGraphBuilder,
  PermissionGraphBuilder,
  PhaseGraph,
  PermissionGraph,
};
