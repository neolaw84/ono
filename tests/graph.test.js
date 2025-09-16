/**
 * @file Unit tests for the Graph Builder classes from core.js
 */
const { 
    EncounterPhaseTransitionBuilder, 
    ActionPermissionGraphBuilder,
    createEntityClass,
    createActionClass,
    createAttributesClass
} = require('../src/core.js');

describe('Graph Builders', () => {

    describe('EncounterPhaseTransitionBuilder', () => {
        it('should build a graph with nodes and edges', () => {
            const builder = new EncounterPhaseTransitionBuilder();
            const condition = () => true;

            const graph = builder
                .addPhase('phase1')
                .addPhase('phase2')
                .addTransition('__start__', 'phase1', condition)
                .addTransition('phase1', 'phase2', condition)
                .addTransition('phase2', '__end__', condition)
                .build();

            expect(graph.nodes.has('phase1')).toBe(true);
            expect(graph.edges.has('phase1')).toBe(true);
            expect(graph.edges.get('phase1')[0].to).toBe('phase2');
            expect(graph.edges.get('phase1')[0].condition).toBe(condition);
        });

        it('should throw an error if transitioning from a non-existent phase', () => {
            const builder = new EncounterPhaseTransitionBuilder();
            expect(() => {
                builder.addTransition('non_existent', '__end__', () => true);
            }).toThrow();
        });
    });

    describe('ActionPermissionGraphBuilder', () => {
        // Mock classes for testing
        const Stats = createAttributesClass(['hp']);
        const Player = createEntityClass({ type: 'Player', NumAttributesClass: Stats, TxtAttributesClass: Stats });
        const Orc = createEntityClass({ type: 'Orc', NumAttributesClass: Stats, TxtAttributesClass: Stats });
        const Strike = createActionClass({ name: 'Strike' });
        const Heal = createActionClass({ name: 'Heal' });

        it('should build a permission graph correctly', () => {
            const graph = new ActionPermissionGraphBuilder()
                .addPermission(Player, Orc, 'player_turn', Strike)
                .addPermission(Player, Player, 'player_turn', Heal)
                .build();
            
            const playerAttackKey = graph.getNodeKey(Player, 'player_turn');
            const playerHealKey = graph.getNodeKey(Player, 'player_turn');
            
            const attackEdges = graph.adj.get(playerAttackKey);
            const healEdges = graph.adj.get(playerHealKey);

            // Check Player -> Orc edge
            const attackEdge = attackEdges.find(e => e.to === graph.getNodeKey(Orc, 'player_turn'));
            expect(attackEdge).toBeDefined();
            expect(attackEdge.actions.has(Strike)).toBe(true);
            expect(attackEdge.actions.has(Heal)).toBe(true);

            // Check Player -> Player edge
            const healEdge = healEdges.find(e => e.to === graph.getNodeKey(Player, 'player_turn'));
            expect(healEdge).toBeDefined();
            expect(healEdge.actions.has(Heal)).toBe(true);
        });
    });
});