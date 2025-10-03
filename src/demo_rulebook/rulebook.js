// src/demo_rulebook/rulebook.js

const { createCharacterBuilder } = require("../core/character");
const { ModeGraphBuilder } = require("../core/modeGraph");
const { FantasyEncounter } = require("./encounter");
const { ActionCommand } = require("./parser");
const { heavyStrikeAction, clubSmashAction, provokeAction } = require("./actions");
const { Player, Orc, CoreStats, TxtStats } = require("./characters"); // Import from the new character file


class Rulebook {
    static actions = {
        heavyStrike: heavyStrikeAction,
        clubSmash: clubSmashAction,
        provoke: provokeAction,
    };

    static initialize(gameState) {
        const player = createCharacterBuilder()
            .withType(Player)
            .withName("Aris")
            .withNumAttributesClass(CoreStats)
            .withTxtAttributesClass(TxtStats)
            .withNumAttrs({ hp: 50, maxHp: 50, mp: 10, maxMp: 10, agi: 5, str: 6 })
            .withTxtAttrs({ class: 'Warrior', attitude: 'friendly' })
            .build();
        const orc = createCharacterBuilder()
            .withType(Orc)
            .withName("Urg")
            .withNumAttributesClass(CoreStats)
            .withTxtAttributesClass(TxtStats)
            .withNumAttrs({ hp: 30, maxHp: 30, mp: 0, maxMp: 0, agi: 3, str: 5 })
            .withTxtAttrs({ class: 'Brute', attitude: 'neutral' }) // Orc is now neutral
            .build();
        gameState.party.push(player);
        gameState.npcs.push(orc);
    }
    
    static gameModeGraph = new ModeGraphBuilder()
      .addMode('__start__')
      .addMode('Exploration')
      .addMode('Combat')
      .addMode('__end__')
      .addTransition('__start__', 'Exploration', (gameState) => true) // Always start in Exploration
      .addTransition('Exploration', 'Combat', (gameState) => {
        return gameState.npcs.some(npc => npc.txtAttrs.get('attitude') === 'hostile' && npc.numAttrs.get('hp') > 0);
      })
      .addTransition('Combat', 'Exploration', (gameState) => {
        return gameState.currentEncounter === null;
      })
      .addTransition('Combat', '__end__', (gameState) => {
          // End the game if the player is defeated
          return gameState.party.every(p => p.numAttrs.get('hp') <= 0);
      })
      .build();
      
    static getAvailableActions(gameState) {
        const available = [];
        const player = gameState.party[0];

        if (gameState.currentGameMode === 'Combat' && gameState.currentEncounter) {
            if (player.numAttrs.get('mp') >= this.actions.heavyStrike.cost.get('mp')) {
                const targets = gameState.currentEncounter.participants.filter(p => p instanceof Orc && p.numAttrs.get('hp') > 0);
                if (targets.length > 0) {
                    available.push({ action: this.actions.heavyStrike, targets: targets });
                }
            }
        } else if (gameState.currentGameMode === 'Exploration') {
            const targets = gameState.npcs.filter(n => n.txtAttrs.get('attitude') === 'neutral');
            if (targets.length > 0) {
                available.push({ action: this.actions.provoke, targets });
            }
        }
        return available;
    }

    static determineTurnOrder(characters) {
        const withInitiative = characters.map(char => {
            const roll = Math.floor(Math.random() * 20) + 1;
            const agility = char.numAttrs.get('agi') || 0;
            return { character: char, score: roll + agility };
        });

        withInitiative.sort((a, b) => b.score - a.score);
        return withInitiative.map(item => item.character);
    }
    
    static createEncounter(participants, gameState) {
        const turnOrder = this.determineTurnOrder(participants);
        return new FantasyEncounter({ participants, turnOrder });
    }
    
    // --- NEW: AI Logic ---
    static getNpcAction(npc, gameState) {
        // Very simple AI: find a living player and smash them.
        const livingPlayers = gameState.party.filter(p => p.numAttrs.get('hp') > 0);
        if (livingPlayers.length > 0) {
            const target = livingPlayers[0];
            return new ActionCommand(this.actions.clubSmash, npc, target);
        }
        return null; // No one to attack
    }

    static updateWorldState(gameState, eventManager) {
        // 1. Check for encounter end conditions
        if (gameState.currentEncounter) {
            const status = gameState.currentEncounter.checkEndCondition();
            if (status !== 'ongoing') {
                gameState.currentEncounter = null;
                eventManager.publish('ENCOUNTER_ENDED', { status });
            }
        }
        
        const newMode = this.gameModeGraph.checkForTransition(gameState.currentGameMode, gameState);

        if (newMode && newMode !== gameState.currentGameMode) {
            const oldMode = gameState.currentGameMode;
            gameState.currentGameMode = newMode;
            eventManager.publish('GAME_MODE_CHANGED', { from: oldMode, to: newMode });
            
            // 3. If we entered combat, create the encounter
            if (newMode === 'Combat' && !gameState.currentEncounter) {
                const participants = [ ...gameState.party, ...gameState.npcs.filter(n => n.numAttrs.get('hp') > 0)];
                const encounter = this.createEncounter(participants, gameState);
                gameState.currentEncounter = encounter;
                eventManager.publish('ENCOUNTER_STARTED', { 
                    participants: encounter.participants,
                    turnOrder: encounter.turnOrder 
                });
            }
        }
    }
}

module.exports = { Rulebook };