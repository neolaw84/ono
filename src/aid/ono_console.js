class ONOConsole {
    constructor() {
        if (ONOConsole.instance) { return ONOConsole.instance; }
        
        this.hudTextParts = [];
        this.bufferedEvents = [];
        this.plotEssentials = "";
        this.authorsNote = "";

        ONOConsole.instance = this;
    }

    static getInstance() {
        if (!ONOConsole.instance) { ONOConsole.instance = new ONOConsole(); } 
        return ONOConsole.instance;
    }

    renderOnPlayerHUD(text) {
        this.hudTextParts.push(text);
    }

    flushPlayerHUD() {
        if (this.hudTextParts.length === 0) return "";
        const text = `You can take these actions: ${this.hudTextParts.join(', ')}.`;
        this.hudTextParts = []; 
        return `(((${text})))`;
    }
    
    flushEnvironment() {
        let frontMemory = "";
        let authorsNote = this.authorsNote;
        let context = this.plotEssentials;
        let message = "";

        for (const event of this.bufferedEvents) {
            const { name, data } = event;
            switch(name) {
                case 'action': 
                    frontMemory += `\n${data}`;
                    break;
                case 'critical': 
                    message += `\n${data}`;
                    break;
                case 'battle': 
                    authorsNote += `\n${data}`;
                    break;
                case "plot": 
                default:
                    context += `\n${data}`;
                    break;
                
            }
        }
                
        state.context = context.trim();
        state.frontMemory = frontMemory.trim();
        state.authorsNote = authorsNote.trim();
        state._message = message.trim();
        
        this.bufferedEvents = [];
    }

    getRawPlayerInput(text) {
        return text; 
    }

    parsePlayerInput(rawPlayerInput, world) {
        
        const commandRegex = /#([a-zA-Z0-9_]+)/;
        const match = rawPlayerInput.match(commandRegex);
        if (!match) {
            return ""; 
        }
        let playerCommand = match[1]; 

        const allowedMoves = world.getAllActionsAllowed(world.player);
        
        const validCommands = new Set();
        allowedMoves.forEach(move => {
            validCommands.add(`${move.actionName}_${move.targetIndex}`);
        });
        
        if (!playerCommand.includes('_')) {
            const defaultCommand = `${playerCommand}_0`;
            
            if (validCommands.has(defaultCommand)) {
                playerCommand = defaultCommand;
            }
        }

        if (validCommands.has(playerCommand)) {
            console.log(`Player command recognized: ${playerCommand}`);
            return playerCommand;
        } else {
            return ""; 
        }
    }

    

    bufferEvent(eventName, data) {
        this.bufferedEvents.push({ name: eventName, data });
    }

   
    
    toData() { return {}; }
    static fromData(data) { return ONOConsole.getInstance(); }
}

module.exports = { ONOConsole };
