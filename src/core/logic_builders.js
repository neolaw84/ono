// src/core/logic_builders.js

/**
 * A builder for creating a directed graph to manage encounter phase transitions.
 */
class EncounterPhaseTransitionBuilder {
    constructor() {
        this.nodes = new Set(['__start__', '__end__']);
        this.edges = new Map();
    }

    addPhase(phase) {
        this.nodes.add(phase);
        return this;
    }

    addTransition(from, to, condition) {
        if (!this.nodes.has(from) || !this.nodes.has(to)) {
            throw new Error(`Both phases "${from}" and "${to}" must be added before creating a transition.`);
        }
        if (!this.edges.has(from)) {
            this.edges.set(from, []);
        }
        this.edges.get(from).push({ to, condition });
        return this;
    }

    build() {
        return {
            nodes: this.nodes,
            edges: this.edges,
            updateEncounterPhase: (worldInstance) => {
                if (!worldInstance.currentEncounter) return;
                const currentPhase = worldInstance.currentEncounter.phase;
                const possibleTransitions = this.edges.get(currentPhase) || [];
                for (const edge of possibleTransitions) {
                    if (edge.condition(worldInstance)) {
                        return edge.to;
                    }
                }
                return currentPhase;
            }
        };
    }
}


/**
 * A builder for creating a directed graph to manage action permissions.
 */
class ActionPermissionGraphBuilder {
    constructor() {
        this.adj = new Map();
    }

    _getNodeKey(EntityClass, phase) {
        return `${EntityClass.name}::${phase}`;
    }

    addPermission(FromEntityClass, ToEntityClass, inPhase, allowedActionClass) {
        const fromKey = this._getNodeKey(FromEntityClass, inPhase);
        const toKey = this._getNodeKey(ToEntityClass, inPhase);

        if (!this.adj.has(fromKey)) {
            this.adj.set(fromKey, []);
        }

        const edges = this.adj.get(fromKey);
        let edge = edges.find(e => e.to === toKey);

        if (!edge) {
            edge = { to: toKey, actions: new Set() };
            edges.push(edge);
        }

        edge.actions.add(allowedActionClass);
        return this;
    }
    
    build() {
        return {
            adj: this.adj,
            getNodeKey: this._getNodeKey.bind(this),
            isActionAllowedNow: (action, actioner, actionee, currentEncounter) => {
                if (!currentEncounter || !actioner || !actionee) return false;
                const currentPhase = currentEncounter.phase;
                const fromKey = this._getNodeKey(actioner.constructor, currentPhase);
                const toKey = this._getNodeKey(actionee.constructor, currentPhase);
                const edges = this.adj.get(fromKey) || [];
                const specificEdge = edges.find(e => e.to === toKey);
                return !!(specificEdge && specificEdge.actions.has(action.constructor));
            }
        };
    }
}

module.exports = { EncounterPhaseTransitionBuilder, ActionPermissionGraphBuilder };